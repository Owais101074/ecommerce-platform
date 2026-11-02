import type { Request, Response } from 'express';
import { getDatabaseStatus } from '../../config/db';
import { env } from '../../config/env';
import { sendSuccess } from '../../utils/ApiResponse';

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
      timestamp: new Date().toISOString(),
    },
  );
};
