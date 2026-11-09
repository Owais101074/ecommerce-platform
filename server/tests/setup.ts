import { afterEach } from 'vitest';

// Runs before the app module is imported, so these values win over .env.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/ecommerce_test';
process.env.PAYMENT_MODE = 'mock';
process.env.BCRYPT_ROUNDS = '4';
process.env.RATE_LIMIT_MAX = '100000';
process.env.AUTH_RATE_LIMIT_MAX = '100000';
process.env.LOG_LEVEL = 'error';
process.env.CACHE_DRIVER = 'memory';
process.env.QUEUE_DRIVER = 'memory';
process.env.MAIL_DRIVER = 'log';

// Fallbacks keep the suite runnable without a local .env file.
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-0123456789abcdef0123456789abcdef';
process.env.RAZORPAY_KEY_SECRET ||= 'test-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET ||= 'test-razorpay-webhook-secret';

// Imported lazily so env.ts sees the values above. Background jobs and the
// catalogue cache are process-wide singletons, so every test must leave them clean.
afterEach(async () => {
  const [{ waitForQueueIdle }, { resetMailOutbox }, { resetCache }] = await Promise.all([
    import('../src/infra/queue'),
    import('../src/modules/notifications/mailer'),
    import('../src/infra/cache'),
  ]);

  await waitForQueueIdle().catch(() => undefined);
  resetMailOutbox();
  await resetCache();
});
