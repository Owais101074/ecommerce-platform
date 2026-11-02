import { app } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    console.log(`[server] ${signal} received, shutting down`);

    setTimeout(() => {
      console.error('[server] forced shutdown after 10s');
      process.exit(1);
    }, 10_000).unref();

    server.close(async () => {
      await disconnectDB();
      console.log('[server] shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('[server] uncaught exception:', error);
  process.exit(1);
});

start().catch(async (error) => {
  console.error('[server] failed to start:', error);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
