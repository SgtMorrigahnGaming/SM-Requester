import { Router } from "express";
import { verifyStreamerBotKey } from "../middleware/verifyStreamerBotKey.js";
import { addRequest, listQueue, markStatus, removeEntry } from "../services/queueManager.js";

export const streamerBotRouter = Router();

// All Streamer.bot routes require the broadcaster's API key (see
// packages/streamerbot/README.md for how this gets configured on the SB side).
streamerBotRouter.use(verifyStreamerBotKey);

/**
 * POST a request originating from Streamer.bot — e.g. a Channel Points
 * redemption or a `!sr` chat command that Streamer.bot already parsed.
 */
streamerBotRouter.post("/requests", (req, res) => {
  const { broadcasterId, spotifyTrackUri, trackName, artistName, requestedBy, priority } =
    req.body ?? {};

  if (!broadcasterId || !spotifyTrackUri || !trackName || !requestedBy) {
    return res.status(400).json({
      error: "broadcasterId, spotifyTrackUri, trackName, and requestedBy are required",
    });
  }

  const entry = addRequest({
    broadcasterId,
    spotifyTrackUri,
    trackName,
    artistName: artistName ?? "Unknown",
    requestedBy,
    source: "streamerbot",
    priority: priority ?? 0,
  });

  res.status(201).json({ entry });
});

streamerBotRouter.get("/queue/:broadcasterId", (req, res) => {
  res.json({ queue: listQueue(req.params.broadcasterId) });
});

streamerBotRouter.post("/queue/:broadcasterId/:entryId/skip", (req, res) => {
  const entry = markStatus(req.params.broadcasterId, req.params.entryId, "played");
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  res.json({ entry });
});

streamerBotRouter.delete("/queue/:broadcasterId/:entryId", (req, res) => {
  const removed = removeEntry(req.params.broadcasterId, req.params.entryId);
  if (!removed) return res.status(404).json({ error: "Entry not found" });
  res.status(204).send();
});
