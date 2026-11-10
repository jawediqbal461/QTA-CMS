# Deploying to new.qurantutorsacademy.com (HestiaCP)

This is a static single-page app (Vite + React). There's no server-side
rendering and no Node.js process needs to run on the VPS — you build once on
a machine with Node, then upload the static `dist/` output. HestiaCP's
Nginx + Apache backend serves it like any other static site.

## 0. One-time: confirm the Hestia web domain

In Hestia, under **Web**, you should already have `new.qurantutorsacademy.com`
listed (you said you created the subdomain). Note:

- The Hestia **user** that owns it (e.g. `admin` or whatever user you added it under).
- Its docroot, normally: `/home/<hestia-user>/web/new.qurantutorsacademy.com/public_html/`

Open the domain's **Edit** page and confirm the web template is the default
one with Apache as backend (so `.htaccess` is honored — Hestia's default
templates ship with `AllowOverride All`, same as it does for WordPress sites).

## 1. Build locally

On this machine (already verified working — `tsc --noEmit` and `npm run
build` both pass clean):

```bash
npm ci
npm run build
```

This produces `dist/`, which already includes:
- the compiled app (`index.html`, `assets/*.js`, `assets/*.css`)
- `wp-content/uploads/...` (migrated legacy blog images)
- `.htaccess` (SPA fallback rewrite — see below)

A ready-to-upload zip of the current build is at `qta-dist.zip` in the
project root.

## 2. Upload to the server

Using Hestia's **File Manager**, or an SFTP client (FileZilla, WinSCP) with
the Hestia user's SFTP credentials:

1. Connect to the VPS, SFTP user is the Hestia user, path:
   `/home/<hestia-user>/web/new.qurantutorsacademy.com/public_html/`
2. **Delete** any placeholder files already there (Hestia drops a default
   `index.html` when a domain is created).
3. Upload the **contents** of `dist/` (not the `dist` folder itself) into
   `public_html/` — i.e. `index.html`, `assets/`, `wp-content/`, and
   `.htaccess` should sit directly inside `public_html/`.
4. Make sure your SFTP client is set to show **hidden files** so `.htaccess`
   actually gets uploaded (dotfiles are hidden by default in most clients).

If you'd rather use the command line from this machine instead of an SFTP
GUI, once you have SSH/SFTP access details:

```bash
scp -r dist/* -P <port> <hestia-user>@<vps-host>:/home/<hestia-user>/web/new.qurantutorsacademy.com/public_html/
scp dist/.htaccess -P <port> <hestia-user>@<vps-host>:/home/<hestia-user>/web/new.qurantutorsacademy.com/public_html/.htaccess
```

(`.htaccess` is on its own `scp` line because some shells don't glob dotfiles
with `dist/*`.)

## 3. Why the `.htaccess` matters

This is a client-side-routed SPA (React Router). Without a rewrite rule, a
direct load or refresh of e.g. `/tutors` or `/admin` returns a raw 404 from
Apache, because no such file exists on disk. The included `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.html [L]
```

serves real files/folders as-is, and falls back to `index.html` for
everything else so React Router can take over. Test this after deploying —
load `https://new.qurantutorsacademy.com/tutors` directly (not by clicking
from the homepage) and refresh it; it should render, not 404.

## 4. Enable SSL

In Hestia: **Web → (domain) → Edit → SSL** tab → check **SSL Support** and
**Let's Encrypt Support** → Save. Wait a minute for the certificate, then
confirm `https://new.qurantutorsacademy.com` loads without a browser warning.

## 5. Keep it out of Google until it's final

Right now nothing stops this staging subdomain from being crawled and
indexed — which would create duplicate content once the real site also goes
live on `qurantutorsacademy.com`. Don't bake a blanket "noindex" into the
repo's `public/` folder, since that same build will later get copied to the
production domain and you don't want to carry a noindex over by accident.

Instead, add this directly on the server, outside the uploaded `dist/`
contents — e.g. a tiny addition to `public_html/.htaccess` *on the server
only* (don't commit this back to git):

```apache
Header set X-Robots-Tag "noindex, nofollow"
```

Remove that line (or just stop using this subdomain) once you cut over to
the real domain.

## 6. Verify after deploy

- `https://new.qurantutorsacademy.com/` — homepage loads
- `https://new.qurantutorsacademy.com/tutors` — loads directly, not 404
- `https://new.qurantutorsacademy.com/quran` — all 114 surahs list
- `https://new.qurantutorsacademy.com/admin` — login with
  `admin@qurantutorsacademy.com` / `admin-secure-pass` (demo-only auth,
  stored in browser `localStorage` — see `PROJECT_PLAN.md` for the real
  launch plan to replace this with server-verified sessions)
- Browser console has no errors

## 7. Redeploying after future changes

Every time you push a change:

```bash
npm run build
```

then re-upload the new `dist/` contents the same way, overwriting what's on
the server. There's no build step on the VPS itself and no server process to
restart — it's just static files.

## 8. Moving to the real domain later

When `new.qurantutorsacademy.com` is approved as final, repeat steps 1–4
against `qurantutorsacademy.com`'s own web domain in Hestia instead — back up
whatever is currently serving that domain (the existing WordPress site)
first, since this will replace it.
