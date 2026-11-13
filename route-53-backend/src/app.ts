import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import config from './app/config';
import logger from './app/utils/logger';
import { cemWelcomePage } from './app/utils/welcomePage';
import cookieParser from 'cookie-parser';
import {
  globalRateLimiter,
  authRateLimiter,
} from './app/middlewares/rateLimiter.middleware';
import router from './app/routes';
import notFound from './app/middlewares/notFound.middleware';
import globalErrorHandler from './app/middlewares/globalErrorHandler.middleware';

const app: Application = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// ── Global Middlewares ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        config.cors_origin.includes('*') ||
        config.cors_origin.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(globalRateLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Structured Request Logging ────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path !== '/health') {
      logger.info('HTTP Request', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      });
    }
  });
  next();
});

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/html');
  res.send(cemWelcomePage());
});

// ── Health Check (Route 53 compatible) ────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw new Error('MongoDB connection is not ready');
    }

    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      uptime: parseFloat(uptime.toFixed(2)),
      timestamp,
    });
  } catch (err) {
    logger.error('Health check failed — MongoDB unreachable', err);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection is unhealthy',
      },
    });
  }
});

// ── Rate Limit on Auth Endpoints ──────────────────────────────────────────────
app.use('/api/auth', authRateLimiter);
app.use('/api/v1/auth', authRateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', router);
app.use('/api/v1', router);

// ── Error Handlers (must be last) ────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
