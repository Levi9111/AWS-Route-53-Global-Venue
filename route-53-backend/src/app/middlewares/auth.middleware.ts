import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../errors/AppError';
import { verifyToken } from '../utils/jwt.utils';
import config from '../config';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: JwtPayload & { userId: string; role: string; email?: string };
    }
  }
}

function extractToken(req: Request): string | undefined {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(
        new AppError(
          StatusCodes.UNAUTHORIZED,
          'Authentication required. Please log in.',
          'UNAUTHORIZED',
        ),
      );
    }

    const decoded = verifyToken(token, config.jwt_secret);
    req.user = decoded as JwtPayload & {
      userId: string;
      role: string;
      email?: string;
    };
    next();
  } catch {
    next(
      new AppError(
        StatusCodes.UNAUTHORIZED,
        'Invalid or expired authentication token.',
        'UNAUTHORIZED',
      ),
    );
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError(
          StatusCodes.UNAUTHORIZED,
          'Authentication required. Please log in.',
          'UNAUTHORIZED',
        ),
      );
    }

    if (
      roles.length > 0 &&
      !roles.includes(req.user.role) &&
      req.user.role !== 'admin'
    ) {
      return next(
        new AppError(
          StatusCodes.FORBIDDEN,
          `Access denied. Required role: ${roles.join(' or ')}.`,
          'FORBIDDEN',
        ),
      );
    }

    next();
  };
};

const auth = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    requireAuth(req, res, (err?: unknown) => {
      if (err) {
        return next(err);
      }
      if (requiredRoles.length > 0) {
        return requireRole(...requiredRoles)(req, res, next);
      }
      next();
    });
  };
};

export default auth;
