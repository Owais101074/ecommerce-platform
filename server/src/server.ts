import { app } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { closeCache } from './infra/cache';
import { startQueue, stopQueue } from './infra/queue';
import { closeMailer } from './modules/notifications/mailer';
import { logger } from './utils/logger';

const start = async (): Promise<void> => {
  await connectDB();
  await startQueue();

  const server = app.listen(env.PORT, () => {
    logger.info('server.started', {
      port: env.PORT,
      environment: env.NODE_ENV,
      cacheDriver: env.CACHE_DRIVER,
      queueDriver: env.QUEUE_DRIVER,
      mailDriver: env.MAIL_DRIVER,
    });
  });

  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    logger.info('server.shutdown', { signal });

    setTimeout(() => {
      logger.error('server.forced-shutdown');
      process.exit(1);
    }, 10_000).unref();

    server.close(async () => {
      await stopQueue().catch(() => undefined);
      await closeCache().catch(() => undefined);
      closeMailer();
      await disconnectDB();
      logger.info('server.stopped');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandled-rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('process.uncaught-exception', { err: error });
  process.exit(1);
});

start().catch(async (error) => {
  logger.error('server.start-failed', { err: error });
  await stopQueue().catch(() => undefined);
  await closeCache().catch(() => undefined);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
