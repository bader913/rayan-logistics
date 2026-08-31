// server/routes/import.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { authenticate, requirePermission, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { previewExcelImport, commitExcelImport } from '../services/excel-import.service.js';
import { dbQuery } from '../db/pool.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const router = Router();

// Preview Excel File
router.post(
  '/preview',
  authenticate,
  requirePermission('IMPORT_MANAGE'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No Excel file provided' } });
        return;
      }

      const preview = await previewExcelImport(req.file.buffer, req.file.originalname);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }
);

// Commit Excel Import Batch
router.post(
  '/commit',
  authenticate,
  requirePermission('IMPORT_MANAGE'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No Excel file provided' } });
        return;
      }

      const result = await commitExcelImport(req.file.buffer, req.file.originalname, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// List Import Batches
router.get('/batches', authenticate, requirePermission('IMPORT_MANAGE'), async (req, res, next) => {
  try {
    const data = await dbQuery(`
      SELECT b.*, u.username AS imported_by_username,
             (SELECT COUNT(*) FROM import_issues i WHERE i.import_batch_id = b.id) AS issues_count
      FROM import_batches b
      LEFT JOIN users u ON b.imported_by_user_id = u.id
      ORDER BY b.started_at DESC
    `);
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

// Get Issues for Batch
router.get('/batches/:id/issues', authenticate, requirePermission('IMPORT_MANAGE'), async (req, res, next) => {
  try {
    const data = await dbQuery('SELECT * FROM import_issues WHERE import_batch_id = $1 ORDER BY row_number ASC', [req.params.id]);
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
