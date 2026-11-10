# QTA CMS API (Phase 1 backend)

A standalone Node/Express/Prisma API, separate from the Vite frontend in the
repo root. Talks to a self-hosted Postgres container. This covers
`PROJECT_PLAN.md` backlog item **M01** (database, identity, authorization) —
tutor/booking/progress *business* endpoints (M02+) come next.

## Data model

See `prisma/schema.prisma`. Matches `PROJECT_PLAN.md`'s "Architecture and
data" section: academies, accounts, academy memberships, guardian-student
links, tutor profiles, availability, bookings (with a hard DB-level unique
constraint preventing a tutor double-booking the same instant), lesson
sessions, progress entries, curriculum + content revisions, and an
append-only audit log.

## API endpoints

Auth (`/api/auth`):
- `POST /bootstrap-academy` — one-time, `SETUP_TOKEN`-gated, creates the
  first academy + its Academy Admin account.
- `POST /register/guardian` — email, password, fullName.
- `POST /register/tutor` — email, password, fullName, bio?, experienceYears,
  hourlyRate, languages[], specialties[]. Creates the account with a
  `TutorProfile` in `approvalStatus: PENDING` (approving it is M02).
- `POST /login` — email, password → `{ token, account }`.
- `GET /me` — requires `Authorization: Bearer <token>`.

Role-gated (`requireAuth` + `requireRole`, all scoped to the caller's own
`academyId` — never trust an id from the request body/params alone):
- `GET /api/admin/accounts` — Academy Admin only. Lists every membership in
  the academy.
- `PATCH /api/admin/memberships/:membershipId` — Academy Admin only.
  `{ status: "ACTIVE" | "SUSPENDED" | "REVOKED" }`. An admin can't revoke
  their own access. This is the actual mechanism behind "revoked access
  takes effect": `requireAuth` re-checks membership status against the
  database on *every* request, not just at login, so flipping this blocks
  that account's very next API call.
- `GET /api/tutor/profile` — Tutor only. Own `TutorProfile`.
- `GET /api/guardian/students` — Guardian only. Own linked students (empty
  until M03 builds the linking flow itself).

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
## Tutor onboarding and guardian booking

After updating the server, run `npm run prisma:generate`, `npm run build`, and `npm run prisma:migrate` before restarting the API. Migration `0002_tutor_booking` enables PostgreSQL's `btree_gist` extension and adds exclusion constraints for active tutor and learner time ranges. The migration role must be able to enable the extension, and existing overlapping active bookings must be reconciled before migration.

- Tutors apply at `/signup/tutor` and manage their profile and weekly availability at `/tutor`. Qualifications are private review notes. Admins approve, reject, or suspend tutors at `/admin/tutors`. Approved profiles with active tutor memberships appear at `/tutors`. A profile edit returns it to review.
- Adult students register at `/signup/student` and book their own lessons at `/student`. Guardians register at `/signup/guardian`, then create and book for linked learners at `/guardian`. Learner profiles created by guardians are managed through the guardian account. Starts appear in the browser's time zone and are stored in UTC.
- The three desks validate the active account role before loading workspace data. Their login pages are `/login/student`, `/login/guardian`, and `/login/tutor`.
- The MVP uses 45-minute lessons and offers starts on a 15-minute grid over the next 14 days. Guardians can reschedule or cancel an active lesson before its start. Tutors can see the resulting status and time in their portal.

## Lesson access and progress

Apply migration `0003_lesson_progress` before restarting the API. It links new progress entries to their booking and allows one entry per booking. Older entries can keep a null booking reference.

Tutors add a private HTTPS meeting link to each booking. The API releases the link only to the assigned tutor, enrolled student, or an authorized guardian, from 10 minutes before the scheduled start through 15 minutes after the scheduled end. A reschedule clears the link so the tutor can attach the correct meeting. The meeting provider controls admission and any links already shared.

Tutors mark a lesson completed after it starts, or mark a no-show after the scheduled end. Completion records guardian-visible notes and one progress entry in the same transaction. Guardians can review the results in their lesson history.
