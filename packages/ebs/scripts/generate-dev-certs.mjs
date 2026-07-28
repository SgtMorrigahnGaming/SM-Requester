import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import selfsigned from "selfsigned";

const certDir = new URL("../certs/", import.meta.url);
mkdirSync(certDir, { recursive: true });

const certPath = new URL("cert.pem", certDir);
const keyPath = new URL("key.pem", certDir);

if (existsSync(certPath) && existsSync(keyPath)) {
  console.log("certs/cert.pem and certs/key.pem already exist — skipping.");
  process.exit(0);
}

const attrs = [{ name: "commonName", value: "localhost" }];
const pems = await selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048,
  extensions: [
    {
      name: "subjectAltName",
      altNames: [
        { type: 2, value: "localhost" },
        { type: 7, ip: "127.0.0.1" },
      ],
    },
  ],
});

writeFileSync(certPath, pems.cert);
writeFileSync(keyPath, pems.private);

console.log("Generated certs/cert.pem and certs/key.pem for local HTTPS dev.");
