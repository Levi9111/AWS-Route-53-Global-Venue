import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
const jwtSecret =
  process.env.JWT_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  'global_venuefinder_default_secret';
const jwtExpiresIn =
  process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '1d';
const jwtRefreshSecret =
  process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_SECRET ||
  'global_venuefinder_default_refresh_secret';
const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!mongoUri) {
  throw new Error(
    'Missing required environment variable: MONGO_URI (or DATABASE_URL). Check your .env file or .env.example for reference.',
  );
}

export default {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri,
  databaseUrl: mongoUri,
  cors_origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'],
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  jwt_secret: jwtSecret,
  jwt_expires_in: jwtExpiresIn,
  jwt_access_secret: jwtSecret,
  jwt_access_expires_in: jwtExpiresIn,
  jwt_refresh_secret: jwtRefreshSecret,
  jwt_refresh_expires_in: jwtRefreshExpiresIn,
};
