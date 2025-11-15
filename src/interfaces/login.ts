// interfaces/user.ts
export interface IUserCreate {
  name: string;
  email: string;
  password: string;
  contactNo: string;
  role?: "admin" | "employee";
  profileImg?: string;
  address?: string;
  linkedinUrl?: string;
  isFeatured?: boolean;
  profileDescription?: string;
  isAgent?: boolean;
  agentDescription?: string;
  twofaEnabled?: boolean;
}
export type ILoginUser = {
  email: string;
  password: string;
};

export type ILoginUserResponse = {
  token: string;
  refreshToken?: string;
  twoFa?: boolean;
  twoFaCode?: string; // For initial response
  tempToken?: string; // For 2FA verification
  message?: string;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

export type IVerify2FA = {
  code: string;
  tempToken: string;
};

export type IVerify2FAResponse = {
  token: string;
  refreshToken: string;
  user: any;
};
