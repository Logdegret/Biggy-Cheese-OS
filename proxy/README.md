# BiggyOS Proxy

The engine behind the **Biggy Browser** app. Without it, Biggy Browser can only
open sites that allow being put in an iframe (most big ones don't). With it,
pages get rewritten so they load normally.

Two pieces do the work, and neither is mine:

- **[Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)** — a service
  worker that rewrites a site's HTML/CSS/JS so it runs under *this* server's
  origin. That's why the site's `X-Frame-Options` header never reaches your
  browser: your browser never talks to that site directly.
- **[Wisp](https://github.com/MercuryWorkshop/wisp-js)** — the tunnel the rewritten
  page's requests actually travel down, over a single websocket.

`server.js` is just static file serving plus one websocket route.

## Run it locally

```bash
cd proxy
npm install
npm start
```

Then open Biggy Browser → ⚙ → paste `http://localhost:8080` → Save.

## Deploy it for real (free)

Biggy Browser needs the proxy on `https://` when BiggyOS itself is on `https://`,
so for the live GitHub Pages site you need it hosted.

**Render** (uses the included `render.yaml`):

1. Push this repo to GitHub.
2. On [render.com](https://render.com) → New → Blueprint → pick the repo.
3. It reads `render.yaml` and deploys. You get `https://biggyos-proxy.onrender.com`.
4. Paste that into Biggy Browser → ⚙ → Save.

Any Node host works the same way — root directory `proxy`, build `npm install`,
start `npm start`. The port comes from `process.env.PORT`.

## Things worth knowing

- **Don't log into real accounts through it.** Every request passes through this
  server in the clear on its way out. It's your server, but treat it like a
  public computer.
- **Free tiers sleep.** Render's free plan spins down after inactivity, so the
  first page load after a quiet spell takes ~30 seconds.
- **Some sites still won't work.** Anything leaning hard on WebRTC, DRM video, or
  aggressive bot detection will fight the proxy.
- **Hosts sometimes flag these projects**, because proxies get used to get around
  network filters. If a host closes the account, that's why — nothing is broken.
