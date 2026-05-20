import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://asciiarena.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collys, artists, crews] = await Promise.all([
    prisma.collys.findMany({ select: { filename: true, timestamp: true } }),
    prisma.artists.findMany({ select: { artisturl: true } }),
    prisma.crews.findMany({ select: { crewurl: true } }),
  ]);

  const releaseUrls: MetadataRoute.Sitemap = collys.map((c) => ({
    url: `${BASE_URL}/release/${c.filename}`,
    lastModified: c.timestamp ? new Date(c.timestamp * 1000) : undefined,
    priority: 0.8,
  }));

  const artistUrls: MetadataRoute.Sitemap = artists
    .filter((a) => a.artisturl)
    .map((a) => ({
      url: `${BASE_URL}/artist/${a.artisturl}`,
      priority: 0.6,
    }));

  const crewUrls: MetadataRoute.Sitemap = crews
    .filter((c) => c.crewurl)
    .map((c) => ({
      url: `${BASE_URL}/crew/${c.crewurl}`,
      priority: 0.6,
    }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, priority: 1.0 },
    { url: `${BASE_URL}/collys`, priority: 0.9 },
    { url: `${BASE_URL}/artists`, priority: 0.7 },
    { url: `${BASE_URL}/express`, priority: 0.7 },
    { url: `${BASE_URL}/requests`, priority: 0.5 },
  ];

  return [...staticUrls, ...releaseUrls, ...artistUrls, ...crewUrls];
}
