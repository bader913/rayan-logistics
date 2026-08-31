// server/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from './auth.middleware.js';

export function requestIdMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}

export function centralizedErrorHandler(err: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const status = err.status || err.statusCode || 500;
  const requestId = req.requestId;

  logger.error(`Unhandled request error [${req.method} ${req.originalUrl}]`, err, {
    requestId,
    userId: req.user?.id,
    ip: req.ip,
  });

  const response: Record<string, any> = {
    success: false,
    error: {
      code: err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
      message: err.message || 'An unexpected error occurred on the server',
      requestId,
    },
  };

  // Stack traces never exposed in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
}
