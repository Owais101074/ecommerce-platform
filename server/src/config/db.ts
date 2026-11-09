import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './env';

const states: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

export const connectDB = async (): Promise<void> => {
  mongoose.connection.on('connected', () => {
    logger.info('db.connected', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('db.disconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('db.error', { err: error });
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const getDatabaseStatus = (): string => {
  return states[mongoose.connection.readyState] ?? 'unknown';
};
