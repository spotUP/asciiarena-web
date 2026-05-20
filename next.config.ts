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
  async redirects() {
    return [
      { source: "/collys.php", destination: "/collys", permanent: true },
      { source: "/artists.php", destination: "/artists", permanent: true },
      { source: "/crews.php", destination: "/crews", permanent: true },
      { source: "/bbses.php", destination: "/bbs", permanent: true },
      { source: "/mags.php", destination: "/mags", permanent: true },
      { source: "/apps.php", destination: "/apps", permanent: true },
      { source: "/requests.php", destination: "/requests", permanent: true },
      { source: "/about.php", destination: "/about", permanent: true },
    ];
  },
};

export default nextConfig;
