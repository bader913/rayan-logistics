// server/routes/employees.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { dbQuery } from '../db/pool.js';
import { recordAuditLog } from '../services/audit.service.js';

const router = Router();

const createEmployeeSchema = z.object({
  employee_number: z.string().min(1, 'Employee Number is required'),
  full_name: z.string().min(2, 'Full name is required'),
  department_id: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  employment_status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED']).default('ACTIVE'),
  notes: z.string().optional().nullable(),
});

// List Employees
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, department_id, status } = req.query;
    const conds: string[] = ['e.deleted_at IS NULL'];
    const params: any[] = [];
    let idx = 1;

    if (search) {
      conds.push(`(LOWER(e.full_name) LIKE $${idx} OR LOWER(e.employee_number) LIKE $${idx} OR LOWER(e.email) LIKE $${idx})`);
      params.push(`%${String(search).trim().toLowerCase()}%`);
      idx++;
    }

    if (department_id) {
      conds.push(`e.department_id = $${idx++}`);
      params.push(department_id);
    }

    if (status) {
      conds.push(`e.employment_status = $${idx++}`);
      params.push(status);
    }

    const sql = `
      SELECT e.*, d.department_name, o.office_name,
             (SELECT COUNT(*) FROM asset_assignments a WHERE a.employee_id = e.id AND a.is_current = TRUE) AS active_custody_count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN offices o ON d.office_id = o.id
      WHERE ${conds.join(' AND ')}
      ORDER BY e.full_name ASC
    `;

    const employees = await dbQuery(sql, params);
    res.json({ success: true, data: employees.rows });
  } catch (err) {
    next(err);
  }
});

// Single Employee & Current Custody List
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const empRes = await dbQuery(
      `SELECT e.*, d.department_name, o.office_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN offices o ON d.office_id = o.id
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [req.params.id]
    );

    if (empRes.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
      return;
    }

    // Active Custody Assets
    const custodyRes = await dbQuery(
      `SELECT a.*, asgn.id AS assignment_id, asgn.assignment_date, asgn.assignment_condition, asgn.assignment_notes,
              c.name AS category_name, l.location_name
       FROM asset_assignments asgn
       JOIN assets a ON asgn.asset_id = a.id
       LEFT JOIN asset_categories c ON a.category_id = c.id
       LEFT JOIN locations l ON a.current_location_id = l.id
       WHERE asgn.employee_id = $1 AND asgn.is_current = TRUE AND a.deleted_at IS NULL
       ORDER BY asgn.assignment_date DESC`,
      [req.params.id]
    );

    // Historical Assignment Logs
    const historyRes = await dbQuery(
      `SELECT asgn.*, a.full_asset_number, a.item_description, a.brand_name, a.model,
              u1.username AS assigned_by_username, u2.username AS returned_by_username
       FROM asset_assignments asgn
       JOIN assets a ON asgn.asset_id = a.id
       LEFT JOIN users u1 ON asgn.assigned_by_user_id = u1.id
       LEFT JOIN users u2 ON asgn.returned_by_user_id = u2.id
       WHERE asgn.employee_id = $1 AND asgn.is_current = FALSE
       ORDER BY asgn.returned_at DESC LIMIT 20`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        employee: empRes.rows[0],
        current_custody: custodyRes.rows,
        custody_history: historyRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Create Employee
router.post('/', authenticate, requirePermission('EMPLOYEE_MANAGE'), validateBody(createEmployeeSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = req.body;
    const existing = await dbQuery('SELECT id FROM employees WHERE employee_number = $1', [data.employee_number]);
    if (existing.rows.length > 0) {
      res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: `Employee with number ${data.employee_number} already exists.` } });
      return;
    }

    const insRes = await dbQuery(
      `INSERT INTO employees (employee_number, full_name, department_id, job_title, email, phone, employment_status, is_active, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8) RETURNING *`,
      [data.employee_number, data.full_name, data.department_id || null, data.job_title || null, data.email || null, data.phone || null, data.employment_status || 'ACTIVE', data.notes || null]
    );

    await recordAuditLog({
      userId: req.user!.id,
      action: 'CREATE_EMPLOYEE',
      entityType: 'EMPLOYEE',
      entityId: insRes.rows[0].id,
      newValues: insRes.rows[0],
    });

    res.status(201).json({ success: true, data: insRes.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
