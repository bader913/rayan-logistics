// server/services/audit.service.ts
import { dbQuery } from '../db/pool.js';
import { logger } from '../utils/logger.js';

export interface AuditLogEntry {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await dbQuery(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.userId || null,
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
      ]
    );
  } catch (err) {
    logger.error('Failed to write audit log entry', err, { entry });
  }
}
