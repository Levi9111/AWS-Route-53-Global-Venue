/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response, NextFunction } from 'express';
import { TErrorSources } from '../interfaces/error';
import AppError, { statusToErrorCode } from '../errors/AppError';
import config from '../config';
import { ZodError } from 'zod';
import handleZodError from '../errors/handleZodError';
import { Error as MongooseError } from 'mongoose';
import handleCastError from '../errors/handleCastError';
import handleValidationError from '../errors/handleValidationError';
import handleDuplicateError from '../errors/handleDuplicateError';
import logger from '../utils/logger';

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [
    { path: '', message: 'Something went wrong' },
  ];

  if (err instanceof ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode;
    code = 'VALIDATION_ERROR';
    message =
      simplified.errorSources.map((s) => s.message).join('; ') ||
      simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof MongooseError.CastError) {
    const simplified = handleCastError(err);
    statusCode = simplified.statusCode;
    code = 'INVALID_ID';
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof MongooseError.ValidationError) {
    const simplified = handleValidationError(err);
    statusCode = simplified.statusCode;
    code = 'VALIDATION_ERROR';
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err?.code === 11000) {
    const simplified = handleDuplicateError(err);
    statusCode = simplified.statusCode;
    code = 'DUPLICATE_ENTRY';
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || statusToErrorCode(err.statusCode);
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  }

  logger.error(`Request failed: ${req.method} ${req.originalUrl}`, {
    statusCode,
    code,
    message,
  });

  const responseBody: Record<string, unknown> = {
    error: {
      code,
      message,
    },
    success: false,
    message,
    errorSources,
  };

  if (config.NODE_ENV === 'development' && err?.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

export default globalErrorHandler;
