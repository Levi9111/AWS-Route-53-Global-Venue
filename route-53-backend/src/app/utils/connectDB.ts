import mongoose from 'mongoose';
import config from '../config';
import logger from './logger';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.databaseUrl, {
      serverSelectionTimeoutMS: 3000,
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}
