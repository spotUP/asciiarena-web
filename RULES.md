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
- **CSS**: Bootstrap 4.4.1 (local `/assets/css/bootstrap.min.css` served by Apache) + custom `site.css`
- **JS**: jQuery 3.5.1 + Bootstrap 4 bundle (loaded via Script tags, NOT npm)
- **DB**: MySQL 8 via Prisma 7 + `@prisma/adapter-mariadb`
- **Auth**: NextAuth v5 with credentials provider (bcrypt, trustHost: true)
- **Deploy**: Apache reverse proxy -> Next.js on port 3001, systemd service `asciiarena-next`

## CSS load order (critical)

Must load in this exact order or Bootstrap overrides the theme:
1. `/assets/css/bootstrap.min.css` (Bootstrap 4 — the theme is designed for BS4)
2. `/assets/css/bootstrap-colorselector.css`
3. `/assets/css/site.css` (theme overrides Bootstrap)
4. `/assets/css/386.css`
5. `globals.css` (minimal Next.js overrides)

Importing Bootstrap from npm breaks the theme. Always load it as a `<link>` tag via Apache.

## File encoding

ASCII art files are ISO-8859-1 / CP437, not UTF-8. When reading collection files:
- Use `TextDecoder("utf-8", { fatal: true })` first
- Fall back to `Array.from(buf).map(b => String.fromCharCode(b)).join("")` for Latin-1
- Then HTML-escape the result

## Deployment notes

- Static assets (`/assets/`, `/fonts/`, `/collections/`, `/apps/`, `/mags/`) served
  directly by Apache — do NOT try to serve them from Next.js `public/`
- `public/` only holds: `favicon.ico`, `favicon.png`, `bootstrap5.bundle.min.js`,
  `bootstrap-colorselector-bs5.js` (patched for BS4 data-toggle attrs)
- `.env` on server at `/var/www/asciiarena.se/.env` — never commit secrets

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
