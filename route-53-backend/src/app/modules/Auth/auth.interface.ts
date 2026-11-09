export type TLoginUser = {
  email: string;
  password: string;
};

export type TUserRole = 'ADMIN' | 'USER';

export type TLoginResponse = {
  userId: string;
  email: string;
  role: TUserRole;
};
