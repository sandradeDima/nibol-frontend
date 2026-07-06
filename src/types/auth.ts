export interface AuthUser {
  email: string;
  emailVerified: boolean;
  id: string;
  image?: string | null;
  name: string;
}

export interface AuthSession {
  session: {
    expiresAt: string;
    id: string;
    ipAddress?: string | null;
    token: string;
    updatedAt?: string;
    userAgent?: string | null;
    userId: string;
  };
  user: AuthUser;
}

export interface AuthActionResponse {
  status: boolean;
}

export interface AuthMessageResponse extends AuthActionResponse {
  message: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  newPassword: string;
  token: string;
}
