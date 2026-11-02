import mongoose from 'mongoose';
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
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('[db] MongoDB connection error:', error);
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
