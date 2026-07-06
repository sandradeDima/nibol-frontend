import axios from "axios";

import { APP_CONFIG } from "@/lib/constants";
import type {
  AuthActionResponse,
  AuthMessageResponse,
  AuthSession,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

const authApi = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: APP_CONFIG.apiTimeoutMs,
  withCredentials: true,
});

const loginCallbackUrl = `/login?verified=1`;
const resetCallbackUrl = `/reset-password`;

const request = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const authService = {
  async forgotPassword(input: ForgotPasswordInput): Promise<AuthMessageResponse> {
    return request(
      authApi.post("/auth/request-password-reset", {
        email: input.email,
        redirectTo: resetCallbackUrl,
      }),
    );
  },

  async getSession(): Promise<AuthSession | null> {
    return request(authApi.get("/auth/get-session"));
  },

  async login(input: LoginInput): Promise<void> {
    await request(
      authApi.post("/auth/sign-in/email", {
        ...input,
        callbackURL: loginCallbackUrl,
      }),
    );
  },

  async logout(): Promise<void> {
    await request(authApi.post("/auth/sign-out"));
  },

  async register(input: RegisterInput): Promise<void> {
    await request(
      authApi.post("/auth/sign-up/email", {
        ...input,
        callbackURL: loginCallbackUrl,
      }),
    );
  },

  async resendVerificationEmail(email: string): Promise<AuthActionResponse> {
    return request(
      authApi.post("/auth/send-verification-email", {
        callbackURL: loginCallbackUrl,
        email,
      }),
    );
  },

  async resetPassword(input: ResetPasswordInput): Promise<AuthActionResponse> {
    return request(
      authApi.post("/auth/reset-password", {
        newPassword: input.newPassword,
        token: input.token,
      }),
    );
  },
};
