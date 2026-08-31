// server/routes/inventory.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createInventorySession, scanInventoryItem, completeInventorySession } from '../services/inventory.service.js';
import { dbQuery } from '../db/pool.js';

const router = Router();

const createSessionSchema = z.object({
  session_name: z.string().min(2, 'Session name is required'),
  session_number: z.string().optional(),
  office_id: z.string().optional(),
  location_id: z.string().optional(),
  category_id: z.string().optional(),
  notes: z.string().optional(),
});

const scanItemSchema = z.object({
  scanned_asset_number: z.string().min(1, 'Asset Number or barcode is required'),
  actual_location_id: z.string().optional(),
  actual_custodian_id: z.string().optional().nullable(),
  condition_status: z.string().optional(),
  notes: z.string().optional(),
});

// List Inventory Sessions
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const sessions = await dbQuery(`
      SELECT s.*, o.office_name, l.location_name, c.name AS category_name, u.username AS created_by_username,
             (SELECT COUNT(*) FROM inventory_items i WHERE i.inventory_session_id = s.id) AS total_items,
             (SELECT COUNT(*) FROM inventory_items i WHERE i.inventory_session_id = s.id AND i.result_status = 'MATCHED') AS matched_count,
             (SELECT COUNT(*) FROM inventory_items i WHERE i.inventory_session_id = s.id AND i.result_status = 'MISSING') AS missing_count,
             (SELECT COUNT(*) FROM inventory_items i WHERE i.inventory_session_id = s.id AND i.result_status = 'PENDING') AS pending_count
      FROM inventory_sessions s
      LEFT JOIN offices o ON s.office_id = o.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN asset_categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.created_by_user_id = u.id
      ORDER BY s.started_at DESC
    `);
    res.json({ success: true, data: sessions.rows });
  } catch (err) {
    next(err);
  }
});

// Get Session Details & Items
router.get('/sessions/:id', authenticate, async (req, res, next) => {
  try {
    const sessionRes = await dbQuery(
      `SELECT s.*, o.office_name, l.location_name, c.name AS category_name,
              u1.username AS created_by_username, u2.username AS completed_by_username
       FROM inventory_sessions s
       LEFT JOIN offices o ON s.office_id = o.id
       LEFT JOIN locations l ON s.location_id = l.id
       LEFT JOIN asset_categories c ON s.category_id = c.id
       LEFT JOIN users u1 ON s.created_by_user_id = u1.id
       LEFT JOIN users u2 ON s.completed_by_user_id = u2.id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inventory session not found' } });
      return;
    }

    const itemsRes = await dbQuery(
      `SELECT i.*, a.full_asset_number, a.item_description, a.brand_name, a.model, a.serial_number_1,
              el.location_name AS expected_location_name, al.location_name AS actual_location_name,
              ee.full_name AS expected_custodian_name, ae.full_name AS actual_custodian_name,
              u.username AS scanned_by_username
       FROM inventory_items i
       LEFT JOIN assets a ON i.asset_id = a.id
       LEFT JOIN locations el ON i.expected_location_id = el.id
       LEFT JOIN locations al ON i.actual_location_id = al.id
       LEFT JOIN employees ee ON i.expected_custodian_id = ee.id
       LEFT JOIN employees ae ON i.actual_custodian_id = ae.id
       LEFT JOIN users u ON i.scanned_by_user_id = u.id
       WHERE i.inventory_session_id = $1
       ORDER BY i.scanned_at DESC NULLS LAST, i.created_at ASC`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        session: sessionRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Create Inventory Session
router.post('/sessions', authenticate, requirePermission('INVENTORY_START'), validateBody(createSessionSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const sessionId = await createInventorySession(req.body, req.user!.id);
    res.status(201).json({ success: true, data: { session_id: sessionId } });
  } catch (err) {
    next(err);
  }
});

// Scan item into session
router.post('/sessions/:id/scan', authenticate, requirePermission('INVENTORY_SCAN'), validateBody(scanItemSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await scanInventoryItem(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Complete Inventory Session
router.post('/sessions/:id/complete', authenticate, requirePermission('INVENTORY_COMPLETE'), async (req: AuthenticatedRequest, res, next) => {
  try {
    await completeInventorySession(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Inventory audit completed and reconciliation finalized.' });
  } catch (err) {
    next(err);
  }
});

export default router;
