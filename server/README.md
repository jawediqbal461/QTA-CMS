# QTA CMS API (Phase 1 backend)

A standalone Node/Express/Prisma API, separate from the Vite frontend in the
repo root. Talks to a self-hosted Postgres container. This is the first
slice of Phase 1 — auth (account bootstrap, login) and the full data model.
Tutor/booking/progress endpoints come next.

## Data model

See `prisma/schema.prisma`. Matches `PROJECT_PLAN.md`'s "Architecture and
data" section: academies, accounts, academy memberships, guardian-student
links, tutor profiles, availability, bookings (with a hard DB-level unique
constraint preventing a tutor double-booking the same instant), lesson
sessions, progress entries, curriculum + content revisions, and an
append-only audit log.

## Local development

```bash
npm install
cp .env.example .env   # fill in real secrets
docker compose up -d   # starts Postgres on 127.0.0.1:55432
npx prisma migrate deploy
npm run dev             # http://127.0.0.1:4000
```

## Deploying on the VPS (self-hosted, alongside the static frontend)

The static frontend is already deployed to `new.qurantutorsacademy.com` as
pure static files (see `../DEPLOY.md`). This API is a separate Node process
that only listens on `127.0.0.1` — it's reached through its own subdomain
proxied by Nginx, not merged into the static site's docroot.

### 1. Clone/pull alongside the frontend build

```bash
cd ~/builds/qta-cms   # same checkout used for the frontend
git pull
cd server
npm ci
```

### 2. Configure secrets

```bash
cp .env.example .env
# Generate strong random values instead of the placeholders:
openssl rand -hex 32   # use for POSTGRES_PASSWORD
openssl rand -hex 32   # use for JWT_SECRET
```

Edit `.env` and set `POSTGRES_PASSWORD`, `DATABASE_URL` (same password),
`JWT_SECRET`, and `CORS_ORIGIN=https://new.qurantutorsacademy.com`.

For the one-time academy bootstrap step below, also set a `SETUP_TOKEN` in
`.env` (any long random value) — remove it from `.env` after you've created
the first academy admin account, so the endpoint locks itself back down.

### 3. Start Postgres

```bash
docker compose up -d
docker compose ps   # confirm "healthy"
```

This binds Postgres to `127.0.0.1:55432` only — it is never reachable from
outside the VPS, and doesn't touch ports 80/443/8080/8081 already in use by
Nginx/Apache, or the other unrelated services on this box (uvicorn,
docker-proxy, Hestia's own port 8083/8085).

### 4. Run migrations

```bash
npx prisma migrate deploy
```

### 5. Build and start the API

```bash
npm run build
npx pm2 start dist/index.js --name qta-api
npx pm2 save
npx pm2 startup   # follow its printed instructions to persist across reboots
```

(`pm2` keeps the process alive and restarts it on crash/reboot — simpler
than hand-rolling a systemd unit for a single Node process.)

### 6. Create the first academy + admin account

One-time call (then remove `SETUP_TOKEN` from `.env` and `pm2 restart qta-api`):

```bash
curl -X POST http://127.0.0.1:4000/api/auth/bootstrap-academy \
  -H "Content-Type: application/json" \
  -d '{
    "setupToken": "<the SETUP_TOKEN you put in .env>",
    "academyName": "Quran Tutors Academy",
    "academySlug": "qta",
    "adminEmail": "admin@qurantutorsacademy.com",
    "adminPassword": "<a real strong password, not the old demo one>",
    "adminFullName": "QTA Admin"
  }'
```

### 7. Expose it publicly under `/api/` on the existing domain

No new subdomain, DNS record, or SSL cert needed. The API is reached at
`https://new.qurantutorsacademy.com/api/...` — same origin as the frontend,
so no CORS is even required in practice (the `CORS_ORIGIN` setting is kept
as a harmless safety net).

1. SSH in and edit that domain's Nginx config —
   `/home/meriweb/conf/web/new.qurantutorsacademy.com/nginx.ssl.conf` (the
   file Hestia generated when you enabled SSL for this domain; there's
   also a plain `nginx.conf` alongside it for port 80, which normally just
   redirects to HTTPS and doesn't need this block). Inside the `server { }`
   block, add this **above** the existing `location` block(s) — the `^~`
   modifier makes Nginx match it ahead of any regex/static-file rule
   already in the template, so it can't be shadowed by anything else in
   the file:

   ```nginx
   location ^~ /api/ {
       proxy_pass http://127.0.0.1:4000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   Then test and reload: `nginx -t && systemctl reload nginx`.

   Note: if you later use Hestia's panel to change a setting on this domain
   and it offers to "rebuild" the web domain, it may regenerate this file
   from the default template and wipe the custom block — re-add it if so.
2. Verify: `curl https://new.qurantutorsacademy.com/api/health` should
   return `{"status":"ok","db":"connected"}`.

### Redeploying after future changes

```bash
cd ~/builds/qta-cms && git pull && cd server
npm ci
npx prisma migrate deploy   # only applies new migrations, safe to always run
npm run build
npx pm2 restart qta-api
```
