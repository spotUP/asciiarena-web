import type { MetadataRoute } from "next";
const BASE = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${BASE}/sitemap.xml` };
}
