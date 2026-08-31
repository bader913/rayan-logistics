import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  hasSetupConfig,
  isSetupCompleted,
} from '../setup/setup-config.js';
import {
  testPostgresConnection,
} from '../setup/setup-service.js';

const router = Router();

const databaseConfigSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  database: z
    .string()
    .trim()
    .min(1)
    .max(63)
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_-]*$/,
      'اسم قاعدة البيانات يحتوي محارف غير مسموحة.'
    ),
  user: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(500),
  ssl: z.boolean().default(false),
});

router.get('/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      setupCompleted: isSetupCompleted(),
      configurationExists: hasSetupConfig(),
    },
  });
});

router.post(
  '/test-connection',
  validateBody(databaseConfigSchema),
  async (req, res, next) => {
    try {
      if (isSetupCompleted()) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SETUP_ALREADY_COMPLETED',
            message: 'تم إعداد النظام مسبقًا.',
          },
        });
        return;
      }

      const result = await testPostgresConnection(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DATABASE_CONNECTION_FAILED',
            message: result.message,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          success: true,
          serverVersion: result.serverVersion,
          databaseExists: result.databaseExists,
          message: result.message,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;