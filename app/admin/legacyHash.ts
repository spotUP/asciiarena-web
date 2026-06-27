export function buildLegacyAdminHashRedirect(hash: string): string | null {
  const match = hash.match(/^#colly\?getcollyname=(.+)$/);
  if (!match) return null;

  const filename = decodeURIComponent(match[1]);
  return `/admin/collys?q=${encodeURIComponent(filename)}`;
}
