// server/services/inventory.service.ts
import { dbQuery, dbTransaction } from '../db/pool.js';
import { normalizeAssetNumber, normalizeConditionStatus } from '../utils/asset-normalizer.js';
import { recordAuditLog } from './audit.service.js';

export async function createInventorySession(
  data: {
    session_number?: string;
    session_name: string;
    office_id?: string;
    location_id?: string;
    category_id?: string;
    notes?: string;
  },
  userId: string
) {
  const sessionNumber = data.session_number || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  return await dbTransaction(async (query) => {
    const res = await query(
      `INSERT INTO inventory_sessions (
        session_number, session_name, office_id, location_id, category_id, status, started_at, created_by_user_id, notes
      ) VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', CURRENT_TIMESTAMP, $6, $7) RETURNING id`,
      [sessionNumber, data.session_name, data.office_id || null, data.location_id || null, data.category_id || null, userId, data.notes || null]
    );

    const sessionId = res.rows[0].id;

    // Pre-populate expected items based on location or office or category filter
    const conds: string[] = ['deleted_at IS NULL', "lifecycle_status = 'CURRENTLY_HELD'"];
    const params: any[] = [];
    let idx = 1;

    if (data.office_id) {
      conds.push(`office_id = $${idx++}`);
      params.push(data.office_id);
    }
    if (data.location_id) {
      conds.push(`current_location_id = $${idx++}`);
      params.push(data.location_id);
    }
    if (data.category_id) {
      conds.push(`category_id = $${idx++}`);
      params.push(data.category_id);
    }

    const assetsRes = await query(`SELECT id, current_location_id, current_custodian_employee_id, condition_status FROM assets WHERE ${conds.join(' AND ')}`, params);

    for (const a of assetsRes.rows) {
      await query(
        `INSERT INTO inventory_items (
          inventory_session_id, asset_id, expected_location_id, expected_custodian_id, result_status, condition_status
        ) VALUES ($1, $2, $3, $4, 'PENDING', $5) ON CONFLICT DO NOTHING`,
        [sessionId, a.id, a.current_location_id, a.current_custodian_employee_id, a.condition_status]
      );
    }

    await recordAuditLog({
      userId,
      action: 'START_INVENTORY_SESSION',
      entityType: 'INVENTORY',
      entityId: sessionId,
      newValues: { sessionNumber, expected_items: assetsRes.rows.length },
    });

    return sessionId;
  });
}

export async function scanInventoryItem(
  sessionId: string,
  data: {
    scanned_asset_number: string;
    actual_location_id?: string;
    actual_custodian_id?: string;
    condition_status?: string;
    notes?: string;
  },
  userId: string
) {
  const rawCode = data.scanned_asset_number.trim();
  const normalized = normalizeAssetNumber(rawCode);

  return await dbTransaction(async (query) => {
    // 1. Verify session is active
    const sessionRes = await query('SELECT * FROM inventory_sessions WHERE id = $1', [sessionId]);
    if (sessionRes.rows.length === 0) {
      throw new Error('Inventory session not found.');
    }
    const session = sessionRes.rows[0];
    if (session.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot scan items into an inventory session with status "${session.status}".`);
    }

    // 2. Find asset by normalized number or serial or full number
    const assetRes = await query(
      `SELECT * FROM assets 
       WHERE (normalized_asset_number = $1 OR full_asset_number = $2 OR serial_number_1 = $2) 
       AND deleted_at IS NULL`,
      [normalized, rawCode]
    );

    let asset = assetRes.rows[0] || null;
    let resultStatus = 'MATCHED';

    if (!asset) {
      // Unregistered asset found during audit
      resultStatus = 'UNREGISTERED';
      const insertUnregistered = await query(
        `INSERT INTO inventory_items (
          inventory_session_id, scanned_asset_number, actual_location_id, actual_custodian_id,
          result_status, condition_status, scanned_at, scanned_by_user_id, notes
        ) VALUES ($1, $2, $3, $4, 'UNREGISTERED', $5, CURRENT_TIMESTAMP, $6, $7) RETURNING id`,
        [sessionId, rawCode, data.actual_location_id || null, data.actual_custodian_id || null, data.condition_status || 'UNKNOWN', userId, data.notes || 'Unregistered item discovered during scan']
      );
      return { item_id: insertUnregistered.rows[0].id, result_status: 'UNREGISTERED', asset: null };
    }

    // Determine result status differences
    const actualLoc = data.actual_location_id || asset.current_location_id;
    const actualCust = data.actual_custodian_id !== undefined ? data.actual_custodian_id : asset.current_custodian_employee_id;
    const scannedCondition = data.condition_status ? normalizeConditionStatus(data.condition_status) : asset.condition_status;

    if (scannedCondition === 'DAMAGED') {
      resultStatus = 'DAMAGED';
    } else if (scannedCondition === 'NEEDS_REPAIR') {
      resultStatus = 'NEEDS_REPAIR';
    } else if (data.actual_location_id && asset.current_location_id && data.actual_location_id !== asset.current_location_id) {
      resultStatus = 'FOUND_DIFFERENT_LOCATION';
    } else if (data.actual_custodian_id && asset.current_custodian_employee_id && data.actual_custodian_id !== asset.current_custodian_employee_id) {
      resultStatus = 'FOUND_DIFFERENT_CUSTODIAN';
    } else {
      resultStatus = 'MATCHED';
    }

    // Check if item was already listed in session
    const itemRes = await query(
      'SELECT id FROM inventory_items WHERE inventory_session_id = $1 AND asset_id = $2',
      [sessionId, asset.id]
    );

    let itemId: string;

    if (itemRes.rows.length > 0) {
      itemId = itemRes.rows[0].id;
      await query(
        `UPDATE inventory_items SET 
          scanned_asset_number = $1,
          actual_location_id = $2,
          actual_custodian_id = $3,
          result_status = $4,
          condition_status = $5,
          scanned_at = CURRENT_TIMESTAMP,
          scanned_by_user_id = $6,
          notes = COALESCE($7, notes),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [rawCode, actualLoc, actualCust, resultStatus, scannedCondition, userId, data.notes || null, itemId]
      );
    } else {
      const insRes = await query(
        `INSERT INTO inventory_items (
          inventory_session_id, asset_id, scanned_asset_number, expected_location_id, actual_location_id,
          expected_custodian_id, actual_custodian_id, result_status, condition_status, scanned_at, scanned_by_user_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11) RETURNING id`,
        [
          sessionId,
          asset.id,
          rawCode,
          asset.current_location_id,
          actualLoc,
          asset.current_custodian_employee_id,
          actualCust,
          resultStatus,
          scannedCondition,
          userId,
          data.notes || null,
        ]
      );
      itemId = insRes.rows[0].id;
    }

    return {
      item_id: itemId,
      result_status: resultStatus,
      asset: {
        id: asset.id,
        full_asset_number: asset.full_asset_number,
        item_description: asset.item_description,
      },
    };
  });
}

export async function completeInventorySession(sessionId: string, userId: string) {
  return await dbTransaction(async (query) => {
    // 1. Mark all untouched/pending items as MISSING
    await query(
      `UPDATE inventory_items SET result_status = 'MISSING', updated_at = CURRENT_TIMESTAMP 
       WHERE inventory_session_id = $1 AND result_status = 'PENDING'`,
      [sessionId]
    );

    // 2. Mark session completed
    await query(
      `UPDATE inventory_sessions SET 
        status = 'COMPLETED',
        completed_at = CURRENT_TIMESTAMP,
        completed_by_user_id = $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, sessionId]
    );

    await recordAuditLog({
      userId,
      action: 'COMPLETE_INVENTORY_SESSION',
      entityType: 'INVENTORY',
      entityId: sessionId,
    });

    return true;
  });
}
