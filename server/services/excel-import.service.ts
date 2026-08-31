// server/services/excel-import.service.ts
import * as xlsx from 'xlsx';
import { dbQuery, dbTransaction } from '../db/pool.js';
import { normalizeAssetNumber, normalizeConditionStatus, normalizeLifecycleStatus } from '../utils/asset-normalizer.js';
import { parseExcelDate } from '../utils/excel-date.js';
import { recordAuditLog } from './audit.service.js';

export interface ImportPreviewIssue {
  row: number;
  field: string;
  type: 'WARNING' | 'ERROR' | 'INFO';
  message: string;
  originalValue: any;
}

export interface ImportPreviewRow {
  rowNumber: number;
  fullAssetNumber: string;
  normalizedAssetNumber: string;
  description: string;
  employeeNumber?: string;
  matchedEmployeeId?: string;
  matchedEmployeeName?: string;
  categoryCode?: string;
  matchedCategoryId?: string;
  brand?: string;
  model?: string;
  serial1?: string;
  dateReceived?: string;
  costUsd?: number;
  donorCode?: string;
  lifecycleStatus: string;
  conditionStatus: string;
  issues: ImportPreviewIssue[];
  status: 'VALID' | 'WARNING' | 'INVALID';
}

export interface ImportPreviewResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  employeesFoundInSheet: number;
  rows: ImportPreviewRow[];
}

export async function previewExcelImport(buffer: Buffer, fileName: string): Promise<ImportPreviewResult> {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  // Identify Assets sheet (case-insensitive)
  const assetsSheetName = sheetNames.find((s) => s.toLowerCase().includes('asset')) || sheetNames[0];
  const empSheetName = sheetNames.find((s) => s.toLowerCase().includes('emp') || s.toLowerCase().includes('staff'));

  const rawAssetsData: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[assetsSheetName]);
  let rawEmpData: any[] = [];
  if (empSheetName) {
    rawEmpData = xlsx.utils.sheet_to_json(workbook.Sheets[empSheetName]);
  }

  // Pre-load reference lists from database
  const [empRes, catRes, donorRes, offRes, existingAssetsRes] = await Promise.all([
    dbQuery('SELECT id, employee_number, full_name FROM employees WHERE is_active = TRUE'),
    dbQuery('SELECT id, code, name FROM asset_categories'),
    dbQuery('SELECT id, donor_code, donor_name FROM donors'),
    dbQuery('SELECT id, office_code, office_name FROM offices'),
    dbQuery('SELECT id, full_asset_number, normalized_asset_number FROM assets WHERE deleted_at IS NULL'),
  ]);

  const empByNumberMap = new Map<string, any>(empRes.rows.filter((e: any) => e.employee_number).map((e: any) => [e.employee_number.toUpperCase(), e]));
  const catByCodeMap = new Map<string, any>(catRes.rows.map((c: any) => [c.code.toUpperCase(), c]));
  const donorByCodeMap = new Map<string, any>(donorRes.rows.filter((d: any) => d.donor_code).map((d: any) => [d.donor_code.toUpperCase(), d]));
  const existingAssetNumSet = new Set<string>(existingAssetsRes.rows.map((a: any) => a.normalized_asset_number));

  const previewRows: ImportPreviewRow[] = [];
  let validCount = 0;
  let warningCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rawAssetsData.length; i++) {
    const raw = rawAssetsData[i];
    const rowNum = i + 2; // header is row 1
    const issues: ImportPreviewIssue[] = [];

    // Extract fields flexibly
    const rawAssetNum = String(raw['Asset Number'] || raw['Full Asset Number'] || raw['Asset ID'] || raw['Asset#'] || raw['Number'] || '').trim();
    const rawDesc = String(raw['Item Description'] || raw['Description'] || raw['Item'] || raw['Name'] || '').trim();
    const rawEmpNum = String(raw['Employee Number'] || raw['Staff ID'] || raw['Emp ID'] || raw['EMP#'] || '').trim();
    const rawEmpName = String(raw['Employee Name'] || raw['Custodian'] || raw['Staff Name'] || '').trim();
    const rawBrand = String(raw['Brand'] || raw['Brand Name'] || raw['Make'] || '').trim();
    const rawModel = String(raw['Model'] || raw['Model Number'] || '').trim();
    const rawSerial = String(raw['Serial Number'] || raw['Serial 1'] || raw['S/N'] || '').trim();
    const rawDate = raw['Date Received'] || raw['Purchase Date'] || raw['Received Date'];
    const rawCost = raw['Invoice Cost USD'] || raw['Cost USD'] || raw['Cost ($)'] || raw['Price USD'];
    const rawCat = String(raw['Category'] || raw['Category Code'] || raw['Type'] || '').trim();
    const rawDonor = String(raw['Donor'] || raw['Donor Code'] || '').trim();
    const rawLifecycle = String(raw['Lifecycle Status'] || raw['Status'] || '').trim();
    const rawCondition = String(raw['Condition'] || raw['Condition Status'] || '').trim();

    if (!rawDesc) {
      issues.push({
        row: rowNum,
        field: 'item_description',
        type: 'ERROR',
        message: 'Item description is missing.',
        originalValue: null,
      });
    }

    const normalizedNum = normalizeAssetNumber(rawAssetNum);

    if (!normalizedNum && !rawAssetNum) {
      issues.push({
        row: rowNum,
        field: 'full_asset_number',
        type: 'WARNING',
        message: 'Asset number is missing. System will generate a provisional number.',
        originalValue: null,
      });
    } else if (existingAssetNumSet.has(normalizedNum)) {
      issues.push({
        row: rowNum,
        field: 'full_asset_number',
        type: 'ERROR',
        message: `Duplicate asset number "${rawAssetNum}". Already exists in database.`,
        originalValue: rawAssetNum,
      });
    }

    // Custodian employee resolution
    let matchedEmpId: string | undefined;
    let matchedEmpName: string | undefined;

    // Check banned placeholder custodian names like "In Stock", "Office USE"
    const bannedNames = ['IN STOCK', 'STOCK', 'OFFICE USE', 'DAMASCUS', 'DAM-HQ', 'WAREHOUSE', 'STORAGE', 'AVAILABLE', 'N/A', 'NONE'];
    const cleanEmpName = rawEmpName.toUpperCase();

    if (rawEmpNum) {
      const match = empByNumberMap.get(rawEmpNum.toUpperCase());
      if (match) {
        matchedEmpId = match.id;
        matchedEmpName = match.full_name;
      } else {
        issues.push({
          row: rowNum,
          field: 'employee_number',
          type: 'WARNING',
          message: `Employee number "${rawEmpNum}" not found. Custody will not be created automatically.`,
          originalValue: rawEmpNum,
        });
      }
    } else if (rawEmpName && !bannedNames.includes(cleanEmpName)) {
      issues.push({
        row: rowNum,
        field: 'employee_name',
        type: 'WARNING',
        message: `Employee name "${rawEmpName}" provided without unique Employee Number. Requires manual linking.`,
        originalValue: rawEmpName,
      });
    }

    // Category matching
    let matchedCatId: string | undefined;
    if (rawCat) {
      const match = catByCodeMap.get(rawCat.toUpperCase());
      if (match) {
        matchedCatId = match.id;
      }
    }

    const parsedDate = parseExcelDate(rawDate);
    const parsedCost = rawCost ? parseFloat(String(rawCost).replace(/[^0-9.]/g, '')) : undefined;

    const rowStatus: 'VALID' | 'WARNING' | 'INVALID' = issues.some((iss) => iss.type === 'ERROR')
      ? 'INVALID'
      : issues.some((iss) => iss.type === 'WARNING')
      ? 'WARNING'
      : 'VALID';

    if (rowStatus === 'VALID') validCount++;
    else if (rowStatus === 'WARNING') warningCount++;
    else invalidCount++;

    previewRows.push({
      rowNumber: rowNum,
      fullAssetNumber: rawAssetNum || `GEN-${Date.now()}-${i}`,
      normalizedAssetNumber: normalizedNum,
      description: rawDesc,
      employeeNumber: rawEmpNum || undefined,
      matchedEmployeeId: matchedEmpId,
      matchedEmployeeName: matchedEmpName,
      categoryCode: rawCat || undefined,
      matchedCategoryId: matchedCatId,
      brand: rawBrand || undefined,
      model: rawModel || undefined,
      serial1: rawSerial || undefined,
      dateReceived: parsedDate || undefined,
      costUsd: isNaN(parsedCost as any) ? undefined : parsedCost,
      donorCode: rawDonor || undefined,
      lifecycleStatus: normalizeLifecycleStatus(rawLifecycle),
      conditionStatus: normalizeConditionStatus(rawCondition),
      issues,
      status: rowStatus,
    });
  }

  return {
    fileName,
    totalRows: rawAssetsData.length,
    validRows: validCount,
    warningRows: warningCount,
    invalidRows: invalidCount,
    employeesFoundInSheet: rawEmpData.length,
    rows: previewRows,
  };
}

export async function commitExcelImport(
  buffer: Buffer,
  fileName: string,
  userId: string
): Promise<{ batchId: string; total: number; successful: number; warnings: number; failed: number }> {
  const preview = await previewExcelImport(buffer, fileName);

  return await dbTransaction(async (query) => {
    // 1. Create import batch entry
    const batchRes = await query(
      `INSERT INTO import_batches (original_file_name, import_type, status, total_rows, imported_by_user_id, started_at)
       VALUES ($1, 'EXCEL_ASSETS_EMP', 'PROCESSING', $2, $3, CURRENT_TIMESTAMP) RETURNING id`,
      [fileName, preview.totalRows, userId]
    );
    const batchId = batchRes.rows[0].id;

    let successCount = 0;
    let warningCount = 0;
    let failedCount = 0;

    for (const row of preview.rows) {
      if (row.status === 'INVALID') {
        failedCount++;
        for (const iss of row.issues) {
          await query(
            `INSERT INTO import_issues (import_batch_id, sheet_name, row_number, field_name, issue_type, issue_message, original_value)
             VALUES ($1, 'Assets', $2, $3, $4, $5, $6)`,
            [batchId, row.rowNumber, iss.field, iss.type, iss.message, String(iss.originalValue || '')]
          );
        }
        continue;
      }

      if (row.status === 'WARNING') {
        warningCount++;
        for (const iss of row.issues) {
          await query(
            `INSERT INTO import_issues (import_batch_id, sheet_name, row_number, field_name, issue_type, issue_message, original_value)
             VALUES ($1, 'Assets', $2, $3, $4, $5, $6)`,
            [batchId, row.rowNumber, iss.field, iss.type, iss.message, String(iss.originalValue || '')]
          );
        }
      }

      // Insert asset
      const insRes = await query(
        `INSERT INTO assets (
          full_asset_number, normalized_asset_number, item_description, brand_name, model,
          serial_number_1, date_received, invoice_cost_usd, category_id,
          lifecycle_status, condition_status, current_custodian_employee_id, source_row_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [
          row.fullAssetNumber,
          row.normalizedAssetNumber,
          row.description,
          row.brand || null,
          row.model || null,
          row.serial1 || null,
          row.dateReceived || null,
          row.costUsd || null,
          row.matchedCategoryId || null,
          row.lifecycleStatus,
          row.conditionStatus,
          row.matchedEmployeeId || null,
          row.rowNumber,
        ]
      );

      const assetId = insRes.rows[0].id;

      // Log movement: RECEIVED
      await query(
        `INSERT INTO asset_movements (asset_id, movement_type, movement_date, reference_number, notes, performed_by_user_id)
         VALUES ($1, 'RECEIVED', CURRENT_TIMESTAMP, $2, 'Imported from Excel batch', $3)`,
        [assetId, `BATCH-${batchId.substring(0, 8)}`, userId]
      );

      // If matched with valid employee, create assignment
      if (row.matchedEmployeeId) {
        await query(
          `INSERT INTO asset_assignments (asset_id, employee_id, assignment_date, assigned_by_user_id, assignment_condition, assignment_notes, is_current)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, 'Assigned via Excel Import batch', TRUE)`,
          [assetId, row.matchedEmployeeId, userId, row.conditionStatus]
        );

        await query(
          `INSERT INTO asset_movements (asset_id, movement_type, to_employee_id, movement_date, notes, performed_by_user_id)
           VALUES ($1, 'ASSIGNED_TO_EMPLOYEE', $2, CURRENT_TIMESTAMP, 'Custody created via Excel Import batch', $3)`,
          [assetId, row.matchedEmployeeId, userId]
        );
      }

      successCount++;
    }

    // Update batch status
    await query(
      `UPDATE import_batches SET 
        status = 'COMPLETED',
        successful_rows = $1,
        warning_rows = $2,
        failed_rows = $3,
        completed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [successCount, warningCount, failedCount, batchId]
    );

    await recordAuditLog({
      userId,
      action: 'COMMIT_EXCEL_IMPORT',
      entityType: 'IMPORT',
      entityId: batchId,
      newValues: { total: preview.totalRows, successful: successCount, warnings: warningCount, failed: failedCount },
    });

    return {
      batchId,
      total: preview.totalRows,
      successful: successCount,
      warnings: warningCount,
      failed: failedCount,
    };
  });
}
