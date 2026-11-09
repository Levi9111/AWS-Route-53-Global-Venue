import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import config from '../../config';
import { createToken, verifyToken } from '../../utils/jwt.utils';
import {
  TLoginUser,
  TRegisterUser,
  TUserPublic,
} from './auth.interface';
import { IUser, UserModel } from './auth.model';
import { Types } from 'mongoose';

function toPublicUser(user: IUser & { _id: Types.ObjectId }): TUserPublic {
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt || new Date(),
  };
}

function generateAuthTokens(user: TUserPublic) {
  const jwtPayload = {
    userId: user._id,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_secret,
    config.jwt_expires_in,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return { accessToken, refreshToken };
}

const registerUser = async (payload: TRegisterUser) => {
  const existing = await UserModel.findOne({
    email: payload.email.toLowerCase(),
  });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'An account with this email already exists',
      'EMAIL_ALREADY_EXISTS',
    );
  }

  const passwordHash = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_rounds || 12,
  );

  const created = await UserModel.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash,
    role: payload.role || 'renter',
  });

  const publicUser = toPublicUser(
    created as IUser & { _id: Types.ObjectId },
  );
  const tokens = generateAuthTokens(publicUser);

  return {
    ...tokens,
    user: publicUser,
  };
};

const loginUser = async (payload: TLoginUser) => {
  const user = await UserModel.findOne({
    email: payload.email.toLowerCase(),
  }).select('+passwordHash');

  if (!user) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordMatch) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  const publicUser = toPublicUser(user as IUser & { _id: Types.ObjectId });
  const tokens = generateAuthTokens(publicUser);

  return {
    ...tokens,
    user: publicUser,
  };
};

const refreshUserToken = async (refreshToken?: string) => {
  if (!refreshToken) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Refresh token is missing',
      'UNAUTHORIZED',
    );
  }

  let decoded;
  try {
    decoded = verifyToken(refreshToken, config.jwt_refresh_secret);
  } catch {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Invalid or expired refresh token',
      'UNAUTHORIZED',
    );
  }

  const user = await UserModel.findById(decoded.userId);
  if (!user) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'User no longer exists',
      'UNAUTHORIZED',
    );
  }

  const publicUser = toPublicUser(user as IUser & { _id: Types.ObjectId });
  const tokens = generateAuthTokens(publicUser);

  return {
    ...tokens,
    user: publicUser,
  };
};

const getMe = async (userId: string): Promise<TUserPublic> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'User not found',
      'USER_NOT_FOUND',
    );
  }
  return toPublicUser(user as IUser & { _id: Types.ObjectId });
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshUserToken,
  getMe,
};
