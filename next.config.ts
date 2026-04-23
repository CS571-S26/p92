import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: [
    "@skinshi/auth-worker",
    "@skinshi/polymarket-service",
    "@skinshi/steam-service",
  ],
  env: {
    AUTH_WORKER_URL: process.env.AUTH_WORKER_URL || "https://auth.skinshi.com",
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
