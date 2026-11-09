import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../utils/logger';
import { runWithRequestContext } from '../utils/requestContext';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;

/**
 * Assigns a request id that can be followed through logs and background jobs.
 * A client-supplied id is reused only when it is safe, so logs cannot be
 * polluted with arbitrary content.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();

  req.id = requestId;
  req.log = logger.child({ requestId });
  res.setHeader('X-Request-Id', requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const fields = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.id,
    };

    if (res.statusCode >= 500) {
      req.log.error('http.request', fields);
    } else if (res.statusCode >= 400) {
      req.log.warn('http.request', fields);
    } else {
      req.log.info('http.request', fields);
    }
  });

  runWithRequestContext(requestId, next);
};
