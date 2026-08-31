// server/routes/admin.routes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  authenticate,
  requireRole,
  AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  checkDbConnection,
  dbQuery,
  dbTransaction,
} from '../db/pool.js';

const router = Router();

const resetSchema = z.object({
  confirmation: z.literal('DELETE ALL DATA'),
  password: z.string().min(1, 'Administrator password is required'),
});

router.post(
  '/reset-operational-data',
  authenticate,
  requireRole(['ADMIN']),
  validateBody(resetSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const health = await checkDbConnection();

      if (!health.connected || health.engine !== 'PostgreSQL') {
        res.status(503).json({
          success: false,
          error: {
            code: 'POSTGRES_REQUIRED',
            message: 'Database reset is allowed only when PostgreSQL is connected.',
          },
        });
        return;
      }

      const currentUser = await dbQuery(
        `SELECT id, username, password_hash
         FROM users
         WHERE id = $1
           AND is_active = TRUE
           AND deleted_at IS NULL`,
        [req.user!.id]
      );

      if (currentUser.rows.length !== 1) {
        res.status(401).json({
          success: false,
          error: {
            code: 'ADMIN_NOT_FOUND',
            message: 'The current administrator account was not found.',
          },
        });
        return;
      }

      const passwordMatches = await bcrypt.compare(
        req.body.password,
        currentUser.rows[0].password_hash
      );

      if (!passwordMatches) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_ADMIN_PASSWORD',
            message: 'The administrator password is incorrect.',
          },
        });
        return;
      }

      const result = await dbTransaction(async (query) => {
        const beforeResult = await query(`
          SELECT json_build_object(
            'assets', (SELECT COUNT(*) FROM assets),
            'employees', (SELECT COUNT(*) FROM employees),
            'users', (SELECT COUNT(*) FROM users),
            'inventorySessions', (SELECT COUNT(*) FROM inventory_sessions),
            'maintenanceRequests', (SELECT COUNT(*) FROM maintenance_requests),
            'importBatches', (SELECT COUNT(*) FROM import_batches)
          ) AS counts
        `);

        await query(
          'UPDATE users SET employee_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [req.user!.id]
        );

        // Delete dependent operational records in foreign-key-safe order.
        // TRUNCATE CASCADE must not be used here because truncating
        // employees can also truncate users and remove the preserved admin.
        await query('DELETE FROM import_issues');
        await query('DELETE FROM inventory_items');
        await query('DELETE FROM maintenance_requests');
        await query('DELETE FROM asset_disposals');
        await query('DELETE FROM asset_documents');
        await query('DELETE FROM asset_movements');
        await query('DELETE FROM asset_assignments');
        await query('DELETE FROM inventory_sessions');
        await query('DELETE FROM import_batches');
        await query('DELETE FROM audit_logs');
        await query('DELETE FROM assets');

        // Remove every application user except the administrator
        // currently performing the reset.
        await query(
          'DELETE FROM users WHERE id <> $1',
          [req.user!.id]
        );

        await query('DELETE FROM employees');
        await query('DELETE FROM asset_subcategories');
        await query('DELETE FROM cost_centers');
        await query('DELETE FROM locations');
        await query('DELETE FROM asset_categories');
        await query('DELETE FROM donors');
        await query('DELETE FROM departments');
        await query('DELETE FROM offices');

        await query(
          'DELETE FROM users WHERE id <> $1',
          [req.user!.id]
        );

        await query(
          `INSERT INTO audit_logs (
             user_id,
             action,
             entity_type,
             entity_id,
             old_values,
             new_values,
             ip_address,
             user_agent
           )
           VALUES ($1, 'RESET_OPERATIONAL_DATA', 'SYSTEM', NULL, $2::jsonb, $3::jsonb, $4, $5)`,
          [
            req.user!.id,
            JSON.stringify(beforeResult.rows[0]?.counts || {}),
            JSON.stringify({
              preservedAdministrator: currentUser.rows[0].username,
              operationalDataCleared: true,
            }),
            req.ip || null,
            req.get('user-agent') || null,
          ]
        );

        return beforeResult.rows[0]?.counts || {};
      });

      res.json({
        success: true,
        data: {
          cleared: true,
          preservedAdministrator: currentUser.rows[0].username,
          previousCounts: result,
        },
        message: 'All operational data was deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
