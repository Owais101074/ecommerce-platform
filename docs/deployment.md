# Deployment runbook

This document takes the repository from a local checkout to a public HTTPS
deployment. Everything in the repository is already configured; the steps that
need **your** accounts (Atlas, Redis, Render, Vercel, Razorpay, SMTP, Cloudinary)
are marked below. No secret is committed at any point.

## Target architecture

```
Browser
  │  HTTPS
  ▼
Vercel (static Vite build)  ── XHR/fetch with credentials ──▶  Render (Express API)
                                                                  │
                                          ┌───────────────────────┼──────────────────┐
                                          ▼                       ▼                  ▼
                                    MongoDB Atlas           Redis (cache +          SMTP
                                    (data)                  BullMQ jobs)            (email)
```

| Piece    | Repository file            | Host                  |
| -------- | -------------------------- | --------------------- |
| API      | `server/`                  | Render Web Service    |
| Web      | `client/`                  | Vercel                |
| Database | —                          | MongoDB Atlas         |
| Redis    | —                          | Redis-compatible host |
| CI       | `.github/workflows/ci.yml` | GitHub Actions        |

The API also builds and runs unchanged as a container using `server/Dockerfile`
and `docker-compose.yml` if you prefer a VPS or Fly.io.

## 1. MongoDB Atlas

1. Create a free M0 cluster (region closest to the API host).
2. **Database Access** → add a user with `readWrite` on the application database.
   Use a generated password; store it in a password manager.
3. **Network Access** → add `0.0.0.0/0` for a Render free service (Render's
   outbound IPs are not fixed). On a paid plan, allow Render's static outbound
   IPs instead.
4. Copy the driver connection string:

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ecommerce?retryWrites=true&w=majority
```

URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, …).

The API creates the declared indexes on startup. To seed an admin and sample
catalogue from the Render shell:

```bash
npm run seed:admin -- admin@example.com '<strong-password>' 'Store Admin'
npm run seed:catalog
```

## 2. Redis

Create a Redis-compatible database that supports blocking commands (`BRPOPLPUSH`)
because BullMQ needs them. Render Key Value, Upstash and Redis Cloud all work.
Use the TLS URL when the provider gives one:

```
rediss://default:<password>@<host>:<port>
```

If you deliberately skip Redis, set `CACHE_DRIVER=none` and `QUEUE_DRIVER=none`.
The app still works, but every catalogue read hits MongoDB and emails are not
queued. That is a degraded production mode, not the recommended one.

## 3. API on Render

The root `render.yaml` is a Render Blueprint.

1. Push this repository to GitHub.
2. Render → **New** → **Blueprint** → select the repository.
3. Render creates `ecommerce-api` and prompts for every `sync: false` variable.
4. Fill the values from the table below, then deploy.

| Variable                                  | Required | Value                                                                                    |
| ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `MONGODB_URI`                             | yes      | Atlas connection string                                                                  |
| `REDIS_URL`                               | yes      | `rediss://…`                                                                             |
| `CORS_ORIGIN`                             | yes      | `https://<your-app>.vercel.app` (exact, no trailing slash)                               |
| `JWT_ACCESS_SECRET`                       | yes      | 64 hex chars: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET`                      | yes      | a different 64-hex value                                                                 |
| `RAZORPAY_KEY_ID`                         | yes      | Razorpay dashboard                                                                       |
| `RAZORPAY_KEY_SECRET`                     | yes      | Razorpay dashboard                                                                       |
| `RAZORPAY_WEBHOOK_SECRET`                 | yes      | value you set in the Razorpay webhook                                                    |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | yes      | e.g. `smtp-relay.brevo.com` / `587` / `false`                                            |
| `SMTP_USER` / `SMTP_PASS`                 | yes      | SMTP provider credentials                                                                |
| `MAIL_FROM`                               | yes      | verified sender, e.g. `Shop <no-reply@yourdomain.com>`                                   |
| `CLOUDINARY_*`                            | optional | without them admin image upload returns `503`                                            |
| `COOKIE_DOMAIN`                           | optional | e.g. `.example.com` only when sharing cookies across subdomains                          |

Already set by the blueprint: `NODE_ENV=production`, `TRUST_PROXY=1`,
`COOKIE_SAMESITE=none`, `CACHE_DRIVER=redis`, `QUEUE_DRIVER=bullmq`,
`MAIL_DRIVER=smtp`.

Notes:

- Render injects `PORT`; do not set it.
- The health check path is `/api/v1/health` (readiness: it returns `503` while
  MongoDB is unreachable).
- `TRUST_PROXY=1` is required so rate limits use the real client IP. With `0`
  every request appears to come from the proxy and shares one bucket.
- Free instances sleep after inactivity, so the first request after idle is slow.

Manual alternative: create a Web Service with root directory `server`,
build `npm ci --include=dev && npm run build`, start `npm start`, and set the
same variables by hand.

## 4. Web on Vercel

1. Vercel → **Add New** → **Project** → import the repository.
2. Set **Root Directory** to `client` (the included `client/vercel.json`
   supplies the Vite build and SPA rewrites).
3. Add `VITE_API_URL=https://<api-host>/api/v1`.
4. Deploy. `VITE_*` values are compiled into the bundle, so changing the URL
   requires a redeploy.

`client/vercel.json` rewrites unknown paths to `index.html`, so refreshing
`/products/:slug` or `/admin/orders/:id` no longer returns 404.

Netlify equivalent (if you prefer it): root directory `client`, build
`npm run build`, publish `dist`, and a `public/_redirects` file containing:

```
/*  /index.html  200
```

## 5. Razorpay webhook

In the Razorpay dashboard → Settings → Webhooks:

- URL: `https://<api-host>/api/v1/payments/webhook`
- Events: `payment.captured`, `payment.failed`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET`

The endpoint verifies the HMAC over the raw request body, so it must not sit
behind a proxy that rewrites the body.

## 6. Cookies, CORS and domains

The refresh and CSRF cookies are always `Secure` and `HttpOnly` (CSRF is
readable by design) in production. `SameSite` depends on the relationship
between the two hosts:

| Frontend                   | API                             | Relationship                        | `COOKIE_SAMESITE` |
| -------------------------- | ------------------------------- | ----------------------------------- | ----------------- |
| `https://shop.example.com` | `https://api.example.com`       | same site (same registrable domain) | `lax`             |
| `https://shop.vercel.app`  | `https://shop-api.onrender.com` | cross-site                          | `none`            |
| `https://shop.example.com` | `https://shop-api.onrender.com` | cross-site                          | `none`            |

- `CORS_ORIGIN` must contain the exact frontend origin, comma-separated for
  several. Production rejects `http://` and localhost values at startup.
- `sameSite: none` requires HTTPS. Some browsers (notably Safari with ITP) still
  limit third-party cookies, so **custom domains on one registrable domain are
  the most reliable setup**; `lax` then also applies.
- If you use custom domains and set `COOKIE_DOMAIN=.example.com`, clear cookies
  in the browser after changing it, because cookies are scoped by domain.

## 7. Production smoke test

Replace the host variables and run these from a terminal.

```bash
API=https://<api-host>/api/v1
WEB=https://<web-host>

curl -i "$API/health"                 # 200, database: connected
curl -i "$API/health/live"            # 200 without touching MongoDB
curl -i -X OPTIONS "$API/products" \
  -H "Origin: $WEB" \
  -H "Access-Control-Request-Method: GET"   # 204 + access-control-allow-origin

curl -i -c cookies.txt -X POST "$API/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","email":"smoke-'"$(date +%s)"'@example.com","password":"Str0ngPass!23"}' \
  | grep -i 'set-cookie'
```

Register returns `Set-Cookie` for `refreshToken` and `csrfToken`. Confirm the
flags in the response headers:

```
Set-Cookie: refreshToken=…; Max-Age=…; Path=/api/v1/auth; Expires=…; HttpOnly; Secure; SameSite=None
Set-Cookie: csrfToken=…; Max-Age=…; Path=/; Expires=…; Secure; SameSite=None
```

Continue with the application flows:

- [ ] Home page loads over HTTPS and lists categories/products.
- [ ] Register, sign in, refresh the page, and stay signed in.
- [ ] `GET /products?q=…` returns results; product detail and reviews load.
- [ ] Add to cart and wishlist; reload and confirm they persist.
- [ ] Add an address, request a quote, place an order (payment stays pending
      until Razorpay completes).
- [ ] Complete a Razorpay test payment and confirm `paymentStatus: paid` and a
      confirmation email arrive.
- [ ] Sign in as admin (`/admin`), open orders, ship an order, check the email.
- [ ] Sign out; `/account` redirects to `/login`.
- [ ] Security headers: `curl -I $WEB` shows `x-frame-options` and
      `x-content-type-options`; `curl -I $API/health` shows Helmet headers.
- [ ] Rate limits still return `429` after many rapid requests.

## 8. Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

| Job    | Steps                                                                              |
| ------ | ---------------------------------------------------------------------------------- |
| Server | `npm ci`, typecheck, lint, format check, Vitest against a MongoDB 7 service, build |
| Client | `npm ci`, typecheck, lint, format check, Vitest, build                             |

The workflow uses dummy JWTs and payment secrets that exist only in the job
environment; tests run with the memory cache and queue. A red run must be fixed
before merging. Enable branch protection on `main` and require the two checks if
you want the pipeline to block merges.

## 9. Rollback

| Failure           | Recovery                                                                                |
| ----------------- | --------------------------------------------------------------------------------------- |
| Bad API deploy    | Render → service → **Rollback** → choose the previous deploy                            |
| Bad web deploy    | Vercel → deployment → **Instant Rollback**                                              |
| Bad configuration | Revert the variable in the host dashboard; Render redeploys automatically               |
| Bad data change   | Atlas → **Backup** / point-in-time restore (enabled on M10+; M0 has no backups)         |
| Redis outage      | `CACHE_DRIVER` falls back to the database automatically; jobs pause until Redis returns |

Roll forward by reverting the commit on `main`; the pipeline gates the redeploy.

## 10. Troubleshooting

| Symptom                                                      | Likely cause                                            | Fix                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Browser console: CORS error                                  | `CORS_ORIGIN` missing or has a trailing slash           | Set the exact origin, redeploy                                                |
| Login succeeds, reload signs you out                         | Cookie cross-site blocked                               | Use `COOKIE_SAMESITE=none` (default in blueprint) or same-site custom domains |
| Cookies missing entirely over HTTPS                          | `COOKIE_SAMESITE=none` with `NODE_ENV` not `production` | Env validation blocks this; set `NODE_ENV=production`                         |
| `429` for everyone at once                                   | `TRUST_PROXY=0` behind a proxy                          | Set `TRUST_PROXY=1`                                                           |
| API exits at boot with `[env] Invalid environment variables` | Missing secret or http localhost CORS                   | Read the printed list and fix the dashboard variables                         |
| 404 when refreshing `/admin/...`                             | SPA rewrite missing                                     | Confirm `client/vercel.json` is deployed at the project root                  |
| Emails not sent                                              | `MAIL_DRIVER=log` or SMTP rejected                      | Set `MAIL_DRIVER=smtp` and valid credentials; check provider logs             |
| `503` on image upload                                        | Cloudinary variables missing                            | Add the three Cloudinary values                                               |
| First request after idle is slow                             | Free Render instance waking up                          | Expected; upgrade the plan to avoid                                           |

## Environment variable reference

See `server/.env.example` for the annotated development list. Deployment adds:

| Variable                      | Purpose                               | Default                        |
| ----------------------------- | ------------------------------------- | ------------------------------ |
| `TRUST_PROXY`                 | Proxy hops in front of Express        | `0`                            |
| `COOKIE_SAMESITE`             | `lax`, `strict` or `none`             | `lax`                          |
| `COOKIE_DOMAIN`               | Optional cookie domain                | empty                          |
| `VITE_API_URL` (client build) | API base URL compiled into the bundle | `http://localhost:5000/api/v1` |
