# Streamer.bot bridge

Streamer.bot doesn't need a plugin DLL for this — it just needs to call the EBS's
`/api/streamerbot/*` HTTP API when a relevant event happens (Channel Points
redemption, `!sr` chat command, mod action, etc.). This keeps all the Twitch-event
listening logic in the one place (Streamer.bot) that's already good at it, and all
the queue/Spotify logic in the EBS.

## Setup

1. In the EBS `.env`, set `STREAMERBOT_API_KEY` to a random string
   (this is a placeholder single-key setup for now — see the TODO in
   `packages/ebs/src/middleware/verifyStreamerBotKey.ts`; it'll become a real
   per-broadcaster key once the Broadcaster model exists).
2. In Streamer.bot, create an action triggered by whatever you want to drive
   requests (Channel Points redemption, command, etc.).
3. Add an **"HTTP Request"** sub-action (built into Streamer.bot):
   - Method: `POST`
   - URL: `http://localhost:8081/api/streamerbot/requests`
   - Headers: `Content-Type: application/json`, `X-StreamerBot-Key: <your key>`
   - Body: see the JSON shape in `examples/RequestSong.csx` below.

For anything beyond a static body (e.g. pulling the redeemed message text, the
user's display name, or doing a Spotify search first), use an **"Execute C#
Code"** sub-action instead — see `examples/RequestSong.csx`.

## Endpoints available to Streamer.bot

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/streamerbot/requests` | Add a song to the queue |
| `GET` | `/api/streamerbot/queue/:broadcasterId` | Read the current queue |
| `POST` | `/api/streamerbot/queue/:broadcasterId/:entryId/skip` | Mark an entry as played/skipped |
| `DELETE` | `/api/streamerbot/queue/:broadcasterId/:entryId` | Remove an entry entirely |

All require the `X-StreamerBot-Key` header.
