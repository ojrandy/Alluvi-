# Deployment & Runbook: Namecheap + GitHub Actions

> How to run, deploy, and operate the app. Keep this accurate; the client's next developer depends on it.
> Decisions: ADR-007 (Namecheap), ADR-010 (MySQL).

## Local development

```bash
npm install
cp .env.example .env.local        # fill values
# Local MySQL (matches Namecheap MariaDB closely):
docker run -d --name alluvi-db -p 3306:3306 -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=alluvi -e MARIADB_USER=alluvi -e MARIADB_PASSWORD=alluvi mariadb:10.11 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
#   DATABASE_URL=mysql://alluvi:alluvi@localhost:3306/alluvi
# Local email inbox:
docker run -d --name mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
#   SMTP_HOST=localhost SMTP_PORT=1025 SMTP_SECURE=false  → http://localhost:8025
npm run db:migrate
npm run db:seed                   # safe to re-run; --force refreshes catalogue copy only
npm run dev                       # http://localhost:3000  (admin: /admin)
```

Admin password hash: `npm run hash-password -- "new-password"`, then paste the printed line **as-is, backslashes included** (`ADMIN_PASSWORD_HASH=\$2b\$12\$…`) into `.env.local`, the cPanel env vars or the CI secret. An unescaped hash is silently emptied by Next.js env expansion, and admin login stays disabled with `[auth] … missing or malformed` in the log (ADR-016). Changing the hash signs the admin out everywhere.

## Environment variables
See `.env.example`. All are required in production.
`SESSION_SECRET` and `CUSTOMER_SESSION_SECRET` must each be ≥ 32 random chars and must be different from each other.
In production the app refuses to place orders without them (IP hashing and the order-confirmation cookie are signed with `SESSION_SECRET`), admin login fails closed without `SESSION_SECRET`, and customer sign-in fails without `CUSTOMER_SESSION_SECRET`. In dev they fall back to fixed dev-only values.
`TRUSTED_PROXY_HOPS` (default `1`): how many proxies append to `x-forwarded-for` in front of the app. **Verify on staging** by logging in with a wrong admin password 6 times: the 6th must be blocked, and other IPs must not be. If every visitor shares one limit, the app is seeing the proxy address; if a forged `X-Forwarded-For` header resets the limit, raise or lower the hop count. Set it to `2` behind Cloudflare.
`NEXT_PUBLIC_SITE_URL` is used in account email links (verify / reset), so it must be the public https origin at **build** time.

**Pre-launch checklist (checkout, D1-8):**
- Set real bank details in `settings.bank_details` (/admin/settings once D2-5 ships). While the seeded `TO BE CONFIGURED` / `00000000` placeholders are present, customers are told the bank details will be emailed instead of seeing fake ones.
- Confirm shipping prices in `settings.shipping_options` (seeded at £0; the launch free-shipping promo hides them for 60 days anyway, ADR-012).
- `settings.notify_email` (fallback `ORDER_NOTIFY_EMAIL`) receives the new-order emails.
- Policy copy lives in `content/pages/*.md` (regenerate from the scrape with `npm run content:pages`); it ships with the standalone bundle via `outputFileTracingIncludes` in next.config.ts.

## Namecheap one-time setup (cPanel)

1. **Node version:** cPanel → *Setup Node.js App* → Create application:
   - Node.js version: highest available ≥ 20.9 (Next 16 requirement). Pin the same in `.nvmrc` and CI.
   - Application mode: Production
   - Application root: `alluvi-app` (outside `public_html`)
   - Application URL: the canonical domain
   - Startup file: `server.js` (produced by Next standalone build)
   - Add all env vars from `.env.example` in the app's *Environment variables* section.
2. **Database:** cPanel → *MySQL Databases*: create the DB and a user, then grant ALL privileges.
   `DATABASE_URL=mysql://<cpuser>_<dbuser>:<pass>@localhost:3306/<cpuser>_<db>`
3. **Email:** cPanel → *Email Accounts*: create `orders@<domain>`. SMTP host `mail.<domain>`, port 465 SSL.
4. **Uploads folder:** create `~/alluvi-uploads` (persistent, outside the deploy dir) and set
   `UPLOADS_DIR=/home/<cpuser>/alluvi-uploads` (absolute path) in the Node app's env vars. Admin
   product images are written there and served by the app at `/uploads/<file>` (ADR-017). The deploy
   must never `rsync --delete` into this folder. Back it up with the database: product rows reference
   these files.
5. **SSH:** enable SSH access (cPanel → *SSH Access* / *Manage SSH Keys*). Add a deploy key whose
   private half is stored in GitHub secrets. If the plan has no SSH, fall back to FTP deploy (see below).
6. **SSL:** cPanel → *SSL/TLS Status* → AutoSSL on the domain. Force HTTPS redirect in *Domains*.

## GitHub Actions pipeline (`.github/workflows/deploy.yml`, built in D2-8)

```
push to main
  └─ job: build
       ├─ setup-node (version from .nvmrc), npm ci
       ├─ npm run typecheck && npm run lint
       ├─ next build  (next.config: output "standalone")
       ├─ assemble: .next/standalone + .next/static → .next/standalone/.next/static
       │            + public → .next/standalone/public + drizzle/ migrations
       └─ upload artifact
  └─ job: deploy (needs build, environment: production)
       ├─ rsync artifact → ~/alluvi-app  over SSH   (FTP fallback: SamKirkland/FTP-Deploy-Action)
       ├─ ssh: source nodevenv activate && node scripts/migrate.mjs   (drizzle migrator, no dev deps)
       └─ ssh: touch ~/alluvi-app/tmp/restart.txt   (Passenger restart)
```

**GitHub secrets:** `SSH_HOST`, `SSH_PORT` (Namecheap shared uses **21098**), `SSH_USER`, `SSH_KEY`,
`APP_DIR`. Runtime env vars live in cPanel, **not** in GitHub.

**Why build in CI:** shared hosting kills processes that use too much RAM or CPU. `next build`
on the server will fail or get the account throttled.

## DNS & email deliverability (launch-blocking)
- [ ] Domain points at the Namecheap hosting (nameservers or A record).
- [ ] SPF: `v=spf1 +a +mx include:spf.web-hosting.com ~all` (check the value in cPanel → *Email Deliverability*).
- [ ] DKIM: enabled in cPanel → *Email Deliverability* (one click on Namecheap).
- [ ] DMARC: `v=DMARC1; p=none; rua=mailto:orders@<domain>` (tighten later).
- [ ] Test order lands in the **inbox** (not spam) on Gmail and Outlook.

## Launch checklist
- [ ] All URLs in CONTENT_INVENTORY return 200 or 301.
- [ ] Test order end to end: place → emails → dashboard → mark paid → shipped → customer email.
- [ ] Account flow: create account at checkout → login → order history → password reset email.
- [ ] Admin login works; repeated wrong passwords are rate-limited.
- [ ] Lighthouse mobile ≥ 90 on home, shop, product.
- [ ] `robots.txt` allows crawling; `sitemap.xml` uses the canonical domain; Search Console resubmitted.
- [ ] Bank details in Settings verified by the client.
- [ ] cPanel *Backup* (or JetBackup) confirmed for files + database.

## Operations
| Task | How |
|---|---|
| Deploy | Merge to `main` → Actions runs automatically |
| Restart app | cPanel → Setup Node.js App → Restart, or `touch tmp/restart.txt` |
| Change env var | cPanel → Setup Node.js App → edit → Restart |
| Change admin password | Generate a new hash, update the env var in cPanel, restart |
| Logs | `~/alluvi-app/stderr.log` (Passenger) + cPanel → *Errors* |
| Backups | cPanel JetBackup (daily) + weekly manual DB export via phpMyAdmin |
| Mark order paid | `/admin/orders/[id]` → status `paid` |

## Rollback
Re-run the previous successful deploy workflow from the GitHub Actions UI ("Re-run jobs" on the older run).
Migrations only go forward. To undo a schema change, write a new migration that reverses it.
