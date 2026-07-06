import type { NextConfig } from "next";

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

const appBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
);

const backendBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000",
);

const shouldProxyApi = backendBaseUrl !== appBaseUrl;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!shouldProxyApi) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
