import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Twitch Extension asset hosting expects relative paths and a self-contained
// build — no absolute paths, no external CDN dependencies beyond the Twitch
// Extensions Helper script (loaded separately, see index.html).
//
// Local Test on Twitch requires HTTPS: the extension iframe lives on an
// HTTPS page, and browsers won't load mixed-content HTTP assets into it.
// Run `npm run dev:certs` once to generate certs/cert.pem + certs/key.pem
// (same approach as the EBS) — falls back to Vite's default (HTTP) if
// they're missing, which is fine for quick UI iteration but won't work for
// an actual Local Test session on Twitch.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certPath = path.join(__dirname, "certs", "cert.pem");
const keyPath = path.join(__dirname, "certs", "key.pem");
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 8080,
    // 0.0.0.0 — required so Docker's port mapping can reach this server;
    // harmless for bare local dev too.
    host: true,
    https: hasCerts
      ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
      : undefined,
    // Bind-mounted source (e.g. from Docker on Windows/macOS) doesn't always
    // propagate native filesystem change events reliably, so hot-reload can
    // silently stop working. Polling is a bit heavier but always works.
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: "dist/panel",
  },
});


