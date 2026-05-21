import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
const BASE = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${BASE}/sitemap.xml` };
}
