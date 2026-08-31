// server/routes/dashboard.routes.ts
import { Router } from 'express';
import { dbQuery } from '../db/pool.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Key Dashboard KPI Metrics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [
      totalAssetsRes,
      currentlyHeldRes,
      inStockRes,
      underRepairRes,
      missingRes,
      totalEmployeesRes,
      activeCustodiesRes,
      activeSessionsRes,
      totalValuationRes,
    ] = await Promise.all([
      dbQuery("SELECT COUNT(*) AS count FROM assets WHERE deleted_at IS NULL"),
      dbQuery("SELECT COUNT(*) AS count FROM assets WHERE deleted_at IS NULL AND lifecycle_status = 'CURRENTLY_HELD' AND current_custodian_employee_id IS NOT NULL"),
      dbQuery("SELECT COUNT(*) AS count FROM assets WHERE deleted_at IS NULL AND lifecycle_status = 'CURRENTLY_HELD' AND current_custodian_employee_id IS NULL"),
      dbQuery("SELECT COUNT(*) AS count FROM assets WHERE deleted_at IS NULL AND (condition_status = 'NEEDS_REPAIR' OR lifecycle_status = 'UNDER_MAINTENANCE')"),
      dbQuery("SELECT COUNT(*) AS count FROM assets WHERE deleted_at IS NULL AND lifecycle_status = 'MISSING'"),
      dbQuery("SELECT COUNT(*) AS count FROM employees WHERE deleted_at IS NULL AND is_active = TRUE"),
      dbQuery("SELECT COUNT(*) AS count FROM asset_assignments WHERE is_current = TRUE"),
      dbQuery("SELECT COUNT(*) AS count FROM inventory_sessions WHERE status = 'IN_PROGRESS'"),
      dbQuery("SELECT COALESCE(SUM(invoice_cost_usd), 0) AS total_val FROM assets WHERE deleted_at IS NULL"),
    ]);

    res.json({
      success: true,
      data: {
        totalAssets: parseInt(totalAssetsRes.rows[0]?.count || '0', 10),
        assignedAssets: parseInt(currentlyHeldRes.rows[0]?.count || '0', 10),
        inStockAssets: parseInt(inStockRes.rows[0]?.count || '0', 10),
        underRepairAssets: parseInt(underRepairRes.rows[0]?.count || '0', 10),
        missingAssets: parseInt(missingRes.rows[0]?.count || '0', 10),
        activeEmployees: parseInt(totalEmployeesRes.rows[0]?.count || '0', 10),
        activeCustodies: parseInt(activeCustodiesRes.rows[0]?.count || '0', 10),
        activeInventoryAudits: parseInt(activeSessionsRes.rows[0]?.count || '0', 10),
        totalValuationUsd: parseFloat(totalValuationRes.rows[0]?.total_val || '0'),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Category & Condition distribution for Charts
router.get('/charts', authenticate, async (req, res, next) => {
  try {
    const [categoryDist, conditionDist, locationDist, recentMovements] = await Promise.all([
      dbQuery(`
        SELECT COALESCE(c.name, 'Uncategorized') AS label, COUNT(a.id) AS value
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.id
        WHERE a.deleted_at IS NULL
        GROUP BY c.name
        ORDER BY value DESC
      `),
      dbQuery(`
        SELECT condition_status AS label, COUNT(id) AS value
        FROM assets
        WHERE deleted_at IS NULL
        GROUP BY condition_status
        ORDER BY value DESC
      `),
      dbQuery(`
        SELECT COALESCE(l.location_name, 'Unassigned') AS label, COUNT(a.id) AS value
        FROM assets a
        LEFT JOIN locations l ON a.current_location_id = l.id
        WHERE a.deleted_at IS NULL
        GROUP BY l.location_name
        ORDER BY value DESC
        LIMIT 8
      `),
      dbQuery(`
        SELECT m.*, a.full_asset_number, a.item_description,
               fe.full_name AS from_employee_name, te.full_name AS to_employee_name,
               tl.location_name AS to_location_name, u.username AS performed_by_username
        FROM asset_movements m
        JOIN assets a ON m.asset_id = a.id
        LEFT JOIN employees fe ON m.from_employee_id = fe.id
        LEFT JOIN employees te ON m.to_employee_id = te.id
        LEFT JOIN locations tl ON m.to_location_id = tl.id
        LEFT JOIN users u ON m.performed_by_user_id = u.id
        ORDER BY m.movement_date DESC, m.created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      success: true,
      data: {
        categoryDistribution: categoryDist.rows,
        conditionDistribution: conditionDist.rows,
        locationDistribution: locationDist.rows,
        recentMovements: recentMovements.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Audit Logs
router.get('/audit-logs', authenticate, async (req, res, next) => {
  try {
    const logs = await dbQuery(`
      SELECT l.*, u.username, u.email
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: logs.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
