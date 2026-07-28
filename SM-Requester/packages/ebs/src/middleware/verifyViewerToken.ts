import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { TwitchExtensionViewerToken } from "../types/index.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      viewer?: TwitchExtensionViewerToken;
    }
  }
}

/**
 * Verifies the Extension viewer JWT that the panel sends on every request
 * (window.Twitch.ext.viewer.sessionToken, forwarded as `Authorization: Bearer <token>`).
 * The extension secret is base64-encoded, per Twitch's docs.
 */
export function verifyViewerToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing viewer token" });
  }

  try {
    const secret = Buffer.from(config.twitch.extensionSecret, "base64");
    const payload = jwt.verify(token, secret) as TwitchExtensionViewerToken;
    req.viewer = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired viewer token" });
  }
}
