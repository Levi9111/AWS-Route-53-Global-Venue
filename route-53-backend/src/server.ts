import { Server } from 'http';
import app from './app';
import config from './app/config';
import logger from './app/utils/logger';
import { connectDB } from './app/utils/connectDB';

let server: Server;

async function bootstrap() {
  try {
    await connectDB();

    server = app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
    });

    // Ensure Keep-Alive timeouts for reverse proxies (ALB/Nginx/Cloudflare)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection detected, shutting down server...', reason);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception detected, shutting down server...', error);
  process.exit(1);
});
