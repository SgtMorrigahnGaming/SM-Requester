# SM-Requester

Open source Twitch plugin to request songs using channel points or bits for priority.

Viewers request songs from a Twitch Extension panel (paying with Bits for priority),
and the broadcaster can also drive the same queue through Streamer.bot (e.g. from a
Channel Points redemption or chat command). Everything lands in the broadcaster's
Spotify queue.

## Architecture

```
Viewer (Extension panel)  ─┐
                            ├─► EBS (backend) ─► Spotify Web API (queue)
Streamer.bot (broadcaster) ─┘         │
                                       └─► Twitch EventSub (Channel Points)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full breakdown.

## Packages

| Package | What it is |
|---|---|
| [`packages/extension`](./packages/extension) | The Twitch Extension panel (React + Vite). Viewer-facing UI, uploaded to Twitch as static assets. |
| [`packages/ebs`](./packages/ebs) | The Extension Backend Service (Node/TypeScript + Express). Holds all secrets, talks to Spotify and Twitch, owns queue state. |
| [`packages/streamerbot`](./packages/streamerbot) | Docs + example Streamer.bot actions for calling the EBS's API. |

## Status

🚧 Just scaffolded — see [ARCHITECTURE.md](./ARCHITECTURE.md) for the current plan and
each package's README for setup instructions and TODOs.

## Prerequisites (once we're building for real)

- Node.js 20+
- A Twitch Developer application (for the Extension + EBS)
- A Spotify Developer application (for queue control — requires Spotify Premium for the
  broadcaster, since the Spotify Web API "add to queue" endpoint requires it)
- [Streamer.bot](https://streamer.bot) (optional, for the broadcaster-side integration)

## Getting started

### Option A: Docker Compose (recommended once you're past initial setup)

One command instead of two terminals:

```bash
cp packages/ebs/.env.example packages/ebs/.env   # fill in your real values
npm run dev:certs                                # generates HTTPS certs for both services, once
npm run docker:up                                # or: docker compose up
```

- EBS: `https://localhost:8081`
- Extension panel: `https://localhost:8080`

Both containers bind-mount your local source, so editing files still hot-reloads —
you're not rebuilding images on every save. `docker compose down` stops both.

This is a *dev* convenience, not a deployment: for actual streaming, once the
Extension is past Local Test, Twitch hosts the panel itself from its CDN, so only
the EBS needs to be running (and eventually, running somewhere other than your own
machine — see the "Open questions" in ARCHITECTURE.md). For now, `docker:up` is the
one-command version of "get both dev servers running before I go live."

### Option B: run each service directly (no Docker)

```bash
npm install
npm run dev:certs --workspace=packages/ebs   # generates a local HTTPS cert, once
npm run dev:ebs
npm run dev:extension
```

- EBS: `https://localhost:8081` (falls back to plain HTTP if you skip `dev:certs`,
  but Twitch's Local Test requires HTTPS — see below)
- Extension panel: `https://localhost:8080` (self-signed cert — accept the browser
  warning once when you open it directly)

## Testing the panel on Twitch (Local Test)

Twitch's old "Developer Rig" desktop app was deprecated in 2023 and is no longer the
recommended path — its projects can't even be recreated anymore. The current way to
test an Extension panel is **Local Test**, built into the [Extensions Developer
Console](https://dev.twitch.tv/console/extensions):

1. Create an Extension in the console (type: **Panel**). You'll need 2FA enabled on
   your Twitch account. This gives you a **Client ID**.
2. Generate a **Secret** for it (Extension Manager → Secrets tab) — this is
   `TWITCH_EXTENSION_SECRET` in the EBS's `.env`. The Client ID is
   `TWITCH_EXTENSION_CLIENT_ID`.
3. Run `npm run dev:extension` — it serves the built panel at `https://localhost:8080/`.
4. In the console's **Asset Hosting** tab, set the Testing Base URL to
   `https://localhost:8080/` (must end in `/`).
5. From the extension's Status page, click **View on Twitch and Install** — this
   installs it on your own channel in test mode and takes you to activate it as a
   panel.
6. Visit your channel page — the panel below the player is now your local dev build,
   live-reloading as you edit.

The EBS also needs to be reachable over HTTPS at this point, since the panel is now
embedded in Twitch's HTTPS page and browsers block calls to plain HTTP as mixed
content — that's what `dev:certs` is for.
