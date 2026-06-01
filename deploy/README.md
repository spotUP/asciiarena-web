# Server configs (canonical copies)

These are the authoritative copies of the configs that run dev.asciiarena.se.
Edit them here, commit, then sync to the server with one of the snippets
below.

| File | Lives on the server at |
|---|---|
| `asciiarena-next-dev.service` | `/etc/systemd/system/asciiarena-next-dev.service` |
| `dev.asciiarena.se-ssl.conf` | `/etc/apache2/sites-enabled/dev.asciiarena.se-ssl.conf` |
| `asciiarena.se-le-ssl.conf` | `/etc/apache2/sites-enabled/asciiarena.se-le-ssl.conf` (prod) |
| `mpm_event.conf` | `/etc/apache2/mods-enabled/mpm_event.conf` |

## Sync the systemd unit

```sh
scp deploy/asciiarena-next-dev.service spot@asciiarena.se:/tmp/
ssh spot@asciiarena.se '
  sudo cp /etc/systemd/system/asciiarena-next-dev.service \
          /etc/systemd/system/asciiarena-next-dev.service.bak-$(date +%Y%m%d-%H%M%S) &&
  sudo mv /tmp/asciiarena-next-dev.service /etc/systemd/system/ &&
  sudo systemctl daemon-reload &&
  sudo systemctl restart asciiarena-next-dev &&
  systemctl is-active asciiarena-next-dev
'
```

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
scp deploy/dev.asciiarena.se-ssl.conf spot@asciiarena.se:/tmp/
ssh spot@asciiarena.se '
  sudo cp /etc/apache2/sites-enabled/dev.asciiarena.se-ssl.conf \
          /etc/apache2/sites-enabled/dev.asciiarena.se-ssl.conf.bak-$(date +%Y%m%d-%H%M%S) &&
  sudo mv /tmp/dev.asciiarena.se-ssl.conf /etc/apache2/sites-enabled/ &&
  sudo apachectl -t &&
  sudo systemctl reload apache2 &&
  systemctl is-active apache2
'
```

## Why these settings matter

**systemd unit** — `KillMode=mixed` + `TimeoutStopSec=10` make `systemctl
restart` complete in ~2s instead of 90s. Without them the open SSE
connections in `app/api/live/route.ts` prevent graceful shutdown and
systemd waits the default `TimeoutStopSec` (90s) before SIGKILLing. During
that 90s, Apache returns 503s to every visitor.

**Apache vhost** — the `ProxyPass` flags (`connectiontimeout=5 timeout=60
retry=0 disablereuse=on`) prevent Apache from holding a wedged upstream
socket. Without `disablereuse=on` the worker pool can pin a half-dead
connection from a previous deploy and hand it to subsequent requests,
which then hang for up to `ProxyTimeout` (300s).

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

## Prod

Prod cut over to Next.js on 2026-06-01 (see `asciiarena.se-le-ssl.conf`).
The prod systemd unit `asciiarena-next.service` got the same
`KillMode=mixed` + `TimeoutStopSec=10` patch as dev, applied in place. The
old PHP-routing vhost is preserved on the server as
`asciiarena.se-le-ssl.conf.bak-pre-cutover-*` for emergency rollback —
restore that file, reload Apache, and PHP is back.
