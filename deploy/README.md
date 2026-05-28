# Server configs (canonical copies)

These are the authoritative copies of the configs that run dev.asciiarena.se.
Edit them here, commit, then sync to the server with one of the snippets
below.

| File | Lives on the server at |
|---|---|
| `asciiarena-next-dev.service` | `/etc/systemd/system/asciiarena-next-dev.service` |
| `dev.asciiarena.se-ssl.conf` | `/etc/apache2/sites-enabled/dev.asciiarena.se-ssl.conf` |

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

Together they are the difference between "deploy briefly returns 503" and
"deploy completes invisibly".

## Prod

There's no prod equivalent file checked in yet — production still runs PHP
from the rollback at `0b927be`, so the prod systemd unit + Apache vhost
haven't needed these changes. Add them here when prod cuts over to
Next.js.
