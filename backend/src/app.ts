import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

// Routes
import authRouter from './routes/auth';
import appointmentsRouter from './routes/appointments';
import visitsRouter from './routes/visits';
import queueRouter from './routes/queue';
import sseRouter from './routes/sse';
import setupRouter from './routes/setup';
import doctorsRouter from './routes/doctors';
import teamRouter from './routes/team';
import receptionRouter from './routes/reception';
import publicRouter from './routes/public';
import patientRouter from './routes/patient';

const app: Express = express();

// Security middleware
app.use(helmet());
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);

      // Backwards-compatible default: if not configured, allow all origins.
      if (corsOrigins.length === 0) return callback(null, true);

      if (corsOrigins.includes(origin)) return callback(null, true);

      logger.warn('CORS blocked origin', { origin });
      return callback(null, false);
    },
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 60, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/visits', visitsRouter);
app.use('/api/v1/queue', queueRouter);
app.use('/api/v1/sse', sseRouter);
app.use('/api/v1/setup', setupRouter);
app.use('/api/v1/doctors', doctorsRouter);
app.use('/api/v1/team', teamRouter);
app.use('/api/v1/reception', receptionRouter);
app.use('/api/v1/public', publicRouter);
// Patient routes - extract hospital from domain first
app.use('/api/v1/patient', patientRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

