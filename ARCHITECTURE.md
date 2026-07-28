# Architecture

## Why an EBS is required

A Twitch Extension's frontend is static HTML/JS/CSS served from Twitch's CDN and run
inside a sandboxed iframe. It cannot:

- store client secrets (Spotify client secret, broadcaster Twitch token)
- make arbitrary cross-origin calls to Spotify
- be trusted to self-report "this viewer paid" — Bits transactions must be verified
  server-side

So every real Extension needs a backend (the "EBS", Extension Backend Service). That's
`packages/ebs` here. It's the only component that holds secrets and talks to Spotify.

## Components

### 1. Extension panel (`packages/extension`)

- Twitch Extension "panel" (and optionally "mobile"/"component") view.
- Reads the current queue from the EBS and renders it.
- Lets a viewer search for a track and submit a request.
- Priority requests go through Twitch's **Bits in Extensions** flow
  (`window.Twitch.ext.bits.useBits(sku)`), which Twitch itself validates —
  the EBS gets a signed transaction receipt via the `onTransactionComplete`
  callback and via a server-side webhook/PubSub, and only then queues the track.
- Auth: every request to the EBS includes the viewer's Extension JWT
  (`window.Twitch.ext.viewer.sessionToken`), which the EBS verifies using the
  extension's shared secret.

### 2. EBS (`packages/ebs`)

Responsibilities:

- **Auth**
  - Verify Extension viewer JWTs (HS256, signed with the extension secret from the
    Twitch dev console) for viewer-originated requests.
  - Hold the broadcaster's Twitch user token (for EventSub) and Spotify token
    (refreshed via OAuth refresh token), scoped per-channel since this plugin can serve
    multiple broadcasters.
  - Hold a per-broadcaster API key for Streamer.bot to authenticate with.
- **Queue management** (`services/queueManager.ts`)
  - Single source of truth for "what's queued, what's playing, what's pending
    moderation." Free requests vs. Bits-prioritized requests vs. Channel-Points
    requests all funnel through this.
- **Spotify integration** (`services/spotify.ts`)
  - Search tracks, add to the broadcaster's playback queue
    (`POST /me/player/queue`), refresh OAuth tokens.
  - Note: adding to a Spotify queue requires the broadcaster to have Spotify
    **Premium** and an active playback device.
- **Twitch integration** (`services/twitchAuth.ts`)
  - Verify Bits transaction receipts.
  - Subscribe to `channel.channel_points_custom_reward_redemption.add` via EventSub
    for the "Song Request" custom reward, if the broadcaster wants Channel Points
    (rather than, or in addition to, Streamer.bot) to trigger this directly.
- **Public HTTP API** — see `packages/ebs/src/routes`. Two front doors, same queue:
  - `/api/viewer/*` — called by the Extension panel, authenticated via viewer JWT.
  - `/api/streamerbot/*` — called by Streamer.bot, authenticated via a per-broadcaster
    API key.

### 3. Streamer.bot bridge (`packages/streamerbot`)

Streamer.bot already has robust Twitch event handling (Channel Points, chat commands,
Bits, etc.), so rather than re-implementing that, Streamer.bot is just a *client* of
the EBS's `/api/streamerbot/*` API:

- A Channel Points redemption, chat command (`!sr <song>`), or moderator action in
  Streamer.bot triggers an HTTP call (via Streamer.bot's built-in "Execute HTTP
  Request" sub-action, or a small C# code action for more control) to the EBS.
- This means the broadcaster can choose: let the Extension handle Channel Points
  directly via EventSub, or route everything through Streamer.bot, or mix both —
  the EBS doesn't care where a request came from, only that it's authenticated.

## Data model (initial pass, will evolve)

```
Broadcaster
  - twitchUserId
  - spotifyRefreshToken (encrypted)
  - twitchBroadcasterToken (encrypted, for EventSub)
  - streamerBotApiKey (hashed)
  - settings (bits-per-priority-slot, channel points reward id, etc.)

QueueEntry
  - id
  - broadcasterId
  - spotifyTrackUri
  - requestedBy (twitch display name)
  - source: "bits" | "channel_points" | "free" | "streamerbot"
  - priority (int — higher goes first)
  - status: "pending" | "queued" | "played" | "rejected"
  - createdAt
```

## Open questions to settle as we build

1. **Persistence**: SQLite is enough to start (single-process, easy to ship); Postgres
   if this ever needs to run multi-tenant at scale. Leaning SQLite for now via Prisma
   so the swap later is cheap.
2. **Hosting the EBS**: needs to be a real HTTPS endpoint reachable by Twitch's servers
   and the extension panel — Fly.io/Render/a small VPS all work. Not needed until
   we're ready to deploy.
3. **Multi-broadcaster from day one, or single-broadcaster first?** Affects whether we
   build the Broadcaster/token model now or bolt it on later. Recommend: build the
   data model multi-tenant-shaped from the start (it's cheap), but only *support*
   your own channel until the extension is actually submitted for review.
