// server/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import assetsRoutes from './assets.routes.js';
import employeesRoutes from './employees.routes.js';
import inventoryRoutes from './inventory.routes.js';
import locationsRoutes from './locations.routes.js';
import maintenanceRoutes from './maintenance.routes.js';
import importRoutes from './import.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import adminRoutes from './admin.routes.js';
import setupRoutes from './setup.routes.js';
import { checkDbConnection } from '../db/pool.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', async (req, res) => {
  const dbHealth = await checkDbConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Rayan Logistics Backend API',
    version: '1.0.0',
    database: dbHealth,
  });
});

apiRouter.use('/setup', setupRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/assets', assetsRoutes);
apiRouter.use('/employees', employeesRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/locations', locationsRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/import', importRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
