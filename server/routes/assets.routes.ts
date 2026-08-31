// server/routes/assets.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { listAssets, getAssetById, createAsset, assignAsset, returnAsset, transferAsset } from '../services/asset.service.js';
import { dbQuery } from '../db/pool.js';

const router = Router();

const createAssetSchema = z.object({
  full_asset_number: z.string().optional(),
  asset_number: z.string().optional(),
  item_description: z.string().min(2, 'Item description is required'),
  asset_type: z.enum(['EQUIPMENT', 'FURNITURE', 'VEHICLE', 'IT_HARDWARE', 'APPLIANCE', 'OTHER']).optional(),
  category_id: z.string().optional().nullable(),
  subcategory_id: z.string().optional().nullable(),
  brand_name: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serial_number_1: z.string().optional().nullable(),
  serial_number_2: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  invoice_cost_syp: z.number().optional().nullable(),
  currency: z.string().optional(),
  invoice_cost_usd: z.number().optional().nullable(),
  donor_id: z.string().optional().nullable(),
  cost_center_id: z.string().optional().nullable(),
  gl_account: z.string().optional().nullable(),
  lin: z.string().optional().nullable(),
  office_id: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  payment_voucher_number: z.string().optional().nullable(),
  pr_number: z.string().optional().nullable(),
  po_number: z.string().optional().nullable(),
  grn_number: z.string().optional().nullable(),
  date_received: z.string().optional().nullable(),
  registered_by: z.string().optional().nullable(),
  lifecycle_status: z.string().optional(),
  condition_status: z.string().optional(),
  current_location_id: z.string().optional().nullable(),
  current_custodian_employee_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const assignSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  assigned_location_id: z.string().optional(),
  assignment_date: z.string().optional(),
  expected_return_date: z.string().optional(),
  assignment_condition: z.string().optional(),
  assignment_notes: z.string().optional(),
});

const returnSchema = z.object({
  to_location_id: z.string().min(1, 'Return location is required'),
  return_condition: z.string().optional(),
  return_notes: z.string().optional(),
});

const transferSchema = z.object({
  to_location_id: z.string().min(1, 'Target location is required'),
  to_office_id: z.string().optional(),
  notes: z.string().optional(),
});

// List Assets with search, filters, pagination
router.get('/', authenticate, requirePermission('ASSET_VIEW'), async (req, res, next) => {
  try {
    const result = await listAssets(req.query as any);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
});

// Export assets as CSV
router.get('/export/csv', authenticate, requirePermission('ASSET_VIEW'), async (req, res, next) => {
  try {
    const result = await listAssets({ ...(req.query as any), limit: 10000, page: 1 });
    const headers = [
      'Asset Number',
      'Normalized ID',
      'Description',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'Location',
      'Custodian',
      'Lifecycle Status',
      'Condition',
      'Cost USD',
      'Date Received',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.join(','),
      ...result.data.map((r: any) =>
        [
          escapeCsv(r.full_asset_number || r.asset_number),
          escapeCsv(r.normalized_asset_number),
          escapeCsv(r.item_description),
          escapeCsv(r.category_name),
          escapeCsv(r.brand_name),
          escapeCsv(r.model),
          escapeCsv(r.serial_number_1),
          escapeCsv(r.current_location_name),
          escapeCsv(r.custodian_name),
          escapeCsv(r.lifecycle_status),
          escapeCsv(r.condition_status),
          escapeCsv(r.invoice_cost_usd),
          escapeCsv(r.date_received),
        ].join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rayan_assets_export_${Date.now()}.csv"`);
    res.send(csvLines.join('\n'));
  } catch (err) {
    next(err);
  }
});

// Single Asset Details
router.get('/:id', authenticate, requirePermission('ASSET_VIEW'), async (req, res, next) => {
  try {
    const asset = await getAssetById(req.params.id);
    if (!asset) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } });
      return;
    }
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// Asset Lifecycle & Movement History
router.get('/:id/history', authenticate, requirePermission('ASSET_VIEW'), async (req, res, next) => {
  try {
    const [movements, assignments, maintenance] = await Promise.all([
      dbQuery(
        `SELECT m.*, fl.location_name AS from_location_name, tl.location_name AS to_location_name,
                fe.full_name AS from_employee_name, te.full_name AS to_employee_name,
                u.username AS performed_by_username
         FROM asset_movements m
         LEFT JOIN locations fl ON m.from_location_id = fl.id
         LEFT JOIN locations tl ON m.to_location_id = tl.id
         LEFT JOIN employees fe ON m.from_employee_id = fe.id
         LEFT JOIN employees te ON m.to_employee_id = te.id
         LEFT JOIN users u ON m.performed_by_user_id = u.id
         WHERE m.asset_id = $1
         ORDER BY m.movement_date DESC, m.created_at DESC`,
        [req.params.id]
      ),
      dbQuery(
        `SELECT a.*, e.full_name AS employee_name, e.employee_number,
                l.location_name AS assigned_location_name,
                u1.username AS assigned_by_username, u2.username AS returned_by_username
         FROM asset_assignments a
         JOIN employees e ON a.employee_id = e.id
         LEFT JOIN locations l ON a.assigned_location_id = l.id
         LEFT JOIN users u1 ON a.assigned_by_user_id = u1.id
         LEFT JOIN users u2 ON a.returned_by_user_id = u2.id
         WHERE a.asset_id = $1
         ORDER BY a.assignment_date DESC`,
        [req.params.id]
      ),
      dbQuery(
        `SELECT mr.*, e.full_name AS reported_by_employee_name
         FROM maintenance_requests mr
         LEFT JOIN employees e ON mr.reported_by_employee_id = e.id
         WHERE mr.asset_id = $1
         ORDER BY mr.opened_at DESC`,
        [req.params.id]
      ),
    ]);

    res.json({
      success: true,
      data: {
        movements: movements.rows,
        assignments: assignments.rows,
        maintenance: maintenance.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Create Asset
router.post('/', authenticate, requirePermission('ASSET_CREATE'), validateBody(createAssetSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const assetId = await createAsset(req.body, req.user!.id);
    const created = await getAssetById(assetId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// Assign Asset (Custody)
router.post('/:id/assign', authenticate, requirePermission('ASSET_ASSIGN'), validateBody(assignSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await assignAsset(req.params.id, req.body, req.user!.id);
    const updated = await getAssetById(req.params.id);
    res.json({ success: true, message: 'Asset successfully assigned to employee.', data: updated });
  } catch (err) {
    next(err);
  }
});

// Return Asset (End Custody)
router.post('/:id/return', authenticate, requirePermission('ASSET_RETURN'), validateBody(returnSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await returnAsset(req.params.id, req.body, req.user!.id);
    const updated = await getAssetById(req.params.id);
    res.json({ success: true, message: 'Asset successfully returned to inventory.', data: updated });
  } catch (err) {
    next(err);
  }
});

// Transfer Asset Location
router.post('/:id/transfer', authenticate, requirePermission('ASSET_TRANSFER'), validateBody(transferSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    await transferAsset(req.params.id, req.body, req.user!.id);
    const updated = await getAssetById(req.params.id);
    res.json({ success: true, message: 'Asset location updated.', data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
