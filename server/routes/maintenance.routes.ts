// server/routes/maintenance.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { dbQuery, dbTransaction } from '../db/pool.js';
import { recordAuditLog } from '../services/audit.service.js';

const router = Router();

const createMaintenanceSchema = z.object({
  asset_id: z.string().min(1, 'Asset is required'),
  issue_description: z.string().min(3, 'Issue description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  sent_to: z.string().optional().nullable(),
  estimated_cost: z.number().optional().nullable(),
  currency: z.string().default('USD'),
  reported_by_employee_id: z.string().optional().nullable(),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'SENT_TO_VENDOR', 'RESOLVED', 'CANCELLED', 'CANNOT_BE_REPAIRED']),
  resolution_notes: z.string().optional().nullable(),
  actual_cost: z.number().optional().nullable(),
  resolved_condition: z.enum(['OK', 'GOOD', 'FAIR', 'DAMAGED', 'DISPOSED']).optional(),
});

// List Maintenance Tickets
router.get('/', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery(`
      SELECT mr.*, a.full_asset_number, a.item_description, a.brand_name, a.model,
             e.full_name AS reported_by_employee_name, u.username AS reported_by_username
      FROM maintenance_requests mr
      JOIN assets a ON mr.asset_id = a.id
      LEFT JOIN employees e ON mr.reported_by_employee_id = e.id
      LEFT JOIN users u ON mr.reported_by_user_id = u.id
      ORDER BY mr.opened_at DESC
    `);
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

// Create Maintenance Ticket
router.post('/', authenticate, requirePermission('MAINTENANCE_MANAGE'), validateBody(createMaintenanceSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = req.body;
    const reqNumber = `MNT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const result = await dbTransaction(async (query) => {
      const insRes = await query(
        `INSERT INTO maintenance_requests (
          request_number, asset_id, reported_by_employee_id, reported_by_user_id,
          issue_description, priority, status, sent_to, estimated_cost, currency
        ) VALUES ($1, $2, $3, $4, $5, 'OPEN', $6, $7, $8, $9) RETURNING *`,
        [
          reqNumber,
          data.asset_id,
          data.reported_by_employee_id || null,
          req.user!.id,
          data.issue_description,
          data.priority,
          data.sent_to || null,
          data.estimated_cost || null,
          data.currency || 'USD',
        ]
      );

      // Update asset condition to NEEDS_REPAIR
      await query("UPDATE assets SET condition_status = 'NEEDS_REPAIR', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [data.asset_id]);

      await query(
        `INSERT INTO asset_movements (asset_id, movement_type, movement_date, reference_number, notes, performed_by_user_id)
         VALUES ($1, 'SENT_FOR_REPAIR', CURRENT_TIMESTAMP, $2, $3, $4)`,
        [data.asset_id, reqNumber, `Maintenance ticket created: ${data.issue_description}`, req.user!.id]
      );

      return insRes.rows[0];
    });

    await recordAuditLog({
      userId: req.user!.id,
      action: 'CREATE_MAINTENANCE_TICKET',
      entityType: 'MAINTENANCE',
      entityId: result.id,
      newValues: result,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Update Maintenance Status
router.patch('/:id', authenticate, requirePermission('MAINTENANCE_MANAGE'), validateBody(updateMaintenanceSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, resolution_notes, actual_cost, resolved_condition } = req.body;

    const result = await dbTransaction(async (query) => {
      const ticketRes = await query('SELECT * FROM maintenance_requests WHERE id = $1', [req.params.id]);
      if (ticketRes.rows.length === 0) {
        throw new Error('Maintenance ticket not found.');
      }
      const ticket = ticketRes.rows[0];

      const isClosing = ['RESOLVED', 'CANCELLED', 'CANNOT_BE_REPAIRED'].includes(status);

      const updRes = await query(
        `UPDATE maintenance_requests SET 
          status = $1,
          resolution_notes = COALESCE($2, resolution_notes),
          actual_cost = COALESCE($3, actual_cost),
          closed_at = ${isClosing ? 'CURRENT_TIMESTAMP' : 'closed_at'},
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 RETURNING *`,
        [status, resolution_notes || null, actual_cost || null, req.params.id]
      );

      if (status === 'RESOLVED') {
        const cond = resolved_condition || 'OK';
        await query('UPDATE assets SET condition_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [cond, ticket.asset_id]);
        await query(
          `INSERT INTO asset_movements (asset_id, movement_type, movement_date, reference_number, notes, performed_by_user_id)
           VALUES ($1, 'RETURNED_FROM_REPAIR', CURRENT_TIMESTAMP, $2, $3, $4)`,
          [ticket.asset_id, ticket.request_number, resolution_notes || 'Repaired and restored to active state', req.user!.id]
        );
      }

      return updRes.rows[0];
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
