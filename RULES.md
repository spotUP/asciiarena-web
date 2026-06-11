# asciiarena project rules

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run test:ci` | Run all tests (Vitest) |
| `npx tsc --noEmit` | Type check |
| `./deploy.sh` | Deploy to 97.75.89.139 |

## ASCII-only UI

**No Unicode characters anywhere in UI text, button labels, placeholders, headings, or alerts.**

This is an ASCII art site. Everything the user sees must use 7-bit ASCII only.

Forbidden in any user-visible string:
- Arrows: use `<` `>` `/` `\` instead of `←` `→` `↑` `↓` `=>` `=>`
- Em/en dashes: use `-` or `--` instead of `—` `–`
- Ellipsis: use `...` instead of `…`
- Multiplication/close: use `x` or `X` instead of `×`
- Smart quotes: use `"` `'` instead of `"` `"` `'` `'`
- Any other non-ASCII glyph in a label, placeholder, heading, or button

Code comments and TypeScript source may use Unicode freely.

## Stack

- **Runtime**: Node 20, Next.js 16 App Router, TypeScript strict
- **CSS**: BOOTSTRA.386 v5.3.1 (Bootstrap 5 retro theme, `/assets/css/bootstrap5.min.css`) + `site.css` + `overrides.css`
- **JS**: Bootstrap 5 bundle (`/public/assets/js/bootstrap5.bundle.min.js`, NOT npm)
- **DB**: MySQL 8 via Prisma 7 + `@prisma/adapter-mariadb`
- **Auth**: NextAuth v5 with credentials provider (bcrypt, trustHost: true)
- **Deploy**: nginx reverse proxy -> Next.js on port 3001, systemd service `asciiarena-next`

## CSS load order (critical)

Must load in this exact order — Next.js injects globals.css first (before link tags), so overrides.css wins cascade by loading last:
1. `globals.css` (Next.js injects this — keep it minimal: only CSS custom properties)
2. `/assets/css/bootstrap5.min.css` (BOOTSTRA.386 v5.3.1 retro theme)
3. `/assets/css/bootstrap-colorselector.css`
4. `/assets/css/site.css` (site-specific overrides)
5. `/assets/css/386.css`
6. `/assets/css/overrides.css` (Bootstrap 5 regression fixes + BS4->BS5 component parity — must load LAST)

Importing Bootstrap from npm breaks the theme. Always load it as a `<link>` tag.

## File encoding

ASCII art files are ISO-8859-1 / CP437, not UTF-8. When reading collection files:
- Use `TextDecoder("utf-8", { fatal: true })` first
- Fall back to `Array.from(buf).map(b => String.fromCharCode(b)).join("")` for Latin-1
- Then HTML-escape the result

## Deployment notes

**NEVER run `npm ci` or `npm run build` on the live server.** It saturates the VPS CPU for
5+ minutes, RSC navigation requests time out, and the site appears broken (clicks do nothing).
Build always happens on the GitHub Actions ubuntu runner.

**The three rsync targets** (all required — missing any one breaks the site):
1. `.next/standalone/` → `nextjs-current/` — server entry point + server-side app files + pruned node_modules
2. `.next/static/` → `nextjs-current/.next/static/` — client JS chunks + CSS (NOT included in standalone output)
3. `public/` → `nextjs-current/public/` — favicon, Bootstrap JS/CSS, manifests

**Deploys only trigger on `modernize/typescript-nextjs`** — never on feature branch pushes.

**HTTP/2 is mandatory on the 443 listen directive** (`listen 443 ssl http2;`). The site holds
7 concurrent SSE channels per tab; on HTTP/1.1 browsers cap at 6 connections per host, so the
SSE streams exhaust the pool and ALL clicks and fetches hang -- links appear dead, widgets never
load, while curl reports the server healthy. Verify after any nginx change:
`curl -sI https://asciiarena.se/ | head -1` must print `HTTP/2 200`.

**nginx config** lives in `deploy/asciiarena.se-nginx.conf` (source of truth). CI copies it to
`/tmp/asciiarena-nginx.conf` and the server-side script applies it if changed. If nginx ever
reverts to PHP config (Certbot cert renewal can do this), the next deploy fixes it.
Emergency manual fix: `sudo cp nextjs-current/deploy/asciiarena.se-nginx.conf /etc/nginx/sites-available/asciiarena.se && sudo nginx -t && sudo systemctl reload nginx`

**Certbot** must stay configured with `installer = nginx` (not `apache`) in
`/etc/letsencrypt/renewal/asciiarena.se.conf` — verify with `sudo certbot renew --dry-run`.

**`.env`** lives at `nextjs-current/.env` on the server — never in git, never overwritten by deploy
(rsync explicitly excludes it). Contains DB, NextAuth, SMTP secrets.

Static assets (`/assets/`, `/fonts/`, `/collections/`, `/apps/`, `/mags/`) served directly by
nginx — `/assets/` and `/fonts/` from `nextjs-current/` (git-tracked), `/collections/` `/apps/`
`/mags/` from `/var/www/asciiarena.se/` (large binaries outside git).

Full post-mortem: `thoughts/shared/handoffs/2026-06-11_deploy-postmortem.md`

## Next.js router footguns (each broke production once)

- **Never call `router.replace("?")` or `router.push("?")`.** In the App Router a bare `"?"`
  resolves to the root route `/`, not the current page -- it silently corrupts router state and
  makes every subsequent `<Link>` click dead. For query-string-only URL sync use
  `window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""))`.
  Repo must stay clean: `grep -rn 'router\.replace.*"?"' app/ components/` returns nothing.
- **Never return error sentinels (null/empty) from inside `unstable_cache`** -- the cache stores
  whatever the function returns, so one transient upstream failure gets pinned for the whole
  revalidate window. Throw on failure (thrown errors are never cached) and catch in the caller.

Full debugging history: `thoughts/shared/handoffs/2026-06-11_deploy-postmortem.md` has a
"clicks do nothing" diagnostic checklist covering all six root causes.

## Uniform font size (terminal aesthetic)

The site emulates a text terminal. All visible text must render at the same fixed size.

- **Never use Bootstrap size variants** that shrink text: no `form-control-sm`, `custom-select-sm`, `btn-sm`, `small`, `text-sm`, `font-size` overrides in inline styles or CSS classes.
- **Never use different `fontSize` values** across the UI. If a component sets an explicit `fontSize`, it must match the site base size — not a smaller or larger value.
- This applies to labels, inputs, selects, buttons, badges, tooltips, helper text, and any other visible element.
- Exception: the style editor's internal ruler/line-number gutters may use matching sizes, but must not be visually smaller than the surrounding editor text.

## site.css heading animations (avoid heading tags in components)

`site.css` applies animations to ALL heading elements globally:
- `h1, h2, h3` -> `textglowwhite` (glowing text, 2s infinite)
- `h5, h6` -> `blinkingText` (blinking, 1.2s infinite)

**Never use h5 or h6 in components** — use `<div>` or `<span>` with inline `fontWeight: bold` instead.
Only use h1/h2/h3 when the glowing header style is deliberately wanted (e.g., widget titles with `bg-header` class).

## Key paths on server

- Deploy dir: `/var/www/asciiarena.se/nextjs-current/`
- PHP site (backup): `/var/www/asciiarena.se/` (still live at asciiarena.se)
- Dev site: `https://dev.asciiarena.se` -> port 3001
- Apache SSL backup: `asciiarena.se-le-ssl.conf.php-backup`
