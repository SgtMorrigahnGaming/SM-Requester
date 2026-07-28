import { Router } from "express";
import { verifyViewerToken } from "../middleware/verifyViewerToken.js";
import { addRequest, listQueue } from "../services/queueManager.js";

export const viewerRouter = Router();

// All viewer routes require a valid Extension viewer JWT.
viewerRouter.use(verifyViewerToken);

/** GET the current queue for the broadcaster this viewer is watching. */
viewerRouter.get("/queue", (req, res) => {
  const channelId = req.viewer!.channel_id;
  res.json({ queue: listQueue(channelId) });
});

/**
 * POST a free-tier song request (no Bits).
 * TODO: rate-limit per opaque_user_id to prevent spam.
 */
viewerRouter.post("/requests", (req, res) => {
  const { spotifyTrackUri, trackName, artistName } = req.body ?? {};
  if (!spotifyTrackUri || !trackName) {
    return res.status(400).json({ error: "spotifyTrackUri and trackName are required" });
  }

  const entry = addRequest({
    broadcasterId: req.viewer!.channel_id,
    spotifyTrackUri,
    trackName,
    artistName: artistName ?? "Unknown",
    requestedBy: req.viewer!.opaque_user_id,
    source: "free",
  });

  res.status(201).json({ entry });
});

/**
 * POST a Bits-prioritized request. `transactionReceipt` is the signed JWT
 * Twitch hands back from `window.Twitch.ext.bits.useBits()` /
 * `onTransactionComplete` — this MUST be verified server-side before trusting
 * the payment, never just trust the client's say-so.
 *
 * TODO: verify transactionReceipt against Twitch's public key and confirm the
 * SKU/cost matches what we expect before calling addRequest with priority > 0.
 */
viewerRouter.post("/requests/priority", (req, res) => {
  const { spotifyTrackUri, trackName, artistName, transactionReceipt } = req.body ?? {};
  if (!spotifyTrackUri || !trackName || !transactionReceipt) {
    return res.status(400).json({
      error: "spotifyTrackUri, trackName, and transactionReceipt are required",
    });
  }

  // TODO: replace with real verification (see comment above) before shipping.
  const verified = true;
  if (!verified) {
    return res.status(402).json({ error: "Bits transaction could not be verified" });
  }

  const entry = addRequest({
    broadcasterId: req.viewer!.channel_id,
    spotifyTrackUri,
    trackName,
    artistName: artistName ?? "Unknown",
    requestedBy: req.viewer!.opaque_user_id,
    source: "bits",
    priority: 1, // TODO: derive from the SKU/Bits amount once products are defined
  });

  res.status(201).json({ entry });
});
