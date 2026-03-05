import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google/generative-ai"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
