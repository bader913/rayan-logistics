// server/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { dbQuery } from '../db/pool.js';
import { logger } from '../utils/logger.js';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role_id: number;
  role_code: string;
  role_name: string;
  employee_id: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  requestId?: string;
}

// Role permission mapping matrix
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_EDIT', 'ASSET_ASSIGN', 'ASSET_RETURN', 'ASSET_TRANSFER',
    'INVENTORY_START', 'INVENTORY_SCAN', 'INVENTORY_COMPLETE',
    'EMPLOYEE_MANAGE', 'LOCATION_MANAGE', 'MAINTENANCE_MANAGE', 'DISPOSAL_MANAGE',
    'AUDIT_VIEW', 'USER_MANAGE', 'IMPORT_MANAGE'
  ],
  OPERATIONS_MANAGER: [
    'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_EDIT', 'ASSET_ASSIGN', 'ASSET_RETURN', 'ASSET_TRANSFER',
    'INVENTORY_START', 'INVENTORY_SCAN', 'INVENTORY_COMPLETE',
    'EMPLOYEE_MANAGE', 'LOCATION_MANAGE', 'MAINTENANCE_MANAGE', 'DISPOSAL_MANAGE',
    'AUDIT_VIEW', 'IMPORT_MANAGE'
  ],
  LOGISTICS_OFFICER: [
    'ASSET_VIEW', 'ASSET_CREATE', 'ASSET_EDIT', 'ASSET_ASSIGN', 'ASSET_RETURN', 'ASSET_TRANSFER',
    'INVENTORY_SCAN', 'MAINTENANCE_MANAGE', 'LOCATION_MANAGE', 'IMPORT_MANAGE'
  ],
  WAREHOUSE_OFFICER: [
    'ASSET_VIEW', 'ASSET_ASSIGN', 'ASSET_RETURN', 'ASSET_TRANSFER', 'INVENTORY_SCAN', 'MAINTENANCE_MANAGE'
  ],
  AUDITOR: [
    'ASSET_VIEW', 'AUDIT_VIEW', 'INVENTORY_SCAN'
  ],
  VIEWER: [
    'ASSET_VIEW'
  ]
};

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please login.' }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role_id: decoded.role_id,
      role_code: decoded.role_code,
      role_name: decoded.role_name,
      employee_id: decoded.employee_id
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Session expired or token is invalid. Please login again.' }
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    if (!allowedRoles.includes(req.user.role_code)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` }
      });
      return;
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role_code] || [];
    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Permission denied. Missing required permission: ${permission}` }
      });
      return;
    }
    next();
  };
}
