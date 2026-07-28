# STATUS

Last updated: 2026-07-28

This file is the source of truth for "where things are" on SM-Requester — re-upload
it to this Project's knowledge whenever it's meaningfully out of date (after a
session with real architectural decisions, not after every small edit).

## What this is

Open source Twitch plugin to request songs using channel points or bits for
priority. Viewers request songs from a Twitch Extension panel (paying Bits for
priority); the broadcaster can also drive the same queue through Streamer.bot.
Everything lands in the broadcaster's Spotify queue. Full architecture reasoning
is in `ARCHITECTURE.md`.

## Workflow (current)

- Development happens **directly on the production server**
  (`shaddiz@servermachine:~/smrequester`), not on the Windows machine.
- Git flow: edit on the server → `git add / commit / push` from the server →
  pull to the Windows machine afterward for reference. GitHub is the source of
  truth; the server is where code actually gets written and run.
- Changes from Claude arrive as `apply-*.sh` scripts — self-contained, chmod +x,
  run from the repo root. No manual copy-pasting of individual files.
- No CI/CD yet — deploys are manual (`git pull` + `docker compose -f
  docker-compose.prod.yml up -d --build` on the server).
- No GitHub MCP connector available for me to read the repo directly — I only
  know what's in this file, the rest of Project knowledge, and what's pasted
  into chat. If this file goes stale, my picture of the repo goes stale with it.

## Repo layout

```
packages/ebs         — Express/TypeScript backend (the Extension Backend Service)
packages/extension    — React/Vite Twitch Extension panel
packages/streamerbot  — docs + example C# for Streamer.bot to call the EBS
deploy/               — DEPLOY.md + Caddy/nginx examples for the prod server
docker-compose.yml       — local dev (hot reload, bind-mounted source)
docker-compose.prod.yml  — production (compiled/static, run on the server)
```

## What's actually built

- **EBS**: Express server with two authenticated route groups —
  `/api/viewer/*` (Extension panel, verified via Twitch viewer JWT) and
  `/api/streamerbot/*` (Streamer.bot, verified via a static API key). Both
  write to the same in-memory queue manager.
- **Queue manager**: in-memory only (`Map`), sorts by priority. Shaped so a
  swap to a real DB is mechanical, not a rewrite — see Open Decisions.
- **Spotify service**: thin wrapper (search, add-to-queue, token refresh)
  around `spotify-web-api-node`. Not wired to a real broadcaster token yet —
  see below.
- **Extension panel**: renders the queue, has a free-request form and a
  "Request with Bits" button wired to `window.Twitch.ext.bits.useBits()`.
  Track data is currently placeholder (`spotify:track:placeholder`) — no real
  Spotify search hooked up yet.
- **Streamer.bot bridge**: example C# code action (`RequestSong.csx`) posting
  to `/api/streamerbot/requests`. Not tested against a real Streamer.bot
  install yet.
- **Local dev**: HTTPS via generated self-signed certs (`npm run dev:certs`),
  required because Twitch's Local Test embeds the panel in an HTTPS page and
  blocks mixed-content HTTP calls.
- **Docker**: dev Compose (hot reload, bind mounts) and prod Compose
  (multi-stage builds, EBS compiled to plain JS, panel served as static files
  via nginx) both exist and build cleanly. Prod containers bind to
  `127.0.0.1` only — reverse proxy handles TLS and public exposure.
- **Deploy docs**: `deploy/DEPLOY.md` + example Caddy and nginx configs for a
  path-based split on one domain (`/api/*` → EBS, `/` → panel).

## Explicitly stubbed / not real yet (don't assume these work)

- **Bits transaction verification** (`packages/ebs/src/routes/viewer.ts`):
  hardcoded `verified = true`. Does not actually verify the signed transaction
  receipt against Twitch yet — anyone could currently fake a priority request.
- **Spotify search**: no `/search` endpoint exists. The panel and the
  Streamer.bot example both submit placeholder track URIs.
- **Persistence**: queue is in-memory and resets on every EBS restart. No
  database yet.
- **Broadcaster/multi-tenant model**: doesn't exist. Config is single-shared
  (one set of env vars), not per-broadcaster.
- **Twitch EventSub (Channel Points)**: not implemented — only Streamer.bot
  or the Extension's Bits flow can currently add to the queue.
- **Spotify OAuth flow**: no authorize/callback route implemented yet — the
  Spotify service has no real token to use.

## Open decisions (revisit, don't assume settled)

- Persistence: leaning SQLite + Prisma, not committed yet.
- Multi-broadcaster support: building the data model multi-tenant-shaped from
  the start was the plan, but not started.
- Whether Channel Points goes through Twitch EventSub directly, through
  Streamer.bot exclusively, or both — currently unimplemented either way.

## Registration / accounts status

- Twitch Extension: **not yet registered** in the Developer Console. No real
  Client ID / Secret exist yet — `.env.example` has empty placeholders.
- Spotify Developer app: **not yet registered**.
- Production domain: `smrequester.morrigahngaming.no`, DNS + reverse proxy
  (Caddy or nginx — confirm which) already pointed at the server.

## Natural next steps, roughly in order

1. Register the Twitch Extension (Developer Console) — get Client ID + Secret
   into `packages/ebs/.env` on the server.
2. Register the Spotify app, build the OAuth authorize/callback route.
3. Build a real `/search` endpoint (EBS → Spotify) and wire the panel + the
   Streamer.bot example to use it instead of placeholder URIs.
4. Implement real Bits transaction verification.
5. Swap the in-memory queue for SQLite/Prisma.
6. Confirm `docker compose -f docker-compose.prod.yml up -d --build` actually
   works on the real server (built and reasoned through, but never run against
   a live Docker daemon or the real reverse proxy yet).
