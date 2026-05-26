---
date: 2026-05-26
topic: admin-ux-overhaul
tags: [admin, ux, refactor]
status: draft
---

# Plan: Admin Interface UX Overhaul

## Current State

Single file `app/admin/page.tsx` (414 lines):
- All 11 management sections crammed into one page with hash-based tab routing
- All UI logic lives in an inline `<Script>` tag — string-concatenated HTML, no types, no React
- No server-side data fetching — everything is client-side `fetch()`
- No pagination on any list
- No bulk operations
- No overview / stats dashboard
- Accessing a specific section requires `/admin#colly` etc. — not bookmarkable, breaks back/forward

## Proposed Architecture

Split into proper Next.js route segments under `app/admin/`, each a dedicated React page.

```
app/admin/
  layout.tsx              — shared admin shell: sidebar nav, auth guard
  page.tsx                — dashboard: site stats at a glance
  collys/page.tsx         — broken collys list + search/edit
  users/page.tsx          — search users, edit rank/crew, delete
  users/inactive/page.tsx — list inactive accounts, bulk delete
  artists/page.tsx        — search + edit artists
  crews/page.tsx          — search + edit crews
  logos/page.tsx          — logo list + add/delete
  content/page.tsx        — apps + mags (low frequency, share a page)
  bbs/page.tsx            — BBS list + edit
  requests/page.tsx       — request search + delete
```

### Layout (`app/admin/layout.tsx`)

- Auth guard: redirect to `/` if rank !== "Admin"
- Left sidebar: vertical nav links replacing Bootstrap tab strip
- Consistent page header with breadcrumb
- Real URLs per section — bookmarkable, browser history works

### Each Page Pattern

Server component fetches initial data; client component handles mutations via existing `/api/admin/*` routes.

Pages with large datasets (collys, users) get paginated tables (25/page) with sort and filter.

### Dashboard (`app/admin/page.tsx`)

Stats cards:
- Total users / active last 30 days
- Total collys / broken collys count
- Pending requests count
- Unclaimed artists (user_id IS NULL)
- Last 10 uploads

### Users Page Improvements

- Search by nick, filter by rank
- Columns: nick, rank, joined, lastactive, uploads
- Inline rank/crew edit (same as now)
- Link to inactive accounts page

### Inactive Users (`app/admin/users/inactive/page.tsx`)

- List users where `lastactive` is NULL or older than configurable threshold (1y / 2y / 5y / never logged in)
- Columns: nick, joined, lastactive, uploads, comments, rank
- Checkbox per row + Select All
- "Delete Selected" with confirmation
- Always excludes Admin rank accounts
- New API route: `GET /api/admin/users/inactive?threshold=2`  (years)
- New API route: `DELETE /api/admin/users/inactive` body: `{ ids: number[] }`

### Implementation Order

1. `layout.tsx` — auth guard + sidebar nav (everything else builds on this)
2. Dashboard — quick win, shows site health
3. Users + Inactive — highest-value admin task
4. Collys — most-used section
5. Artists / Crews
6. Logos / Content / BBS / Requests — low frequency, migrate last

### What Stays the Same

- All existing `/api/admin/*` routes — API layer unchanged
- Admin auth pattern (`rank === "Admin"`)
- BBS visual aesthetic (same CSS classes)
- No schema changes

### Verification

Automated: `npx tsc --noEmit`, `npm run build`

Manual per page:
- Non-admin gets 404
- Each CRUD operation works end-to-end
- Deep links and back/forward work
