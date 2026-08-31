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
import {
  installSystem,
  isInstallationInProgress,
} from '../setup/setup-installer.js';

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

const installSystemSchema = z
  .object({
    database: databaseConfigSchema,
    administrator: z.object({
      username: z
        .string()
        .trim()
        .min(3, 'اسم المستخدم يجب أن يحتوي 3 محارف على الأقل.')
        .max(100)
        .regex(
          /^[a-zA-Z0-9._-]+$/,
          'اسم المستخدم يحتوي محارف غير مسموحة.'
        ),
      email: z
        .string()
        .trim()
        .email('البريد الإلكتروني غير صالح.')
        .max(255),
      password: z
        .string()
        .min(8, 'كلمة المرور يجب أن تحتوي 8 محارف على الأقل.')
        .max(200),
      confirmPassword: z.string().min(1),
    }),
  })
  .superRefine((data, context) => {
    if (
      data.administrator.password !==
      data.administrator.confirmPassword
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          'administrator',
          'confirmPassword',
        ],
        message: 'كلمتا المرور غير متطابقتين.',
      });
    }
  });

router.get('/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      setupCompleted: isSetupCompleted(),
      configurationExists: hasSetupConfig(),
      installationInProgress:
        isInstallationInProgress(),
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

      const result =
        await testPostgresConnection(req.body);

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
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/install',
  validateBody(installSystemSchema),
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

      if (isInstallationInProgress()) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SETUP_IN_PROGRESS',
            message: 'عملية إعداد النظام قيد التنفيذ حاليًا.',
          },
        });
        return;
      }

      const result = await installSystem({
        database: req.body.database,
        administrator: {
          username:
            req.body.administrator.username,
          email:
            req.body.administrator.email,
          password:
            req.body.administrator.password,
        },
      });

      res.status(201).json({
        success: true,
        data: result,
        message:
          'تم إعداد النظام وإنشاء حساب المدير العام بنجاح.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;