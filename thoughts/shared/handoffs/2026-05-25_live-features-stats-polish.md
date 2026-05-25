---
date: 2026-05-25
topic: live-features-stats-polish
tags: [sse, live, stats, globalwall, polish]
status: final
---

# Handoff — Live Features, Stats Page, and UI Polish

## Branch
`modernize/typescript-nextjs` — all changes committed, deployed to asciiarena.se (prod).

## What Was Done This Session

### Live SSE infrastructure
- `lib/live.ts` — in-process channel Map, `subscribe()`, `broadcast()`, `subscriberCount()`
- `app/api/live/route.ts` — GET: SSE stream with 25s keepalive pings; POST: authenticated broadcast
- Channel naming: `wall:1`, `comments:{collyId}`, `site:comments`, `site:releases`, `requests:{requestId}`, `user:{userId}:messages`

### Live wall typing (SiteWall + GlobalWall)
- `components/widgets/home/SiteWall.tsx` — live drafts merged into posts row, red blinking block cursor (`.cursor-block`), submit form
- `components/widgets/home/GlobalWall.tsx` — added submit form, proxied through `/api/globalwall/post/route.ts` to scenewall.bbs.io:1543 with random ANSI color prefix and special-char encoding
- `app/api/wall/route.ts` — broadcasts `posted` event after INSERT

### Live release page
- `app/release/[filename]/ReleaseClient.tsx` — live comment drafts, watcher count ("N watching"), view counter; comment form now **always visible at top of comments** (no "Add Comment" button needed)
- `app/api/collys/[id]/comments/route.ts` — broadcasts to `comments:{collyId}` and `site:comments`
- `app/api/collys/[id]/view/route.ts` — broadcasts `viewed` event

### Live messages
- `components/layout/UnreadBadge.tsx` — subscribes to `user:{userId}:messages`, re-fetches `/api/messages/unread`
- `components/layout/Navbar.tsx` — passes `session?.user?.id` to UnreadBadge
- `app/messages/MessagesClient.tsx` — subscribes to SSE, reloads inbox on message event
- `app/api/messages/route.ts` — broadcasts to `user:{receiver}:messages` after INSERT

### Live request comments
- `app/requests/[id]/RequestDetailClient.tsx` — live drafts, SSE on `requests:{requestId}`
- `app/api/requests/[id]/comments/route.ts` — broadcasts `posted` event

### Live homepage widgets
- `components/widgets/home/LatestComments.tsx` — client component subscribing to `site:comments`
- `app/api/comments/latest/route.ts` — new endpoint, last 10 comments
- `components/widgets/home/LatestReleasesLive.tsx` — client component subscribing to `site:releases`
- `components/widgets/home/LatestReleasesStatic.tsx` — extracted server component (used for RANDOM RELEASES)
- `components/widgets/home/LatestReleases.tsx` — routes: `random` prop → Static, default → Live
- `app/api/releases/latest/route.ts` — new endpoint, reads DB + .diz files from filesystem

### Stats page
- `app/stats/page.tsx` — server-rendered, `?count=` param (5/10/20/50, default 10)
- Sections: Arena totals, Top Artists, Top Crews, Top Collys, Most Viewed, Most Downloaded, Top Uploaders, Top Commenters
- All queries run in parallel via `Promise.all`
- **STATS** link added to navbar

### Weektop loading animation
- `components/widgets/Weektop.tsx` and `components/widgets/BBSWeektop.tsx`
- Shows `DotsLoader` (cycling `... .. .  .. ` at 350ms) while external API is pending

### AnsiLove race condition fix
- `app/release/[filename]/page.tsx` — inline `ansi-render` script now polls `typeof AnsiLove !== 'undefined'` every 50ms before calling, preventing `.LOADiNG.` stuck state

### Auth fix
- `AUTH_URL=https://asciiarena.se` set in server `.env` — fixes login/logout redirecting to localhost:3001
- Removed `middleware.ts` workaround

### CSS additions (`assets/css/overrides.css`)
```css
.blink { animation: blink 1s step-end infinite; }
.cursor-block {
  display: inline-block; width: 0.55em; height: 1em;
  background: #ff5555; vertical-align: text-bottom;
  animation: blink 1s step-end infinite;
}
```

## Multi-Tab Bug (User-Reported)
**Status: No longer valid.** Old PHP/jQuery era bug. Next.js implementation is clean — each tab has its own SSE connection, all React state is encapsulated. Only minor thing: `localStorage` race on Recently Viewed list if two tabs view different releases simultaneously (benign, one entry may not persist).

## Architecture Notes

### SSE keepalive
Apache reverse proxy was buffering SSE responses. Fixed with:
- `ProxyBuffering Off` in both Apache vhosts
- `X-Accel-Buffering: no` response header
- 25s server-side keepalive ping (`: keepalive\n\n`)

### GlobalWall proxy
Direct browser POST to scenewall.bbs.io:1543 blocked by CORS. Proxy at `/api/globalwall/post` handles auth, ANSI color prefix (random ESC[3Xm), special-char encoding (`[→&#91;` etc), and forwards as JSON.

### SSH stability
`ClientAliveInterval 60`, `ClientAliveCountMax 10` set in `/etc/ssh/sshd_config` on server. Use `rsync -e "ssh -o ServerAliveInterval=10"` for deploys.

## Known Issues / Future Work

- **Hippoplayer online-documents widget** — planned sidebar showing live editing sessions on hippoplayer.se. Blocked until hippoplayer multi-user feature ships.
- **Stats page** — no caching (queries run fresh on every page load). Could add `unstable_cache` with the count in the cache key if it becomes slow.
- **GlobalWall** — no live typing drafts for other users (unlike SiteWall). scenewall.bbs.io doesn't push events so polling/delay is the only option.
- **apl-1 CSS bug** — `assets/css/site.css` has two conflicting `.apl-1` definitions (8px and 16px); the 16px one wins. Padding fixes in this session use inline `style={{ paddingLeft: "8px" }}` to work around this.
- **SSH drops during rsync** — intermittent server-side drops still happen. Always use `-e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6"` for rsync deploys.

## Deploy Process
```bash
npm run build
rsync -a --delete --exclude='cache' -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  .next/ spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/
rsync -aL -e "ssh -o ServerAliveInterval=10" \
  public/ spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/public/
ssh -o ServerAliveInterval=10 spot@97.75.89.139 \
  "sudo systemctl restart asciiarena-next && sleep 5 && systemctl is-active asciiarena-next"
```
Or just run `bash deploy.sh` (same thing, but SSH drops have been intermittent — retry rsync steps manually if it fails).

## Next Steps (No Specific Priority)
1. Test the always-open comment form on release pages — verify live drafts still work for other users
2. Test GlobalWall submit form on mobile — padding and width fixes were deployed
3. Stats page — consider adding downloads count to arena totals
4. Hippoplayer widget — wait for multi-user feature, then add sidebar widget
