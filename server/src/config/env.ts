import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the first .env that exists: the package directory when run from npm,
// then the compiled layout. Tests provide their own values below these.
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });
if (typeof __dirname === 'string') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(5000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
    RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    REDIS_URL: z.string().trim().default(''),
    CACHE_DRIVER: z.enum(['memory', 'redis', 'none']).default('memory'),
    CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    QUEUE_DRIVER: z.enum(['memory', 'bullmq', 'none']).default('memory'),
    MAIL_DRIVER: z.enum(['log', 'smtp', 'none']).default('log'),
    MAIL_FROM: z.string().trim().default('Ecommerce Platform <no-reply@example.com>'),
    SMTP_HOST: z.string().trim().default(''),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_USER: z.string().trim().default(''),
    SMTP_PASS: z.string().trim().default(''),
    PAYMENT_MODE: z.enum(['mock', 'razorpay']).default('mock'),
    RAZORPAY_KEY_ID: z.string().trim().default(''),
    RAZORPAY_KEY_SECRET: z
      .string()
      .trim()
      .min(16, 'RAZORPAY_KEY_SECRET must be at least 16 characters'),
    RAZORPAY_WEBHOOK_SECRET: z
      .string()
      .trim()
      .min(16, 'RAZORPAY_WEBHOOK_SECRET must be at least 16 characters'),
    CLOUDINARY_CLOUD_NAME: z.string().trim().default(''),
    CLOUDINARY_API_KEY: z.string().trim().default(''),
    CLOUDINARY_API_SECRET: z.string().trim().default(''),
    CLOUDINARY_FOLDER: z.string().trim().default('ecommerce-platform'),
  })
  .refine((data) => data.JWT_ACCESS_SECRET !== data.JWT_REFRESH_SECRET, {
    message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  })
  .refine((data) => data.NODE_ENV !== 'production' || data.PAYMENT_MODE === 'razorpay', {
    message: 'PAYMENT_MODE must be razorpay in production',
    path: ['PAYMENT_MODE'],
  })
  .refine((data) => data.PAYMENT_MODE !== 'razorpay' || data.RAZORPAY_KEY_ID.length > 0, {
    message: 'RAZORPAY_KEY_ID is required when PAYMENT_MODE is razorpay',
    path: ['RAZORPAY_KEY_ID'],
  })
  .refine((data) => data.CACHE_DRIVER !== 'redis' || data.REDIS_URL.length > 0, {
    message: 'REDIS_URL is required when CACHE_DRIVER is redis',
    path: ['REDIS_URL'],
  })
  .refine((data) => data.QUEUE_DRIVER !== 'bullmq' || data.REDIS_URL.length > 0, {
    message: 'REDIS_URL is required when QUEUE_DRIVER is bullmq',
    path: ['REDIS_URL'],
  })
  .refine((data) => data.MAIL_DRIVER !== 'smtp' || data.SMTP_HOST.length > 0, {
    message: 'SMTP_HOST is required when MAIL_DRIVER is smtp',
    path: ['SMTP_HOST'],
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  console.error(`[env] Invalid environment variables:\n${details}`);
  process.exit(1);
}

export const env: Env = parsed.data;
