# E-commerce Platform

A production-style e-commerce application built phase by phase, with a focus on
clean architecture, TypeScript, and real-world backend practices.

## Stack

| Layer    | Technology                                                                               |
| -------- | ---------------------------------------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, lucide-react |
| Backend  | Node.js, Express, TypeScript, REST, JWT, Zod                                             |
| Database | MongoDB + Mongoose                                                                       |
| Infra    | Redis + ioredis, BullMQ, Nodemailer, structured JSON logs, Docker Compose                |
| Tooling  | Git, GitHub CLI, ESLint, Prettier, Postman                                               |

## Repository layout

```
ecommerce-platform/
├── client/   React application (Phase 4)
├── server/   Express API (Phase 1)
├── docs/     API contract and technical references
├── PROJECT_CONTEXT.md   Living project state (read this first)
├── CHANGELOG.md
└── README.md
```

## Project status

| Phase | Description                                 | Status      |
| ----- | ------------------------------------------- | ----------- |
| 0     | Planning and architecture                   | Complete    |
| 1     | Backend foundation                          | Complete    |
| 2     | Authentication and authorization            | Complete    |
| 3     | Products and categories                     | Complete    |
| 4     | Frontend foundation + storefront UI refresh | Complete    |
| 5     | Customer shopping experience                | Complete    |
| 6     | Cart and wishlist                           | Complete    |
| 7     | Checkout, addresses and orders              | Complete    |
| 8     | Payments                                    | Complete    |
| 9     | Order management                            | Complete    |
| 10    | Admin dashboard                             | Complete    |
| 11    | Testing and security                        | Complete    |
| 12    | Advanced backend                            | Complete    |
| 13    | Deployment and CI/CD                        | Not started |

## Documentation

- [Project context](PROJECT_CONTEXT.md) — architecture, decisions, current state
- [Project guide](PROJECT_GUIDE.md) — complete phase-by-phase guide, workflows and explanations
- [API contract](docs/api-contract.md) — planned endpoints and conventions
- [Changelog](CHANGELOG.md)

## Getting started

### Prerequisites

- Node.js 22 (`nvm use` reads `.nvmrc`)
- MongoDB running locally on `127.0.0.1:27017`
- Redis (optional; only when `CACHE_DRIVER=redis` or `QUEUE_DRIVER=bullmq`)
- Docker + Docker Compose (optional; runs the API, MongoDB and Redis together)

### Server

```bash
cd server
npm install
cp .env.example .env    # Windows CMD: copy .env.example .env
npm run dev
```

The API starts at `http://localhost:5000`.

Verify it:

```bash
curl http://localhost:5000/api/v1/health
```

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "ok",
    "environment": "development",
    "uptime": 12,
    "database": "connected",
    "infrastructure": { "cache": "memory", "queue": "memory", "mail": "log" },
    "timestamp": "2026-11-02T13:52:18.689Z"
  }
}
```

### Server scripts

| Command                                           | Purpose                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| `npm run dev`                                     | Start with tsx watch (reloads on save)           |
| `npm run build`                                   | Compile to `dist/`                               |
| `npm start`                                       | Run the compiled build                           |
| `npm run typecheck`                               | TypeScript check, no output files                |
| `npm run lint`                                    | ESLint                                           |
| `npm run format`                                  | Prettier write                                   |
| `npm run seed:admin -- <email> <password> [name]` | Create an admin or promote an existing user      |
| `npm run seed:catalog`                            | Seed sample categories and products (idempotent) |
| `npm run perf:indexes`                            | Explain catalogue queries before/after indexes   |
| `npm test`                                        | Run the Vitest + Supertest suite                 |
| `npm run test:watch`                              | Run tests in watch mode                          |

### Authentication (Phase 2)

| Method | Endpoint                | Access             |
| ------ | ----------------------- | ------------------ |
| POST   | `/api/v1/auth/register` | public             |
| POST   | `/api/v1/auth/login`    | public             |
| POST   | `/api/v1/auth/refresh`  | refresh cookie     |
| POST   | `/api/v1/auth/logout`   | refresh cookie     |
| GET    | `/api/v1/auth/me`       | access token       |
| GET    | `/api/v1/admin/ping`    | admin access token |

Access tokens live for 15 minutes and are sent as `Authorization: Bearer <token>`.
The refresh token is stored in an httpOnly cookie and rotated on every refresh;
reusing an old refresh token revokes the session. Access tokens carry a
`tokenVersion`; changing the password increments the stored version and
invalidates every previously issued access token immediately.

`/auth/refresh` and `/auth/logout` use a double-submit CSRF check: the server
sets a readable `csrfToken` cookie and the client must echo it in the
`X-CSRF-Token` header. Requests missing or mismatching the pair return `403`.

Rate limits are applied per IP over a 15-minute window by default: 300 requests
for `/api/v1` and 30 for `/auth/login` and `/auth/register` (configurable with
`RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`).

### Catalogue (Phase 3)

| Method                | Endpoint                     | Access |
| --------------------- | ---------------------------- | ------ |
| GET                   | `/api/v1/categories`         | public |
| GET                   | `/api/v1/categories/:slug`   | public |
| POST / PATCH / DELETE | `/api/v1/categories...`      | admin  |
| GET                   | `/api/v1/products`           | public |
| GET                   | `/api/v1/products/:slug`     | public |
| POST / PATCH / DELETE | `/api/v1/products...`        | admin  |
| PATCH                 | `/api/v1/products/:id/stock` | admin  |

`GET /api/v1/products` supports `q`, `category`, `minPrice`, `maxPrice`,
`rating`, `inStock`, `sort`, `page`, and `limit`. Prices are integer paise.

### Reviews (Phase 11)

| Method | Endpoint                         | Access               |
| ------ | -------------------------------- | -------------------- |
| GET    | `/api/v1/products/:slug/reviews` | public               |
| POST   | `/api/v1/products/:id/reviews`   | access token         |
| PATCH  | `/api/v1/reviews/:id`            | access token (owner) |

Reviews are one per customer per product (`409` on a second review). The public
list returns `data: { reviews, summary: { average, count } }` with pagination
meta (`page`, `limit` max 50, default 10). Every create or edit recomputes the
product's `ratingAvg` and `ratingCount` with a MongoDB aggregation, so catalogue
ratings and filters stay consistent. There is no delete endpoint yet.

### Profile (Phase 5)

| Method | Endpoint                    | Access       |
| ------ | --------------------------- | ------------ |
| GET    | `/api/v1/users/me`          | access token |
| PATCH  | `/api/v1/users/me`          | access token |
| PATCH  | `/api/v1/users/me/password` | access token |

`PATCH /users/me` updates the name. `PATCH /users/me/password` verifies the
current password, rejects reuse of the old password, hashes the new one, revokes
the stored refresh session and clears the refresh cookie.

### Addresses and checkout (Phase 7)

| Method | Endpoint                        | Access       |
| ------ | ------------------------------- | ------------ |
| GET    | `/api/v1/addresses`             | access token |
| POST   | `/api/v1/addresses`             | access token |
| PATCH  | `/api/v1/addresses/:id`         | access token |
| PATCH  | `/api/v1/addresses/:id/default` | access token |
| DELETE | `/api/v1/addresses/:id`         | access token |
| POST   | `/api/v1/orders/quote`          | access token |
| POST   | `/api/v1/orders`                | access token |
| GET    | `/api/v1/orders`                | access token |
| GET    | `/api/v1/orders/:id`            | access token |

The first saved address becomes the default; setting another default unsets the
previous one, and deleting the default promotes the oldest remaining address.
Checkout totals are computed on the server in integer paise: GST is 18% and
inclusive (`round(subtotal × 18 / 118)`), shipping is free from ₹999 (99,900
paise) and ₹49 (4,900 paise) below that. Orders store item and address snapshots,
decrement stock atomically, and clear the cart. Coupon codes are validated
against the cart subtotal on the server and the discount is applied before tax
and shipping. Orders start with `paymentStatus: pending`; payment is completed
from the order detail page.

### Payments (Phase 8)

| Method | Endpoint                         | Access                       |
| ------ | -------------------------------- | ---------------------------- |
| POST   | `/api/v1/payments/start`         | access token                 |
| POST   | `/api/v1/payments/verify`        | access token                 |
| POST   | `/api/v1/payments/abandon`       | access token                 |
| POST   | `/api/v1/payments/mock/complete` | access token, mock mode only |
| POST   | `/api/v1/payments/webhook`       | public, signature required   |

`POST /payments/start` creates one payment document per order and returns the
gateway order id, the amount in paise and the public key id. Repeating it while
an attempt is open returns the same gateway order with no new charge attempt.
`POST /payments/verify` checks the HMAC signature of
`<gatewayOrderId>|<gatewayPaymentId>`, marks the payment paid and moves the order
to `confirmed`. `abandon` records a dismissed or failed attempt as `failed`, and
a new attempt resets the payment to `created` with `attempts + 1`.

Set `PAYMENT_MODE=razorpay` with `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET` to call the real Razorpay Orders API. The default
`PAYMENT_MODE=mock` simulates gateway order creation locally while still signing
and verifying with the same HMAC code, so no credentials are needed in
development. Production configuration rejects mock mode. The webhook mount reads
the raw request body before `express.json()` so the signature is checked over the
exact bytes Razorpay signed. Payment secrets live only in `server/.env`.

### Order management (Phase 9)

| Method | Endpoint                          | Access      |
| ------ | --------------------------------- | ----------- |
| PATCH  | `/api/v1/orders/:id/cancel`       | order owner |
| GET    | `/api/v1/admin/orders`            | admin       |
| GET    | `/api/v1/admin/orders/:id`        | admin       |
| PATCH  | `/api/v1/admin/orders/:id/status` | admin       |

Orders follow `placed → confirmed → shipped → delivered`, with `cancelled` as a
terminal state. Every transition is validated on the server and appended to a
`statusHistory` array with a timestamp and optional note, which powers the
customer timeline.

Customers can cancel while an order is `placed` or `confirmed`. The conditional
status update means only one request can win, stock is restored once, and repeat
cancels are idempotent. A paid order is refunded through the provider (mock
`rfnd_mock_*` ids locally); the payment moves `paid → refund_pending →
refunded` and the order shows `paymentStatus: refunded`. If the gateway refund
fails, the response sets `refundPending: true` and a later cancel retries it. A
payment captured after cancellation is refunded automatically.

Admins can list every order with `?page`, `?limit`, `?status` and `?userId`,
plus a customer name/email summary, then confirm, ship or deliver. Confirming
requires a paid order, shipping requires a carrier and tracking number (stored
as `tracking`), and stale or skipped transitions return `409`.

### Admin dashboard and coupons (Phase 10)

| Method         | Endpoint                              | Access       |
| -------------- | ------------------------------------- | ------------ |
| GET            | `/api/v1/admin/stats`                 | admin        |
| GET            | `/api/v1/admin/customers`             | admin        |
| GET            | `/api/v1/admin/customers/:id`         | admin        |
| PATCH          | `/api/v1/admin/customers/:id/status`  | admin        |
| POST           | `/api/v1/admin/uploads/product-image` | admin        |
| POST           | `/api/v1/coupons/validate`            | access token |
| GET / POST     | `/api/v1/coupons`                     | admin        |
| PATCH / DELETE | `/api/v1/coupons/:id`                 | admin        |

`GET /admin/stats` returns revenue (all time, last 30 days and today), order
counts by status, customer and catalogue counters, a seven-day paid-revenue
series, top products by units sold (cancelled orders excluded), low-stock and
out-of-stock products, and the five latest orders. Aggregations run in MongoDB
and customer summaries use one batched lookup per list.

Coupons support percentage or fixed discounts in integer paise, a minimum order,
an optional maximum discount, a start/expiry window, an optional usage limit and
an active flag. `POST /coupons/validate` checks the signed-in customer's cart and
returns the computed discount; checkout quotes and `POST /orders` recompute the
same values on the server. Usage is claimed with an atomic conditional `$inc`
when an order is placed and released when that order is cancelled, so a coupon
cannot be over-redeemed by concurrent orders.

Customer accounts can be deactivated by an admin. Deactivation clears the stored
refresh session and `authenticate` rejects the access token immediately, so the
customer is signed out on the next request.

Product images are uploaded through the API: multer accepts only JPEG, PNG or
WebP files up to 5 MB in memory, then the server signs and forwards the file to
Cloudinary. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET` (plus optional `CLOUDINARY_FOLDER`) in `server/.env`.
Without those values the endpoint returns `503` and the admin form falls back to
image URLs, so local development never depends on a vendor account.

### Client (Phase 4)

Start the API first, then the client in a second terminal:

```bash
cd client
npm install
npm run dev
```

The app starts at `http://localhost:5173` and calls `http://localhost:5000/api/v1`
by default. Override it with `VITE_API_URL` in `client/.env` (see
`client/.env.example`).

| Command                | Purpose                                |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Vite dev server with HMR               |
| `npm run build`        | Type-check and build to `dist/`        |
| `npm run preview`      | Serve the production build locally     |
| `npm run typecheck`    | TypeScript check, no output files      |
| `npm run lint`         | ESLint                                 |
| `npm run format`       | Prettier write                         |
| `npm run format:check` | Prettier check                         |
| `npm test`             | Run the Vitest + Testing Library suite |
| `npm run test:watch`   | Run client tests in watch mode         |

Client routes:

| Route               | Access    | Purpose                                                                   |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| `/`                 | public    | Home with live category and product previews                              |
| `/products`         | public    | Catalogue with search, filters, sorting and pagination                    |
| `/products/:slug`   | public    | Product gallery, price, stock, ratings and related items                  |
| `/categories/:slug` | public    | Department hero with its products                                         |
| `/login`            | public    | Sign in                                                                   |
| `/register`         | public    | Create account                                                            |
| `/account`          | signed in | Editable profile, password change and session details                     |
| `/addresses`        | signed in | Address book with default address management                              |
| `/checkout`         | signed in | Address selection, server quote and order placement                       |
| `/orders`           | signed in | Order history with pagination                                             |
| `/orders/:id`       | signed in | Order detail with snapshots, payment, timeline, tracking and cancellation |
| `/admin`            | admin     | Dashboard with revenue, pipeline and catalogue health                     |
| `/admin/orders`     | admin     | All orders with status filters and pagination                             |
| `/admin/orders/:id` | admin     | Admin order detail with status actions                                    |
| `/admin/products`   | admin     | Product and stock management with image upload                            |
| `/admin/categories` | admin     | Category tree management                                                  |
| `/admin/customers`  | admin     | Customer list, spending history and deactivation                          |
| `/admin/coupons`    | admin     | Coupon creation, editing and status control                               |

The access token is kept in memory only; a reload restores the session through
the httpOnly refresh cookie, and a 401 triggers one silent refresh and retry.

### Advanced infrastructure (Phase 12)

Every piece of infrastructure is driver-based, so the API runs with zero external
services in development and tests:

| Capability | Default | Alternatives | Notes                                                          |
| ---------- | ------- | ------------ | -------------------------------------------------------------- |
| Cache      | memory  | `redis`, none | Read-through catalogue cache; invalidated on catalogue writes  |
| Queue      | memory  | `bullmq`, none | Email jobs; BullMQ retries 3× with exponential backoff        |
| Mail       | log     | `smtp`, none | `log` records messages in an in-memory outbox and logs them    |

- Catalogue list/detail and category reads are cached with a TTL
  (`CACHE_TTL_SECONDS`, default 60). Product, category, review-rating and
  order stock writes invalidate the affected namespace. Cache failures fall back
  to the database and never fail a request.
- Order lifecycle events queue email jobs: placed, confirmed, shipped, delivered
  and cancelled. A webhook retry or repeated verification does **not** send a
  second confirmation email.
- Every request gets an `X-Request-Id` (incoming value reused when it matches
  `[A-Za-z0-9._-]{8,128}`, otherwise a UUID). The same id is attached to the
  JSON logs, including queued email jobs.
- `npm run perf:indexes` builds 5,000 synthetic products in a throwaway
  `ecommerce_perf` database, explains the main catalogue queries before and
  after the declared indexes, and drops the database. On the reference run
  documents examined dropped from 5,000 to 1–20 and query time from 9–11 ms to
  1–2 ms.

Environment variables (see `server/.env.example`):

| Variable                          | Default                                  |
| --------------------------------- | ---------------------------------------- |
| `LOG_LEVEL`                       | `info` (`debug`/`info`/`warn`/`error`)   |
| `CACHE_DRIVER` / `CACHE_TTL_SECONDS` | `memory` / `60`                       |
| `QUEUE_DRIVER`                    | `memory`                                 |
| `MAIL_DRIVER` / `MAIL_FROM`       | `log` / `Ecommerce Platform <no-reply@example.com>` |
| `REDIS_URL`                       | empty; required for `redis`/`bullmq`     |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | empty / 587 / false; required for `smtp` |

#### Docker Compose

The root `docker-compose.yml` starts MongoDB, Redis and the API (Redis cache and
BullMQ queue enabled). Secrets are read from the environment, so nothing is
committed:

```bash
# Git Bash: generate throwaway local values for the required secrets
export JWT_ACCESS_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
export RAZORPAY_KEY_SECRET=local-dev-key-secret
export RAZORPAY_WEBHOOK_SECRET=local-dev-webhook-secret

docker compose up --build
```

The API is available at `http://localhost:5000/api/v1`.

### Tests (Phase 12)

```bash
cd server && npm test
cd client && npm test
```

The server suite runs against a real local MongoDB database named
`ecommerce_test` (`MONGODB_URI` can override it); collections are cleared between
tests and the database is dropped at the end. Tests run serially to keep shared
state predictable. Background jobs are drained and the cache/outbox reset after
every test. The client suite runs in jsdom with Testing Library and covers
formatting helpers, the `Button` primitive, and the route guards.

| Suite  | Files | Tests |
| ------ | ----- | ----- |
| Server | 8     | 49    |
| Client | 3     | 12    |

### Design system

The storefront uses a warm editorial look rather than a default dashboard theme:

- Cream and paper surfaces with warm ink neutrals.
- Deep forest green for brand actions and terracotta for accents.
- Fraunces for display headings, Plus Jakarta Sans for UI and body text.
- Shared colour, shadow and motion tokens declared in `@theme` inside
  `client/src/index.css`.
- lucide-react icons in the shell, forms and state components.
- Login and register render as a full-screen split layout outside the store
  shell; the left panel explains the session model.

Pages compose the shared UI kit in `client/src/components/ui/` instead of
one-off styles.

## Author

Owais — [GitHub](https://github.com/Owais101074)
