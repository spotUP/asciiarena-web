import NewsAdminClient from "./NewsAdminClient";

export const dynamic = "force-dynamic";

// Admin auth is enforced by app/admin/layout.tsx (redirects non-admins) and
// again by every /api/admin/news handler, so the UI never carries the check.
export default function AdminNewsPage() {
  return <NewsAdminClient />;
}
