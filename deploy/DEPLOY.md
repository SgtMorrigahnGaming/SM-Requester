# Deploying to smrequester.morrigahngaming.no

This assumes: Docker is installed on the server, and Caddy or nginx is already
handling TLS for the subdomain (pointed at this machine).

## 1. Get the code onto the server

Easiest is a git clone of your GitHub repo directly into the folder you already made:

```bash
# on the server
cd ~/smrequester
git clone https://github.com/SgtMorrigahnGaming/SM-Requester.git .
```

(If the folder isn't empty, `git clone https://github.com/SgtMorrigahnGaming/SM-Requester.git tmp && mv tmp/* tmp/.* . 2>/dev/null; rmdir tmp` works around that — or just clone into a fresh subfolder.)

From then on, deploying an update is just:

```bash
cd ~/smrequester
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 2. Configure the EBS's real secrets

```bash
cp packages/ebs/.env.example packages/ebs/.env
nano packages/ebs/.env   # fill in real Twitch + Spotify credentials
```

This is server-side only — it never gets built into an image or committed, just
read by the container at runtime via `env_file`.

## 3. If your extension's build-time URL differs

`docker-compose.prod.yml` bakes `VITE_EBS_BASE_URL=https://smrequester.morrigahngaming.no/api`
into the panel at build time. If you ever move domains, update that line — it's a
build arg, not a runtime env var, so it requires a rebuild (`--build`), not just a
restart.

## 4. Build and run

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This runs two containers, both bound to `127.0.0.1` only:

- `ebs` → `127.0.0.1:8081` (plain HTTP internally — fine, since it's never exposed
  directly; TLS is handled by your reverse proxy)
- `extension` → `127.0.0.1:8082` (static files, served by nginx inside the container)

## 5. Point your reverse proxy at them

Use whichever matches what you've already got running — see
[`deploy/Caddyfile.example`](./Caddyfile.example) or
[`deploy/nginx.conf.example`](./nginx.conf.example). Both do the same thing:

- `smrequester.morrigahngaming.no/api/*` → `127.0.0.1:8081` (the EBS)
- `smrequester.morrigahngaming.no/*` → `127.0.0.1:8082` (the panel)

Reload whichever proxy you're running after adding the config
(`systemctl reload caddy` / `nginx -s reload`).

## 6. Verify

```bash
curl https://smrequester.morrigahngaming.no/api/health
# {"ok":true}

curl -I https://smrequester.morrigahngaming.no/
# 200, serving the panel's index.html
```

## 7. Point Twitch's Local Test at the real domain

Once this is up, you can set the Extension's Testing Base URL in the [Developer
Console](https://dev.twitch.tv/console/extensions) to
`https://smrequester.morrigahngaming.no/` instead of `https://localhost:8080/` —
no local dev servers running at all, and this is a step closer to what "Hosted
Test" / the final Released version will look like. Keep using localhost for
day-to-day UI iteration; switch to the real domain when you want to check the
deployed version actually works end to end.

## Notes / things to revisit later

- No `--restart unless-stopped` alternative for reboots is configured beyond what
  Compose gives you — if the server reboots, `docker compose up -d` needs to run
  again unless you set up a systemd unit or enable Docker's own restart-on-boot
  (`sudo systemctl enable docker` is usually enough, since `unless-stopped`
  containers restart when the Docker daemon comes back up).
- The EBS's `.env` currently has no real secret management (no vault, no
  encryption at rest) — fine for a single-broadcaster setup on a box you control,
  worth revisiting if this ever needs to support other broadcasters.
- No logging/monitoring yet — `docker compose logs -f ebs` is your friend for now.
