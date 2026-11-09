import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';
import { TAuthResponse, TUserPublic } from './auth.interface';
import config from '../../config';

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  const isProduction = config.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse<TAuthResponse>(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'User registered successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse<TAuthResponse>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User logged in successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await AuthService.refreshUserToken(token);
  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse<TAuthResponse>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthService.getMe(req.user.userId);
  sendResponse<TUserPublic>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Current user profile fetched successfully',
    data: user,
  });
});

export const AuthControllers = {
  register,
  login,
  refresh,
  logout,
  getMe,
  getProfile: getMe,
};
