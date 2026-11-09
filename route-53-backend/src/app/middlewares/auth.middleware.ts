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
      user: JwtPayload & { userId: string; role: string };
    }
  }
}

const auth = (...requiredRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const token = req.cookies?.accessToken;

      if (!token) {
        return next(
          new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!'),
        );
      }

      const decoded = verifyToken(token, config.jwt_access_secret as string);

      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        return next(
          new AppError(
            StatusCodes.FORBIDDEN,
            'You do not have the required permissions!',
          ),
        );
      }

      req.user = decoded as JwtPayload & { userId: string; role: string };
      next();
    } catch {
      next(new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token!'));
    }
  };
};

export default auth;
