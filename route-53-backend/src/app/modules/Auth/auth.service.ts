import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import AppError from '../../errors/AppError';
import config from '../../config';
import { createToken } from '../../utils/jwt.utils';
import { TLoginUser } from './auth.interface';
import { UserModel } from './auth.model';

const loginUser = async (payload: TLoginUser) => {
  const user = await UserModel.findOne({ email: payload.email }).select(
    '+password',
  );
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const jwtPayload = {
    userId: user.id || user._id,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      userId: user.id || user._id,
      email: user.email,
      role: user.role,
    },
  };
};

export const AuthService = { loginUser };
