// server.ts
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { ENV } from './server/config/env.js';
import { logger } from './server/utils/logger.js';
import { requestIdMiddleware, centralizedErrorHandler } from './server/middleware/error.middleware.js';
import apiRouter from './server/routes/index.js';
import { checkDbConnection } from './server/db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security and Utilities
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite preview scripts and in-line styles
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(requestIdMiddleware);

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!req.path.startsWith('/@') && !req.path.startsWith('/src/')) {
        logger.info(`${req.method} ${req.path} [${res.statusCode}] - ${duration}ms`);
      }
    });
    next();
  });

  // Direct public downloads (for zip artifact)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Mount API Routes FIRST
  app.use('/api/v1', apiRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized error handler
  app.use(centralizedErrorHandler);

  // Boot server
  app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`====================================================`);
    logger.info(`  Rayan Logistics Backend Server Running on Port ${PORT}`);
    logger.info(`  Environment: ${ENV.NODE_ENV}`);
    logger.info(`====================================================`);

    const dbHealth = await checkDbConnection();
    logger.info(`Database state: ${dbHealth.engine} (Connected: ${dbHealth.connected})`);
  });
}

startServer().catch((err) => {
  logger.error('Fatal server startup error', err);
  process.exit(1);
});
