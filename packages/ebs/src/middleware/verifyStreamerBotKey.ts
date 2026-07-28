import type { NextFunction, Request, Response } from "express";

// TODO: replace with a real per-broadcaster lookup (hashed key in the database)
// once the Broadcaster model exists. For now this is a placeholder that checks
// against a single key so Streamer.bot has something to authenticate against
// during local development.
const DEV_STREAMERBOT_KEY = process.env.STREAMERBOT_API_KEY ?? "dev-local-key";

export function verifyStreamerBotKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-streamerbot-key"];

  if (key !== DEV_STREAMERBOT_KEY) {
    return res.status(401).json({ error: "Invalid Streamer.bot API key" });
  }

  next();
}
