# Server configs (canonical copies)

These are the authoritative copies of the configs that run asciiarena.se.
Edit them here, commit, then sync to the server with one of the snippets
below.

| File | Lives on the server at |
|---|---|
| `asciiarena.se-le-ssl.conf` | `/etc/apache2/sites-enabled/asciiarena.se-le-ssl.conf` |
| `mpm_event.conf` | `/etc/apache2/mods-enabled/mpm_event.conf` |

The prod systemd unit `asciiarena-next.service` lives only on the server —
it has never needed a code-side change since cutover and is intentionally
not duplicated in the repo.

## Sync the Apache MPM config

```sh
scp deploy/mpm_event.conf spot@asciiarena.se:/tmp/
ssh spot@asciiarena.se '
  sudo cp /etc/apache2/mods-enabled/mpm_event.conf \
          /etc/apache2/mods-enabled/mpm_event.conf.bak-$(date +%Y%m%d-%H%M%S) &&
  sudo mv /tmp/mpm_event.conf /etc/apache2/mods-enabled/ &&
  sudo apachectl -t &&
  sudo systemctl reload apache2 &&
  systemctl is-active apache2
'
```

## Sync the Apache vhost

```sh
scp deploy/asciiarena.se-le-ssl.conf spot@asciiarena.se:/tmp/
ssh spot@asciiarena.se '
  sudo cp /etc/apache2/sites-enabled/asciiarena.se-le-ssl.conf \
          /etc/apache2/sites-enabled/asciiarena.se-le-ssl.conf.bak-$(date +%Y%m%d-%H%M%S) &&
  sudo mv /tmp/asciiarena.se-le-ssl.conf /etc/apache2/sites-enabled/ &&
  sudo apachectl -t &&
  sudo systemctl reload apache2 &&
  systemctl is-active apache2
'
```

## Why these settings matter

**systemd unit** (`asciiarena-next.service`, on the server only) —
`KillMode=mixed` + `TimeoutStopSec=10` make `systemctl restart` complete
in ~2s instead of 90s. Without them the open SSE connections in
`app/api/live/route.ts` prevent graceful shutdown and systemd waits the
default `TimeoutStopSec` (90s) before SIGKILLing. During that 90s, Apache
returns 503s to every visitor.

**Apache vhost** — the `ProxyPass` flags (`connectiontimeout=5 timeout=60
retry=0`) prevent Apache from holding a wedged upstream socket. The
earlier `disablereuse=on` was removed on 2026-06-01 after measuring it
cost ~470ms TTFB per request; the SIGTERM handler in `lib/live.ts` now
cleanly closes SSE controllers on shutdown so the proxy pool never holds
half-dead connections long enough to matter.

**Apache MPM** — bumped MaxRequestWorkers from 150 to 1024 (plus matching
ThreadLimit/ThreadsPerChild). SSE streams under `/api/live` tie up one
worker for the lifetime of the connection — event MPM can't async-park a
response once the body is flowing. With ~5 SSE channels per active visitor
(LiveRefresh widgets + chat + polls hero), the original 150 saturated at
~30 concurrent visitors and regular page requests started queueing past
their 10s client timeout.

Together they are the difference between "deploy briefly returns 503" and
"deploy completes invisibly", and between "30 concurrent users
unresponsive" and "many hundreds fine".

## Dev environment (retired 2026-06-01)

`dev.asciiarena.se` used to run a parallel Next.js stack on :3003 with
its own DB `uprough_ascii_dev` and systemd unit `asciiarena-next-dev`.
Retired after the big modernization landed — future changes ship
directly through `deploy.sh` to prod. If a staging environment is ever
needed again, the canonical configs are recoverable from the
`asciiarena.se-le-ssl.conf` / `asciiarena-next.service` shapes (swap
ports `3001 → 3003` and DB `uprough_ascii → <name>`).
