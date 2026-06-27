export function buildAdminCollyEditHref(filename: string): string {
  return `/admin/collys?q=${encodeURIComponent(filename)}`;
}
