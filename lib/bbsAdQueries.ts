// Shared column list for single-ad reads (detail page + API).
// `groups` is a reserved word in MySQL 8 - it MUST stay backtick-quoted
// here. An unquoted AS groups 500s every ad view (digest 2512918052,
// 2026-09-16); a unit test below pins the quoting.
export const AD_COLUMNS = `
  a.id, a.bbs_id, b.name AS bbs_name, a.filename, a.filesize,
  a.content, a.encoding, a.is_ansi, a.phones_json AS phones,
  a.nodes, a.handles_json AS handles, a.groups_json AS \`groups\`,
  a.page_url
`;

export interface AdRow {
  id: number;
  bbs_id: number;
  bbs_name: string | null;
  filename: string | null;
  filesize: number | null;
  content: string | null;
  encoding: string | null;
  is_ansi: number | boolean | null;
  phones: string | null;
  nodes: number | null;
  handles: string | null;
  groups: string | null;
  page_url: string | null;
}

export function parseJsonList(s: unknown): string[] {
  if (typeof s !== "string") return [];
  try {
    const v: unknown = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
