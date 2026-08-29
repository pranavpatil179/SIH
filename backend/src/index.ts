import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { requireAuth } from './middleware/auth';
import authRouter from './routes/auth';
import businessesRouter from './routes/businesses';
import projectsRouter from './routes/projects';
import approvalsRouter from './routes/approvals';
import applicationsRouter from './routes/applications';
import documentsRouter from './routes/documents';
import queriesRouter from './routes/queries';
import inspectionsRouter from './routes/inspections';
import schemesRouter from './routes/schemes';
import notificationsRouter from './routes/notifications';
import aiRouter from './routes/ai';
import analyticsRouter from './routes/analytics';
import complianceRouter from './routes/compliance';
import auditRouter from './routes/audit';
import grievancesRouter from './routes/grievances';

const app = express();

// Security & logging
app.use(helmet());
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawFrontendUrl.split(',').map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'BizClear Approval Platform API',
    timestamp: new Date().toISOString(),
  });
});

// Public auth routes
app.use('/api/auth', authRouter);

// All other API routes require auth
app.use('/api/businesses', requireAuth, businessesRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/approvals', requireAuth, approvalsRouter);
app.use('/api/applications', requireAuth, applicationsRouter);
app.use('/api/documents', requireAuth, documentsRouter);
app.use('/api/queries', requireAuth, queriesRouter);
app.use('/api/inspections', requireAuth, inspectionsRouter);
app.use('/api/schemes', requireAuth, schemesRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);
app.use('/api/compliance', requireAuth, complianceRouter);
app.use('/api/audit', requireAuth, auditRouter);
app.use('/api/grievances', requireAuth, grievancesRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (express-async-errors forwards to this)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[ERROR]', err.message, err.stack);
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({
      error: err.message ?? 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
);

const PORT = Number(process.env.PORT ?? 4000);
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 BizClear API running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/health`);
  });
}

export default app;
