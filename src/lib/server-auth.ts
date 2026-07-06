import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/lib/constants";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "@/lib/permissions";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuthorizationSummary,
  AuthSession,
} from "@/types";

const buildCookieHeader = async (): Promise<string> => {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
};

const fetchJson = async <T>(
  input: string,
): Promise<T> => {
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers({
    Accept: "application/json",
  });

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(input, {
    cache: "no-store",
    headers,
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const body = (await response.json()) as ApiErrorResponse;
      message = body.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const getServerSession = cache(async (): Promise<AuthSession | null> => {
  try {
    return await fetchJson<AuthSession | null>(
      `${APP_CONFIG.serverAuthBaseUrl}/get-session`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return null;
    }

    throw error;
  }
});

export const getServerAuthorization = cache(
  async (): Promise<AuthorizationSummary | null> => {
    try {
      const response =
        await fetchJson<ApiSuccessResponse<AuthorizationSummary>>(
          `${APP_CONFIG.serverApiBaseUrl}/permissions/me`,
        );

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return null;
      }

      throw error;
    }
  },
);

export const requireAuth = async (): Promise<AuthSession> => {
  const session = await getServerSession();

  if (!session?.session) {
    redirect("/login");
  }

  return session;
};

export const requirePermission = async (
  permission: string,
): Promise<AuthorizationSummary> => {
  const authorization = await getServerAuthorization();

  if (!authorization) {
    redirect("/login");
  }

  if (!hasPermission(authorization.permissions, permission)) {
    redirect(`/forbidden?missing=${encodeURIComponent(permission)}`);
  }

  return authorization;
};

export const requireAnyPermission = async (
  permissions: string[],
): Promise<AuthorizationSummary> => {
  const authorization = await getServerAuthorization();

  if (!authorization) {
    redirect("/login");
  }

  if (!hasAnyPermission(authorization.permissions, permissions)) {
    redirect(`/forbidden?missing=${encodeURIComponent(permissions.join(", "))}`);
  }

  return authorization;
};

export const requireAllPermissions = async (
  permissions: string[],
): Promise<AuthorizationSummary> => {
  const authorization = await getServerAuthorization();

  if (!authorization) {
    redirect("/login");
  }

  if (!hasAllPermissions(authorization.permissions, permissions)) {
    redirect(`/forbidden?missing=${encodeURIComponent(permissions.join(", "))}`);
  }

  return authorization;
};
