// server/services/asset.service.ts
import { dbQuery, dbTransaction } from '../db/pool.js';
import { normalizeAssetNumber, normalizeConditionStatus, normalizeLifecycleStatus } from '../utils/asset-normalizer.js';
import { recordAuditLog } from './audit.service.js';

export interface AssetFilterQuery {
  search?: string;
  lifecycle_status?: string;
  condition_status?: string;
  category_id?: string;
  subcategory_id?: string;
  location_id?: string;
  employee_id?: string;
  donor_id?: string;
  office_id?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_dir?: 'ASC' | 'DESC';
}

export async function listAssets(filters: AssetFilterQuery) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['deleted_at IS NULL'];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters.search) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    const normalizedTerm = `%${normalizeAssetNumber(filters.search)}%`;
    conditions.push(`(
      LOWER(full_asset_number) LIKE $${paramIdx} OR
      LOWER(item_description) LIKE $${paramIdx} OR
      LOWER(serial_number_1) LIKE $${paramIdx} OR
      LOWER(serial_number_2) LIKE $${paramIdx} OR
      LOWER(brand_name) LIKE $${paramIdx} OR
      LOWER(model) LIKE $${paramIdx} OR
      normalized_asset_number LIKE $${paramIdx + 1}
    )`);
    params.push(term, normalizedTerm);
    paramIdx += 2;
  }

  if (filters.lifecycle_status) {
    conditions.push(`lifecycle_status = $${paramIdx++}`);
    params.push(filters.lifecycle_status);
  }

  if (filters.condition_status) {
    conditions.push(`condition_status = $${paramIdx++}`);
    params.push(filters.condition_status);
  }

  if (filters.category_id) {
    conditions.push(`category_id = $${paramIdx++}`);
    params.push(filters.category_id);
  }

  if (filters.subcategory_id) {
    conditions.push(`subcategory_id = $${paramIdx++}`);
    params.push(filters.subcategory_id);
  }

  if (filters.location_id) {
    conditions.push(`current_location_id = $${paramIdx++}`);
    params.push(filters.location_id);
  }

  if (filters.employee_id) {
    conditions.push(`current_custodian_employee_id = $${paramIdx++}`);
    params.push(filters.employee_id);
  }

  if (filters.donor_id) {
    conditions.push(`donor_id = $${paramIdx++}`);
    params.push(filters.donor_id);
  }

  if (filters.office_id) {
    conditions.push(`office_id = $${paramIdx++}`);
    params.push(filters.office_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) AS total FROM assets ${whereClause}`;
  const countRes = await dbQuery(countSql, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  // Sorting
  const allowedSort = ['full_asset_number', 'item_description', 'date_received', 'invoice_cost_usd', 'created_at', 'lifecycle_status'];
  const sortBy = allowedSort.includes(filters.sort_by || '') ? filters.sort_by! : 'created_at';
  const sortDir = filters.sort_dir === 'ASC' ? 'ASC' : 'DESC';

  // Query assets view
  const dataSql = `
    SELECT * FROM v_assets_detailed 
    ${whereClause} 
    ORDER BY ${sortBy} ${sortDir} 
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;
  const dataParams = [...params, limit, offset];
  const dataRes = await dbQuery(dataSql, dataParams);

  return {
    data: dataRes.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAssetById(id: string) {
  const res = await dbQuery('SELECT * FROM v_assets_detailed WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function createAsset(data: any, userId: string) {
  const normalized = normalizeAssetNumber(data.full_asset_number || data.asset_number);
  const lifecycle = normalizeLifecycleStatus(data.lifecycle_status);
  const condition = normalizeConditionStatus(data.condition_status);

  return await dbTransaction(async (query) => {
    // Check uniqueness of full_asset_number if present
    if (data.full_asset_number) {
      const existing = await query('SELECT id FROM assets WHERE full_asset_number = $1 AND deleted_at IS NULL', [data.full_asset_number]);
      if (existing.rows.length > 0) {
        throw new Error(`An asset with number "${data.full_asset_number}" already exists in the system.`);
      }
    }

    const insertSql = `
      INSERT INTO assets (
        asset_number, full_asset_number, normalized_asset_number, item_description, asset_type,
        category_id, subcategory_id, brand_name, model, serial_number_1, serial_number_2, accessories,
        invoice_cost_syp, currency, invoice_cost_usd, donor_id, cost_center_id, gl_account, lin,
        office_id, department_id, payment_voucher_number, pr_number, po_number, grn_number,
        date_received, registered_by, lifecycle_status, condition_status, current_location_id,
        current_custodian_employee_id, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
      ) RETURNING id
    `;
    const res = await query(insertSql, [
      data.asset_number || null,
      data.full_asset_number || null,
      normalized,
      data.item_description,
      data.asset_type || 'EQUIPMENT',
      data.category_id || null,
      data.subcategory_id || null,
      data.brand_name || null,
      data.model || null,
      data.serial_number_1 || null,
      data.serial_number_2 || null,
      data.accessories || null,
      data.invoice_cost_syp || null,
      data.currency || 'USD',
      data.invoice_cost_usd || null,
      data.donor_id || null,
      data.cost_center_id || null,
      data.gl_account || null,
      data.lin || null,
      data.office_id || null,
      data.department_id || null,
      data.payment_voucher_number || null,
      data.pr_number || null,
      data.po_number || null,
      data.grn_number || null,
      data.date_received || null,
      data.registered_by || null,
      lifecycle,
      condition,
      data.current_location_id || null,
      data.current_custodian_employee_id || null,
      data.notes || null,
    ]);

    const assetId = res.rows[0].id;

    // Log movement: RECEIVED
    await query(
      `INSERT INTO asset_movements (asset_id, movement_type, to_location_id, movement_date, reference_number, notes, performed_by_user_id)
       VALUES ($1, 'RECEIVED', $2, CURRENT_TIMESTAMP, $3, $4, $5)`,
      [assetId, data.current_location_id || null, data.grn_number || null, 'Initial asset registration', userId]
    );

    // If an initial custodian is assigned, create active assignment record
    if (data.current_custodian_employee_id) {
      await query(
        `INSERT INTO asset_assignments (asset_id, employee_id, assigned_location_id, assignment_date, assigned_by_user_id, assignment_condition, assignment_notes, is_current)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, TRUE)`,
        [assetId, data.current_custodian_employee_id, data.current_location_id || null, userId, condition, 'Assigned upon registration']
      );

      await query(
        `INSERT INTO asset_movements (asset_id, movement_type, from_location_id, to_location_id, to_employee_id, movement_date, notes, performed_by_user_id)
         VALUES ($1, 'ASSIGNED_TO_EMPLOYEE', $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)`,
        [assetId, data.current_location_id || null, data.current_location_id || null, data.current_custodian_employee_id, 'Custody assigned upon registration', userId]
      );
    }

    await recordAuditLog({
      userId,
      action: 'CREATE_ASSET',
      entityType: 'ASSET',
      entityId: assetId,
      newValues: { ...data, id: assetId, normalized_asset_number: normalized },
    });

    return assetId;
  });
}

/**
 * Assign Asset to Employee (Strict Transaction + Constraint verification)
 */
export async function assignAsset(
  assetId: string,
  data: {
    employee_id: string;
    assigned_location_id?: string;
    assignment_date?: string;
    expected_return_date?: string;
    assignment_condition?: string;
    assignment_notes?: string;
  },
  userId: string
) {
  return await dbTransaction(async (query) => {
    // 1. Fetch asset details
    const assetRes = await query('SELECT * FROM assets WHERE id = $1 AND deleted_at IS NULL', [assetId]);
    if (assetRes.rows.length === 0) {
      throw new Error('Asset not found or has been deleted.');
    }
    const asset = assetRes.rows[0];

    if (asset.lifecycle_status === 'DISPOSED') {
      throw new Error('Cannot assign a disposed asset.');
    }
    if (asset.lifecycle_status === 'MISSING') {
      throw new Error('Cannot assign an asset marked as missing.');
    }

    // 2. Check if already has an active custody
    const activeAsgn = await query('SELECT id, employee_id FROM asset_assignments WHERE asset_id = $1 AND is_current = TRUE', [assetId]);
    if (activeAsgn.rows.length > 0) {
      throw new Error('Asset is currently assigned to another custodian. You must return it first before re-assigning.');
    }

    // 3. Verify Employee is Active
    const empRes = await query('SELECT id, full_name, is_active FROM employees WHERE id = $1', [data.employee_id]);
    if (empRes.rows.length === 0 || !empRes.rows[0].is_active) {
      throw new Error('Target employee is inactive or not found.');
    }

    const condition = data.assignment_condition || asset.condition_status || 'OK';
    const asgnDate = data.assignment_date || new Date().toISOString().split('T')[0];

    // 4. Insert assignment record
    const asgnRes = await query(
      `INSERT INTO asset_assignments (
        asset_id, employee_id, assigned_location_id, assignment_date, expected_return_date,
        assigned_by_user_id, assignment_condition, assignment_notes, is_current
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id`,
      [
        assetId,
        data.employee_id,
        data.assigned_location_id || asset.current_location_id || null,
        asgnDate,
        data.expected_return_date || null,
        userId,
        condition,
        data.assignment_notes || null,
      ]
    );

    // 5. Update asset table
    await query(
      `UPDATE assets SET 
        current_custodian_employee_id = $1,
        current_location_id = COALESCE($2, current_location_id),
        condition_status = $3,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [data.employee_id, data.assigned_location_id || null, condition, assetId]
    );

    // 6. Record Movement
    await query(
      `INSERT INTO asset_movements (
        asset_id, movement_type, from_location_id, to_location_id, from_employee_id, to_employee_id,
        movement_date, reference_number, notes, performed_by_user_id
      ) VALUES ($1, 'ASSIGNED_TO_EMPLOYEE', $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8)`,
      [
        assetId,
        asset.current_location_id,
        data.assigned_location_id || asset.current_location_id,
        asset.current_custodian_employee_id,
        data.employee_id,
        `ASGN-${asgnRes.rows[0].id.substring(0, 8)}`,
        data.assignment_notes || `Custody assigned to ${empRes.rows[0].full_name}`,
        userId,
      ]
    );

    // 7. Audit log
    await recordAuditLog({
      userId,
      action: 'ASSIGN_ASSET',
      entityType: 'ASSET',
      entityId: assetId,
      oldValues: { current_custodian_employee_id: asset.current_custodian_employee_id },
      newValues: { current_custodian_employee_id: data.employee_id, assignment_id: asgnRes.rows[0].id },
    });

    return asgnRes.rows[0].id;
  });
}

/**
 * Return Asset from Custody to Stock
 */
export async function returnAsset(
  assetId: string,
  data: {
    to_location_id: string;
    return_condition?: string;
    return_notes?: string;
  },
  userId: string
) {
  return await dbTransaction(async (query) => {
    // 1. Fetch active assignment
    const asgnRes = await query(
      'SELECT * FROM asset_assignments WHERE asset_id = $1 AND is_current = TRUE',
      [assetId]
    );
    if (asgnRes.rows.length === 0) {
      throw new Error('No active custody assignment found for this asset.');
    }
    const asgn = asgnRes.rows[0];

    const condition = data.return_condition || 'OK';

    // 2. Mark assignment as returned
    await query(
      `UPDATE asset_assignments SET 
        is_current = FALSE,
        returned_at = CURRENT_TIMESTAMP,
        returned_by_user_id = $1,
        return_condition = $2,
        return_notes = $3
       WHERE id = $4`,
      [userId, condition, data.return_notes || null, asgn.id]
    );

    // 3. Update asset
    await query(
      `UPDATE assets SET 
        current_custodian_employee_id = NULL,
        current_location_id = $1,
        condition_status = $2,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [data.to_location_id, condition, assetId]
    );

    // 4. Record movement: RETURNED_TO_STOCK
    await query(
      `INSERT INTO asset_movements (
        asset_id, movement_type, from_location_id, to_location_id, from_employee_id, to_employee_id,
        movement_date, reference_number, notes, performed_by_user_id
      ) VALUES ($1, 'RETURNED_TO_STOCK', $2, $3, $4, NULL, CURRENT_TIMESTAMP, $5, $6, $7)`,
      [
        assetId,
        asgn.assigned_location_id,
        data.to_location_id,
        asgn.employee_id,
        `RET-${asgn.id.substring(0, 8)}`,
        data.return_notes || 'Returned to warehouse stock',
        userId,
      ]
    );

    await recordAuditLog({
      userId,
      action: 'RETURN_ASSET',
      entityType: 'ASSET',
      entityId: assetId,
      oldValues: { custodian_id: asgn.employee_id },
      newValues: { returned_to_location: data.to_location_id, return_condition: condition },
    });

    return true;
  });
}

/**
 * Transfer Asset to Location or Office
 */
export async function transferAsset(
  assetId: string,
  data: {
    to_location_id: string;
    to_office_id?: string;
    notes?: string;
  },
  userId: string
) {
  return await dbTransaction(async (query) => {
    const assetRes = await query('SELECT * FROM assets WHERE id = $1 AND deleted_at IS NULL', [assetId]);
    if (assetRes.rows.length === 0) {
      throw new Error('Asset not found.');
    }
    const asset = assetRes.rows[0];

    await query(
      `UPDATE assets SET 
        current_location_id = $1,
        office_id = COALESCE($2, office_id),
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [data.to_location_id, data.to_office_id || null, assetId]
    );

    await query(
      `INSERT INTO asset_movements (
        asset_id, movement_type, from_location_id, to_location_id, movement_date, notes, performed_by_user_id
      ) VALUES ($1, 'TRANSFERRED_TO_LOCATION', $2, $3, CURRENT_TIMESTAMP, $4, $5)`,
      [assetId, asset.current_location_id, data.to_location_id, data.notes || 'Location transfer', userId]
    );

    await recordAuditLog({
      userId,
      action: 'TRANSFER_ASSET',
      entityType: 'ASSET',
      entityId: assetId,
      oldValues: { location_id: asset.current_location_id },
      newValues: { location_id: data.to_location_id },
    });

    return true;
  });
}
