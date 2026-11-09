/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response, NextFunction } from 'express';
import { TErrorSources } from '../interfaces/error';
import AppError from '../errors/AppError';
import config from '../config';
import { ZodError } from 'zod';
import handleZodError from '../errors/handleZodError';
import { Error as MongooseError } from 'mongoose';
import handleCastError from '../errors/handleCastError';
import handleValidationError from '../errors/handleValidationError';
import handleDuplicateError from '../errors/handleDuplicateError';

const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If headers already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // ── Defaults ─────────────────────────────────────────────────────────────
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [
    { path: '', message: 'Something went wrong' },
  ];

  // ── Discriminated dispatch ────────────────────────────────────────────────
  // Order matters: most specific first, generic Error last
  if (err instanceof ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof MongooseError.CastError) {
    const simplified = handleCastError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof MongooseError.ValidationError) {
    const simplified = handleValidationError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err?.code === 11000) {
    const simplified = handleDuplicateError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  }

  // ── Response ──────────────────────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    // Never leak stack traces in production
    stack: config.NODE_ENV === 'development' ? err?.stack : null,
  });
};

export default globalErrorHandler;
