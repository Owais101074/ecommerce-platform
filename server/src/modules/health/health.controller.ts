import type { Request, Response } from 'express';
import { getDatabaseStatus } from '../../config/db';
import { env } from '../../config/env';
import { sendSuccess } from '../../utils/ApiResponse';

/** Liveness: the process is up. Used by hosts that must not restart on DB blips. */
export const getLiveness = (_req: Request, res: Response): Response =>
  sendSuccess(res, 200, 'Server is alive', {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });

/** Readiness: safe to receive traffic. Returns 503 while the database is down. */
export const getHealth = (_req: Request, res: Response): Response => {
  const database = getDatabaseStatus();
  const isHealthy = database === 'connected';

  return sendSuccess(
    res,
    isHealthy ? 200 : 503,
    isHealthy ? 'Server is healthy' : 'Server is running but the database is unavailable',
    {
      status: isHealthy ? 'ok' : 'degraded',
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      database,
      infrastructure: {
        cache: env.CACHE_DRIVER,
        queue: env.QUEUE_DRIVER,
        mail: env.MAIL_DRIVER,
      },
      timestamp: new Date().toISOString(),
    },
  );
};
