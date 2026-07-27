---
date: 2026-07-27
topic: public-logo-tagging
tags: [collys, logos, tagging, search, community]
status: final
---

# Public logo tagging — design

Let every logged-in user map the logos inside a colly, so the catalog fills up
from the community instead of from admins alone. The payoff is search: type
"dipswitch" and get every dipswitch logo across every colly, each a clickable
deep link.

The editor for this already exists and is already good. Almost all of the work
is opening a door.

## What exists today

- `components/submit/CollyPreview.tsx` — the map editor. Renders the colly with
  a line-numbered gutter, draws a band per logo, and edits captions through a
  name / by / for decomposition. It takes `report`, `logoMap` and `setLogoMap`
  as props and has **no admin coupling whatsoever**.
- `GET /api/collys/preview?filename=` — builds the report for an existing colly
  on disk: decoded text, art bytes, detected-or-mapped logos, index, warnings.
  Currently admin-gated (`app/api/collys/preview/route.ts`).
- `PATCH /api/admin/collys` with `{logos}` — the only persistence path. Runs
  `buildLogoRowsFromMap` and replaces the colly's `colly_logos` rows with
  `manual = 1`.
- `lib/collyLogoRows.ts` — pure, tested map-to-catalog-rows logic.

Two consumers read `colly_logos`: search, and the release viewer (a manual map
drives sections, autoplay, the index and the minimap).

## Scope

**In:** the logo map — line ranges and captions — for any published colly.

**Out:** everything else about the colly. Name, artists, crews, font, colours
and soundtrack stay with admins and the uploader. A tagger is annotating
someone else's art, not editing its record.

**Never:** rewriting the file on disk. The Ctrl-Z trailer is the artist's own
metadata and a third party must not touch it. `colly_logos` rows already drive
rendering and search, so database-only is sufficient.

## Permissions

Any logged-in account may tag any colly, including one already tagged. Last
write wins.

No extra rank check is needed: `isRankLoginBlocked` in `lib/accountRules.ts`
already stops unactivated (`Inactive`) accounts at login, so holding a session
is proof enough of an activated account.

Admin-picked maps get no special protection. Open wiki means open wiki — the
history below makes a bad edit cheap to undo, which is a better defence than a
lock that also blocks every good edit.

## Data model

One new table. No changes to `colly_logos`.

```prisma
model colly_logo_edits {
  id         Int    @id @default(autoincrement()) @db.UnsignedInt
  colly_id   Int    @db.UnsignedInt
  user_id    Int    @db.UnsignedInt
  timestamp  Int    // unix seconds, matching `comments`
  map        String @db.MediumText  // JSON: [{line, end?, caption}, ...]
  logo_count Int    // entries in `map`, denormalized for the leaderboard

  @@index([colly_id, id])
  @@index([user_id])
}
```

The newest row for a colly **is** that colly's current map. `colly_logos` is a
derived index rebuilt from it, exactly as the admin path rebuilds it today.

Reverting replays an older row as a *new* edit attributed to the admin doing
the revert. History is append-only and never loses a step.

`logo_count` counts what the user saved. The catalog may hold fewer rows —
`buildLogoRow` deliberately drops uncaptioned "Logo N" entries and captions
whose subject does not look like a handle. The panel surfaces that gap using
the warning the preview API already computes.

### Why not a column on `colly_logos`

`colly_logos.user_id` is taken: it means "this logo is credited to this site
member", written by caption matching in `resolveEntities` and reported by the
preview API as `resolved: "member"`. Reusing it for "who tagged this" would
corrupt logo search.

Adding a *new* `tagged_by` column alongside the snapshots was considered and
rejected: it stores the same fact twice, and the two disagree the moment a
revert happens. One record, one truth.

### Collys tagged before this feature

They have `colly_logos` rows but no snapshot. The editor seeds from the
existing manual rows — the same read the admin editor already performs
(`GET /api/admin/collys?logos=<id>`) — and the first public save writes the
first snapshot. Nothing needs backfilling, and nothing is lost.

## API

### `POST /api/collys/[id]/logos`

Auth: any session. Body: `{logos: [{line, end?, caption}]}` — the same shape
the admin PATCH accepts, validated by a schema shared between both routes so
they cannot drift.

In one transaction: append the `colly_logo_edits` row, then
`deleteMany` + `createMany` the colly's `colly_logos` rows from
`buildLogoRowsFromMap(id, logos, await loadEntityDicts())` with `manual = 1`.

Then `revalidatePath('/release/' + filename)` so the viewer picks up the new
sections.

An unknown colly id is a 404 — checked before any write, so a bad id never
leaves an orphaned snapshot behind.

An empty `logos` array is a legitimate save: it clears the map and returns the
colly to automatic detection. Destructive, and therefore exactly what the
history is for.

### `GET /api/collys/[id]/logos`

Returns the edit history for the panel: id, nick, timestamp, logo_count,
newest first, capped at 20.

### `POST /api/collys/[id]/logos/revert`

Admin only. Takes an edit id, replays that map through the same write path as a
new edit.

### `GET /api/collys/preview?filename=`

Drop the admin gate to any logged-in session. It is a read-only dry run of a
file that is already publicly downloadable; nothing it returns is privileged.

## UI

Tagging is a **mode of the existing viewer**, not a second copy of the art.

`app/release/[filename]/ReleaseClient.tsx` already toggles the colly with
`collyVisible`. Tag mode becomes a third state of that same slot:

- A "Tag Logos" button in the control bar, for logged-in users only, swaps the
  normal viewer out and mounts the editor in its place. Same position on the
  page, no scroll jump, no duplicate render.
- While tagging, the minimap, index panel and autoplay/groove controls are
  hidden. They navigate the reading view and mean nothing in an editor that has
  its own gutter and bands.
- "Done" restores the viewer.

The editor is loaded with `next/dynamic` and `ssr: false`, so its bundle is
fetched on first entry into tag mode. Readers who never tag download nothing.

It inherits the reader's current font, foreground and background —
`CollyPreview` already accepts these as props — so what you tag looks like what
you were just reading.

Below the editor: Save, Cancel, the preview API's warnings, and a compact
history list ("mapped by dipswitch, 3 hours ago, 7 logos"). The revert control
renders only for admins.

The whole panel lives in a new `components/release/LogoTagPanel.tsx`. It owns
the report fetch, the map state, saving and the history — `ReleaseClient.tsx` is
already 1300+ lines and gains only the mode flag and the button.

### Known rendering caveat

`CollyPreview` renders from the preview API's own decode (`report.text` /
`report.artB64`), a different code path from the release viewer's. They agree
on content — the preview endpoint strips the `file_id.diz` at byte level
precisely so line numbers line up. If a colly ever renders subtly differently
in tag mode, that is the reason, and the fix belongs in the shared decode
rather than in either renderer.

## Testing

Pure units, in the established `lib/__tests__` style:

- **Shared payload schema** — accepts a valid map; rejects `line: 0`, negative
  and non-integer lines, `end` before `line`, and over-long captions. The
  colly PATCH schema lesson applies: the contract is asserted directly.
- **Snapshot round trip** — a map serialized to the `map` column and read back
  yields the identical array; `logo_count` matches its length.
- **Revert semantics** — replaying edit N produces the same `colly_logos` rows
  as edit N did, and appends rather than rewrites history.
- **Catalog rebuild** — `buildLogoRowsFromMap` over a map containing an
  uncaptioned entry yields fewer rows than `logo_count`, which is what the
  panel's warning reports.

Route-level, with the small-fake pattern from
`app/actions/__tests__/colly-vote.test.ts`:

- A logged-out POST is rejected; a logged-in POST writes both the snapshot and
  the catalog rows **in one transaction**.
- Revert is refused for a non-admin session.

## Deliberately excluded

- Rate limiting. The community is small and every edit is attributed and
  revertible. Add it if it is ever actually needed.
- Live broadcast of tagging activity over the existing SSE channels. Nice, not
  required for the catalog to fill.
- The tagger leaderboard widget. It is a separate piece of work that this
  design's snapshot table makes possible; the data accumulates from day one.
