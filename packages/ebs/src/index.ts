import express from "express";
import cors from "cors";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { viewerRouter } from "./routes/viewer.js";
import { streamerBotRouter } from "./routes/streamerbot.js";

const app = express();

app.use(cors()); // TODO: restrict to Twitch's extension origin (https://<ext-id>.ext-twitch.tv) in prod
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/viewer", viewerRouter);
app.use("/api/streamerbot", streamerBotRouter);

// TODO: mount /eventsub (Channel Points via Twurple's EventSubHttpListener)
// TODO: mount /auth/spotify (OAuth authorize + callback for the broadcaster)

// Testing the Extension panel against Twitch's Local Test requires the panel
// to be served over HTTPS (see packages/extension/vite.config.ts) — and once
// that panel is embedded in Twitch's HTTPS page, its fetch() calls to this
// server get blocked as mixed content unless this is HTTPS too. Run
// `npm run dev:certs --workspace=packages/ebs` once to generate a local
// self-signed cert; falls back to plain HTTP if none is found (fine for
// Streamer.bot-only testing, which isn't running inside a Twitch iframe).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certPath = path.join(__dirname, "..", "certs", "cert.pem");
const keyPath = path.join(__dirname, "..", "certs", "key.pem");

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  https
    .createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
    .listen(config.port, () => {
      console.log(`EBS listening on https://localhost:${config.port}`);
    });
} else {
  app.listen(config.port, () => {
    console.log(
      `EBS listening on http://localhost:${config.port} (no dev cert found — ` +
        `run "npm run dev:certs --workspace=packages/ebs" for HTTPS, needed for Twitch Local Test)`,
    );
  });
}

