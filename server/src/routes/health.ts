import { Router } from 'express';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { firebaseAdminInitialized } from '../middleware/auth.js';
import { logger } from '../config/logger.js';

/** Typed structure for the health check response payload. */
interface HealthCheckResponse {
  status: 'UP' | 'DEGRADED';
  timestamp: string;
  uptimeSeconds: number;
  memoryUsage: NodeJS.MemoryUsage;
  services: {
    firebaseAdmin: 'connected' | 'unconfigured_fallback';
    database: 'connected' | 'disconnected' | 'unknown';
  };
  error?: string;
}

const router = Router();

/**
 * GET /api/health
 * Returns server health status including database connectivity
 * and Firebase Admin SDK configuration state.
 */
router.get('/', async (req, res) => {
  const healthStatus: HealthCheckResponse = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    memoryUsage: process.memoryUsage(),
    services: {
      firebaseAdmin: firebaseAdminInitialized ? 'connected' : 'unconfigured_fallback',
      database: 'unknown',
    },
  };

  try {
    // Perform simple query to verify database connection health
    await db.select({ id: users.id }).from(users).limit(1);
    healthStatus.services.database = 'connected';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection error';
    logger.error('Database health check failed', { error });
    healthStatus.status = 'DEGRADED';
    healthStatus.services.database = 'disconnected';
    healthStatus.error = message;
  }

  const statusCode = healthStatus.status === 'UP' ? 200 : 500;
  res.status(statusCode).json(healthStatus);
});

export default router;
