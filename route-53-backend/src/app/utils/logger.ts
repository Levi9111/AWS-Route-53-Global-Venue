/* eslint-disable no-console */
import config from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    service: 'global-venuefinder-backend',
    env: config.NODE_ENV,
    message,
    ...(meta || {}),
  };
  return JSON.stringify(payload);
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    console.log(formatLog('info', message, meta));
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    console.warn(formatLog('warn', message, meta));
  },

  error: (message: string, error?: unknown): void => {
    const meta: Record<string, unknown> = {};
    if (error instanceof Error) {
      meta.errorName = error.name;
      meta.errorMessage = error.message;
      if (config.NODE_ENV !== 'production') {
        meta.stack = error.stack;
      }
    } else if (error !== undefined) {
      meta.error = error;
    }
    console.error(formatLog('error', message, meta));
  },

  debug: (message: string, meta?: Record<string, unknown>): void => {
    if (config.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, meta));
    }
  },
};

export default logger;
