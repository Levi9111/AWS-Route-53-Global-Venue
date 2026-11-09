export type TUserRole = 'renter' | 'host' | 'admin';

export type TRegisterUser = {
  name: string;
  email: string;
  password: string;
  role?: TUserRole;
};

export type TLoginUser = {
  email: string;
  password: string;
};

export type TUserPublic = {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: TUserRole;
  createdAt: Date;
};

export type TAuthResponse = {
  user: TUserPublic;
  accessToken: string;
};
