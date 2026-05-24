import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "asciiarena.se", "www.asciiarena.se"],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/playlist/:filename", destination: "/api/uhcplaylists?file=:filename" },
    ];
  },

  async redirects() {
    return [
      // Simple .php → clean URL
      { source: "/collys.php",      destination: "/collys",      permanent: true },
      { source: "/artists.php",     destination: "/artists",     permanent: true },
      { source: "/crews.php",       destination: "/crews",       permanent: true },
      { source: "/bbses.php",       destination: "/bbs",         permanent: true },
      { source: "/mags.php",        destination: "/mags",        permanent: true },
      { source: "/apps.php",        destination: "/apps",        permanent: true },
      { source: "/requests.php",    destination: "/requests",    permanent: true },
      { source: "/about.php",       destination: "/about",       permanent: true },
      { source: "/crib.php",        destination: "/settings",    permanent: true },
      { source: "/register.php",    destination: "/register",    permanent: true },
      { source: "/reminder.php",    destination: "/reminder",    permanent: true },
      { source: "/styleeditor.php", destination: "/styleeditor", permanent: true },
      { source: "/playlists.php",   destination: "/playlists",   permanent: true },
      { source: "/express.php",     destination: "/express",     permanent: true },
      { source: "/uhcsearch.php",   destination: "/api/uhcsearch",    permanent: true },
      { source: "/uhcplaylists.php",destination: "/api/uhcplaylists", permanent: true },
      { source: "/logoeditor.php",  destination: "/logoeditor",       permanent: true },
      { source: "/accounting.php",  destination: "/accounting",       permanent: true },
      { source: "/dialogues.php",   destination: "/dialogues",        permanent: true },
      { source: "/members.php",     destination: "/",                 permanent: true },
      { source: "/admin.php",       destination: "/admin",            permanent: true },
      { source: "/logout.php",      destination: "/",                 permanent: true },
      { source: "/messages.php",    destination: "/messages",         permanent: true },
      { source: "/submit.php",      destination: "/submit",           permanent: true },
      { source: "/rss.php",         destination: "/rss.xml",          permanent: true },
      {
        source: "/messages.php",
        has: [{ type: "query", key: "sendmsg", value: "(?<sendmsg>.+)" }],
        destination: "/messages?sendmsg=:sendmsg",
        permanent: true,
      },

      // Query-param PHP URLs → clean Next.js routes
      {
        source: "/info_release.php",
        has: [{ type: "query", key: "filename", value: "(?<filename>.+)" }],
        destination: "/release/:filename",
        permanent: true,
      },
      {
        source: "/info_artist.php",
        has: [{ type: "query", key: "artist", value: "(?<artist>.+)" }],
        destination: "/artist/:artist",
        permanent: true,
      },
      {
        source: "/info_crew.php",
        has: [{ type: "query", key: "crew", value: "(?<crew>.+)" }],
        destination: "/crew/:crew",
        permanent: true,
      },
      {
        source: "/info_bbs.php",
        has: [{ type: "query", key: "id", value: "(?<id>\\d+)" }],
        destination: "/bbs/:id",
        permanent: true,
      },
      {
        source: "/info_requests.php",
        has: [{ type: "query", key: "id", value: "(?<id>\\d+)" }],
        destination: "/requests/:id",
        permanent: true,
      },
      {
        source: "/info_mags.php",
        has: [{ type: "query", key: "filename", value: "(?<filename>.+)" }],
        destination: "/magazine/:filename",
        permanent: true,
      },
      {
        source: "/info_apps.php",
        has: [{ type: "query", key: "filename", value: "(?<filename>.+)" }],
        destination: "/application/:filename",
        permanent: true,
      },
      {
        source: "/members.php",
        has: [{ type: "query", key: "member", value: "(?<member>.+)" }],
        destination: "/member/:member",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
