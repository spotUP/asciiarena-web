# aSCIIaRENA Bot API v1 — chatbot integration guide

Public read-only JSON API for chatbots and scripts. No API key, no login.

- Base URL (live): `https://asciiarena.se`
- Human docs page: `https://asciiarena.se/api-docs`
- Machine spec: `https://asciiarena.se/api/v1/openapi` (OpenAPI 3.1 JSON, use it for codegen)
- Health + endpoint index: `GET /api/v1/status`

## Rules of the road

- Rate limit: 120 requests/minute per IP. Over budget returns `429` with a
  `Retry-After` header (seconds). Back off and retry; do not spin.
- CORS is fully open (`Access-Control-Allow-Origin: *`), so browser-based bots
  can fetch directly.
- All responses are `Cache-Control: public` cacheable. Cache `stats`/`status`
  for minutes; list/detail responses for ~60s.
- Everything is GET. There are no write endpoints in v1.

## Envelope format

Every list returns:

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 25, "total": 342, "total_pages": 14 }
}
```

Single-item endpoints return `{ "data": { ... } }`. Errors return
`{ "error": "message" }` with an HTTP status (400 bad request, 404 not found,
429 rate limited, 500 server error).

Pagination params: `page` (default 1), `per_page` (default 25, max 100;
aliases `pagesize`, `limit`). Search param: `q` (aliases `filter`, `query`).
Sort: `sort=` + `order=asc|desc` where offered.

## Individual logos (the main event)

Two logo concepts exist — do not mix them up:

- `/api/v1/logos` — individual ASCII logos TAGGED INSIDE collections
  (the `colly_logos` catalog). This is what you want for "logos by artist X".
- `/api/v1/site-logos` — standalone entries on the logo wall (the `logos`
  table). Different collection, `author` + `kind=ascii|ansi` filters.

### All logos by one artist

```bash
curl "https://asciiarena.se/api/v1/logos?artist=spot&per_page=100"
# or by id: /api/v1/logos?artist_id=42
# or by crew: /api/v1/logos?crew=up+rough  (or crew_id=7)
# only hand-tagged: &manual=true   |   only auto-detected: &manual=false
```

Each hit contains: `id`, `label`, `artist`/`artist_id`, `crew`/`crew_id`,
`manual` (true = human-tagged, false = auto-detected), `filename`,
`colly_name`, `position`, `start_line`/`end_line` (0-based into the colly
text), `line_count`, `text` (the ASCII art, up to 200 lines), plus links:

- `html_url` — viewer deep link, e.g. `/release/foo.lha#logo-3`
- `api_url` — canonical API URL for this logo, e.g. `/api/v1/logos/456`

### Every logo in one release

```bash
curl "https://asciiarena.se/api/v1/collys/123/logos"
# :id accepts a numeric id OR a filename:
curl "https://asciiarena.se/api/v1/collys/greetings.lha/logos"
```

Returns `{ data: [...], meta: { colly_id, total } }` with the same logo shape
as above.

### One logo

```bash
curl "https://asciiarena.se/api/v1/logos/456"
```

Adds a `lines[]` array (same content as `text` split per line) and a
`colly_url` (`/api/v1/collys/:id`) for the parent release.

### Full colly plaintext

```bash
curl "https://asciiarena.se/api/v1/collys/greetings.lha/text"
```

Returns `{ data: { id, filename, name, type, chars, lines, text, html_url } }`.
Same decoder as the on-site viewer. Prefer the per-logo slices above unless
you need the whole file.

## Collections, scene directory, misc

```bash
# collections: q, artist, crew, year, type, sort=name|filename|date|filesize|rating|views|downloads
curl "https://asciiarena.se/api/v1/collys?artist=spot&sort=date&order=desc"
curl "https://asciiarena.se/api/v1/collys/greetings.lha"   # detail (id or filename)
curl "https://asciiarena.se/api/v1/collys/123/comments"

curl "https://asciiarena.se/api/v1/artists?q=spot"          # artists (+ colly/logo counts)
curl "https://asciiarena.se/api/v1/artists/spot"            # detail by id or nick
curl "https://asciiarena.se/api/v1/crews?q=rough"
curl "https://asciiarena.se/api/v1/crews/7"                 # detail by id or name

curl "https://asciiarena.se/api/v1/mags?q=amiga"
curl "https://asciiarena.se/api/v1/apps?q=hippo"
curl "https://asciiarena.se/api/v1/bbs?q=nordic"

curl "https://asciiarena.se/api/v1/requests?status=0"       # 0 open, 1 filled, 2 denied
curl "https://asciiarena.se/api/v1/requests/5"              # with comments
curl "https://asciiarena.se/api/v1/comments?colly_id=123"   # latest comments

# one call, top hits everywhere (min 2 chars; fixed top-10 per section)
curl "https://asciiarena.se/api/v1/search?q=spot"

# archive totals
curl "https://asciiarena.se/api/v1/stats"
```

Artist/crew/colly detail responses embed cross-links (`logos_url`,
`api_url`, `html_url`), so a bot can walk artist -> releases -> logos without
guessing URL shapes. Prefer following those links over constructing URLs.

## Leaderboards + widgets

```bash
# all three leaderboards in one call (limit default 5, max 25)
curl "https://asciiarena.se/api/v1/tops?limit=10"

# top-rated artists / crews (default sort is by name)
curl "https://asciiarena.se/api/v1/artists?sort=rating&per_page=10"
curl "https://asciiarena.se/api/v1/crews?sort=rating&per_page=10"

curl "https://asciiarena.se/api/v1/news"                 # published news
curl "https://asciiarena.se/api/v1/news/3"               # one item with body

curl "https://asciiarena.se/api/v1/polls?status=open"    # open|closed, default all
curl "https://asciiarena.se/api/v1/polls/summer-2026"    # options + results when public

curl "https://asciiarena.se/api/v1/walls"                # wall boards
curl "https://asciiarena.se/api/v1/walls/1"              # latest 13 tags

curl "https://asciiarena.se/api/v1/online"               # nicks online + anon count
curl "https://asciiarena.se/api/v1/new-users"            # newest members
curl "https://asciiarena.se/api/v1/last-callers"         # recently active users
curl "https://asciiarena.se/api/v1/forum?limit=10"       # latest public forum posts

# BBS weektop via cached upstream proxy (source uploaders|bbs|globalwall)
curl "https://asciiarena.se/api/v1/weektop?source=uploaders"
```

## Suggested bot flows

"Show me logos by X": `/api/v1/logos?artist=X&per_page=100`, page through
`meta.total_pages`, render `text`, link `html_url` for "view on site".

"What's in release Y?": `/api/v1/collys/Y` for metadata, then
`/api/v1/collys/Y/logos` for the tagged logos and
`/api/v1/collys/Y/comments` for the discussion.

"Something about Z": `/api/v1/search?q=Z` first; if a section looks
promising, fan out to the dedicated list endpoint for full paging.

## Notes and limits

- `text` for auto-detected logos (`manual: false`) is a preview window from
  the start line, not a verified boundary. `manual: true` rows are
  human-mapped and exact.
- Logo `label` is the tagger's caption; `artist`/`crew` are resolved entity
  links and may be null when the label matched nothing.
- `site-logos` list items carry a 500-char `preview`; fetch the item URL for
  the full `text`.
- Timestamps in the API are unix seconds where present.
