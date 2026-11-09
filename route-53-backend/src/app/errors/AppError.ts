import { StatusCodes } from 'http-status-codes';

export function statusToErrorCode(statusCode: number): string {
  switch (statusCode) {
    case StatusCodes.BAD_REQUEST:
      return 'BAD_REQUEST';
    case StatusCodes.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case StatusCodes.FORBIDDEN:
      return 'FORBIDDEN';
    case StatusCodes.NOT_FOUND:
      return 'NOT_FOUND';
    case StatusCodes.CONFLICT:
      return 'CONFLICT';
    case StatusCodes.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    case StatusCodes.TOO_MANY_REQUESTS:
      return 'TOO_MANY_REQUESTS';
    case StatusCodes.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    stack: string = '',
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusToErrorCode(statusCode);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
