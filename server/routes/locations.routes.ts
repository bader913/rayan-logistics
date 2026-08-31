// server/routes/locations.routes.ts
import { Router } from 'express';
import { dbQuery } from '../db/pool.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Locations
router.get('/locations', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery(`
      SELECT l.*, o.office_name, pl.location_name AS parent_location_name,
             (SELECT COUNT(*) FROM assets a WHERE a.current_location_id = l.id AND a.deleted_at IS NULL) AS asset_count
      FROM locations l
      LEFT JOIN offices o ON l.office_id = o.id
      LEFT JOIN locations pl ON l.parent_location_id = pl.id
      WHERE l.deleted_at IS NULL
      ORDER BY l.location_name ASC
    `);
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

// Offices
router.get('/offices', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery('SELECT * FROM offices ORDER BY office_name ASC');
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

// Departments
router.get('/departments', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery(`
      SELECT d.*, o.office_name 
      FROM departments d
      LEFT JOIN offices o ON d.office_id = o.id
      ORDER BY d.department_name ASC
    `);
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

// Categories & Subcategories
router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const [cats, subcats] = await Promise.all([
      dbQuery('SELECT * FROM asset_categories ORDER BY name ASC'),
      dbQuery('SELECT * FROM asset_subcategories ORDER BY name ASC'),
    ]);

    const subcatMap = new Map<string, any[]>();
    for (const sc of subcats.rows) {
      if (!subcatMap.has(sc.category_id)) {
        subcatMap.set(sc.category_id, []);
      }
      subcatMap.get(sc.category_id)!.push(sc);
    }

    const result = cats.rows.map((c: any) => ({
      ...c,
      subcategories: subcatMap.get(c.id) || [],
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Donors & Cost Centers
router.get('/donors', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery('SELECT * FROM donors ORDER BY donor_name ASC');
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/cost-centers', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery(`
      SELECT cc.*, d.donor_name 
      FROM cost_centers cc
      LEFT JOIN donors d ON cc.donor_id = d.id
      ORDER BY cc.name ASC
    `);
    res.json({ success: true, data: data.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
