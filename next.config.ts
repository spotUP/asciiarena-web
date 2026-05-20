import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "asciiarena.se"],
    },
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
