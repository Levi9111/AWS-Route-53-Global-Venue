import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// ── Startup Validation ───────────────────────────────────────────────────────
const requiredEnvVars = ['DATABASE_URL'] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        'Check your .env file or .env.example for reference.',
    );
  }
}

export default {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 5000,
  databaseUrl: process.env.DATABASE_URL as string,
  cors_origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
};
