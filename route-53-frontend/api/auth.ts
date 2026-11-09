import { apiRequest } from './client';
import { SingleResponse, User, UserRole } from './types';

export interface AuthPayload {
  user: User;
  accessToken: string;
}

export const authApi = {
  async register(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthPayload> {
    const res = await apiRequest<SingleResponse<AuthPayload>>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthPayload> {
    const res = await apiRequest<SingleResponse<AuthPayload>>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return res.data;
  },

  async refresh(): Promise<AuthPayload> {
    const res = await apiRequest<SingleResponse<AuthPayload>>(
      '/api/auth/refresh',
      {
        method: 'POST',
      },
    );
    return res.data;
  },

  async logout(): Promise<void> {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  async getMe(): Promise<User> {
    const res = await apiRequest<SingleResponse<User>>('/api/auth/me', {
      method: 'GET',
    });
    return res.data;
  },
};
