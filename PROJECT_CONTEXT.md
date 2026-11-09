# Project Context

Living state document. Read this before starting any work; update it at the end of
every phase. If chat context is lost, this file is the source of truth.
For a full project explanation (phases, architecture, workflows, interview Q&A),
read [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

**Last updated:** 2026-11-09
**Current phase:** Phase 13 — Deployment and CI/CD (complete, awaiting review)
**Latest work:** Environment-driven production cookies/CORS/proxy trust, liveness and readiness probes, Render blueprint, Vercel SPA config, GitHub Actions CI, deployment runbook and deployment tests
**Completed phases:** Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10, Phase 11, Phase 12, Phase 13
**Git branch:** `main` (tracking `origin/main`)
**Repository:** https://github.com/Owais101074/ecommerce-platform (public)

---

## 1. Product scope

A production-style e-commerce platform with:

- **Customer:** auth, profile, browse/search/filter/sort products, categories,
  reviews, cart, wishlist, addresses, checkout, payment, orders, tracking,
  cancellation/refund, email notifications.
- **Admin:** dashboard analytics, product/category/inventory/order/customer
  management, coupons, revenue reports.
- **Engineering:** pagination, Redis caching, Cloudinary uploads, Razorpay,
  background jobs, rate limiting, logging, security, Docker, tests, CI/CD.

## 2. Architecture

**Monorepo.** `client/` and `server/` are independent apps with their own
`package.json`; no npm workspaces. Shared knowledge lives in `docs/`.

**Backend:** feature-modular, three layers.

```
route      → URL, middleware chain
controller → HTTP concerns only (parse req, shape res)
service    → business logic and database access
model      → Mongoose schema and indexes
```

Rules: routes hold no logic, controllers never call Mongoose models directly,
services never touch `req`/`res`.

**Frontend:** feature-based folders, server state in TanStack Query, session
state in a small AuthContext. No Redux.

## 3. Target folder structure

```
ecommerce-platform/
├── client/                       React app (Phase 4)
│   └── src/
│       ├── api/                  http (axios) + session token store + errors + endpoint files
│       ├── components/           ui/, layout/, product/, address/, order/, payment/
│       ├── features/             auth/ (context, provider, hook)
│       ├── hooks/                TanStack Query wrappers
│       ├── lib/                  env, queryClient, formatters, constants
│       ├── pages/                route-level components
│       ├── routes/               createBrowserRouter + RequireAuth/RequireAdmin
│       ├── types/                shared API types
│       ├── App.tsx
│       ├── index.css             Tailwind entry + design tokens
│       └── main.tsx
├── server/                       Express API (Phase 1)
│   └── src/
│       ├── config/               env.ts (Zod), db.ts
│       ├── middleware/           auth, authorize, validate, errorHandler, notFound, rateLimit
│       ├── modules/
│       │   └── <module>/         routes, controller, service, model, mapper, validation, types
│       ├── scripts/              one-off CLI tasks (seedAdmin)
│       ├── utils/                ApiError, ApiResponse, jwt, password, cookies, pagination
│       ├── types/                express.d.ts (Request.user augmentation)
│       ├── app.ts
│       └── server.ts
├── docs/
└── .github/workflows/            CI (Phase 13)
```

## 4. Technology decisions

| Area                   | Decision                                                                                                         | Why                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Language               | TypeScript strict mode, no implicit `any`                                                                        | Catch shape errors at compile time                                                        |
| Money                  | Integer **paise**                                                                                                | Avoids floating point errors in totals/tax                                                |
| Auth                   | 15 min access token + 7 day refresh token in httpOnly cookie                                                     | XSS-safe refresh, revocable sessions                                                      |
| Refresh storage        | SHA-256 hash of the refresh token on the user document                                                           | A database leak does not expose usable tokens                                             |
| Refresh rotation       | New token on every refresh; reuse of an old token clears the session                                             | Detects stolen refresh tokens                                                             |
| Production cookies     | Always `Secure` in production; `SameSite` from `COOKIE_SAMESITE`                                                 | Same-site and cross-site hosting need different cookie rules                              |
| Proxy trust            | `TRUST_PROXY` hop count                                                                                          | Correct client IP and per-client rate limits behind a host proxy                          |
| CI                     | GitHub Actions: server job with MongoDB service, client job                                                      | The same gates run locally and on every push/PR                                           |
| Passwords              | bcryptjs, cost factor 12                                                                                         | Slow hashing resists brute force                                                          |
| Validation             | Zod for env and request bodies                                                                                   | One schema source; infer TS types                                                         |
| Response shape         | `{ success, message, data, meta? }`                                                                              | Predictable frontend handling                                                             |
| Errors                 | `ApiError` + single global error middleware                                                                      | Consistent status codes and payloads                                                      |
| API prefix             | `/api/v1`                                                                                                        | Room for breaking changes later                                                           |
| API framework          | Express 5                                                                                                        | Native async error forwarding; no `asyncHandler` wrapper needed                           |
| Module system          | TypeScript `nodenext`, compiled to CommonJS                                                                      | Modern resolution without ESM `.js` import friction                                       |
| IDs                    | Mongo ObjectId                                                                                                   | Default; slugs used for public product/category URLs                                      |
| Deletes                | Soft delete on products/users (`isActive`)                                                                       | Orders keep valid references                                                              |
| Order data             | Price/name/address snapshots                                                                                     | Historical accuracy after edits                                                           |
| Reviews                | Compound unique index `(user, product)`                                                                          | One review per customer per product                                                       |
| Images                 | URL list plus optional signed Cloudinary upload                                                                  | Catalogue writes work without a vendor account                                            |
| Server state           | TanStack Query                                                                                                   | Caching, retries, loading states                                                          |
| Client token storage   | Access token in a module variable                                                                                | Never readable by injected scripts; localStorage avoided                                  |
| Client refresh         | 401 → one shared `/auth/refresh` call → retry once                                                               | Many parallel 401s cost one refresh                                                       |
| Client session restore | Refresh cookie on app mount, deduplicated                                                                        | StrictMode double effects cannot rotate twice                                             |
| Catalogue state        | URL search params (`q`, `category`, `min`, `max`, `rating`, `inStock`, `sort`, `page`)                           | Filters are shareable, reload-safe and back-button friendly                               |
| Password change        | Verify current password, reject reuse, revoke refresh session, clear cookie                                      | A changed password invalidates every existing session                                     |
| Login redirect notice  | Guard forwards a notice code to `/login`                                                                         | The re-login reason survives the auth redirect                                            |
| Styling                | Tailwind CSS 4 via `@tailwindcss/vite` with `@theme` tokens                                                      | No config file; tokens generate utilities                                                 |
| Visual design          | Warm editorial palette (cream/paper, forest green, terracotta), Fraunces + Plus Jakarta Sans, lucide-react icons | A curated-store feel, not a default dashboard; all tokens live in `index.css`             |
| Client routing         | React Router 7 `createBrowserRouter`                                                                             | Data-router ready for loaders later                                                       |
| Cart/wishlist          | Persisted server-side                                                                                            | Cross-device consistency                                                                  |
| Cart pricing           | `priceAtAdd` snapshot per line; totals computed on the server                                                    | Cart totals are trustworthy and historical prices survive catalogue edits                 |
| Cart limits            | 10 units per line; stock checked on add and update                                                               | Prevents overselling and accidental bulk orders                                           |
| Wishlist toggle        | TanStack Query optimistic update with rollback                                                                   | Instant heart feedback without waiting for the network                                    |
| Notifications          | Lightweight toast context (3.5s)                                                                                 | Local feedback for cart and wishlist mutations without a dependency                       |
| Checkout pricing       | Server quote + server recompute on order; client sends no prices                                                 | Totals cannot be tampered with in the browser                                             |
| Tax                    | GST-inclusive, `round(subtotal × 18 / 118)`                                                                      | Matches Indian retail display, stays in integer paise                                     |
| Shipping               | Free from ₹999 (99,900 paise), otherwise ₹49 (4,900 paise)                                                       | One clear threshold measured after discount                                               |
| Address default        | Exactly one default; first address auto-default; delete promotes oldest                                          | Predictable checkout pre-selection without a second source of truth                       |
| Stock on order         | Conditional `$gte` decrement per line with rollback                                                              | Prevents overselling without MongoDB transactions                                         |
| Order history          | Item and address snapshots                                                                                       | Editing a product or address never rewrites a past order                                  |
| Payments               | Razorpay Orders REST via `fetch`, explicit `PAYMENT_MODE=mock` for local dev, HMAC verification                  | Real gateway code without an SDK dependency; tests run without credentials                |
| Payment record         | One `payments` document per order (`orderId` unique), retries reuse it                                           | Prevents double charges and gives one audit trail per order                               |
| Webhook body           | Mounted with `express.raw()` before `express.json()`                                                             | The signature is only valid over the exact bytes the gateway sent                         |
| Payment activation     | Only a valid signature changes the order to paid/confirmed                                                       | The browser is never trusted to declare a payment successful                              |
| Order lifecycle        | Server-owned `ALLOWED_TRANSITIONS` map with a `statusHistory[]` event log                                        | One place decides what is legal next; the customer timeline is data, not client inference |
| Cancellation           | Conditional update guarded by `placed`/`confirmed`; stock restored only by the winning request                   | Prevents double stock restoration without transactions                                    |
| Refunds                | Atomic `paid → refund_pending → refunded` claim, provider refund via REST, reset to `paid` on failure            | One refund per payment, retryable after a gateway failure, safe under concurrent cancels  |
| Admin order queries    | Pagination plus `status`/`userId` filters; customers resolved with one batched lookup                            | Operational listing without N+1 queries                                                   |
| Coupons                | Server-validated against cart subtotal; usage claimed with a conditional `$inc` and released on failure/cancel   | Prevent over-redemption without transactions; the client never decides a discount         |
| Admin analytics        | MongoDB aggregations over paid orders, UTC day buckets, batched customer lookups                                 | One small set of queries for the dashboard instead of per-card fetches                    |
| Customer deactivation  | `isActive` is checked on every authenticated request and the refresh session is cleared                          | A disabled account loses access immediately, not when its access token expires            |
| Uploads                | 5 MB memory upload, JPEG/PNG/WebP only, server-signed Cloudinary request                                         | The API secret stays on the server; local dev works without a vendor account              |
| Testing                | Vitest + Supertest on a real `ecommerce_test` DB; Testing Library in jsdom                                       | Mocks would hide index and aggregation bugs                                               |

## 5. Database collections

| Collection   | Key fields                                                                                                                                                                                     | Relationships / indexes                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `users`      | name, email, passwordHash, role, isActive                                                                                                                                                      | email unique; 1–1 cart; 1–N addresses, orders, reviews                             |
| `categories` | name, slug, parentId, isActive                                                                                                                                                                 | slug unique; self-referencing tree                                                 |
| `products`   | name, slug, description, price, categoryId, images, stock, ratingAvg, ratingCount                                                                                                              | slug unique; index on categoryId, price, createdAt; text index on name/description |
| `carts`      | userId, items[{ productId, quantity, priceAtAdd }]                                                                                                                                             | userId unique                                                                      |
| `wishlists`  | userId, productIds[]                                                                                                                                                                           | userId unique                                                                      |
| `addresses`  | userId, label, line1, line2, city, state, pincode, phone, isDefault                                                                                                                            | index on userId                                                                    |
| `orders`     | userId, items[] snapshot, address snapshot, subtotal, tax, shipping, discount, total, status, paymentStatus, statusHistory[] {status, at, note}, tracking {carrier, trackingNumber, updatedAt} | index on userId + createdAt; index on status + createdAt                           |
| `payments`   | orderId, provider, providerOrderId, providerPaymentId, amount, status, refundId, refundedAt, rawPayload                                                                                        | orderId unique                                                                     |
| `reviews`    | userId, productId, rating, comment                                                                                                                                                             | unique (userId, productId)                                                         |
| `coupons`    | code, type, value, minOrder, maxDiscount, startsAt, expiresAt, maxUses, usedCount, isActive                                                                                                    | code unique                                                                        |

**Implemented:** `users`, `categories`, `products`, `carts`, `wishlists`,
`addresses`, `orders`, `payments`, `coupons`, `reviews`.

## 6. API surface

Planned endpoints and conventions: [docs/api-contract.md](docs/api-contract.md).
Marked complete here as each phase lands.

**Implemented:** `/health` (Phase 1); `/auth/register`, `/auth/login`,
`/auth/refresh`, `/auth/logout`, `/auth/me`, `/admin/ping` (Phase 2);
`GET /categories`, `GET /categories/:slug`, category admin CRUD,
`GET /products`, `GET /products/:slug`, product admin CRUD, and
`PATCH /products/:id/stock` (Phase 3); `GET /users/me`, `PATCH /users/me`,
`PATCH /users/me/password` (Phase 5); `GET /cart`, `POST /cart/items`,
`PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart`,
`GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId`
(Phase 6); `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`,
`PATCH /addresses/:id/default`, `DELETE /addresses/:id`, `POST /orders/quote`,
`POST /orders`, `GET /orders`, `GET /orders/:id` (Phase 7); `POST /payments/start`,
`POST /payments/verify`, `POST /payments/abandon`, `POST /payments/mock/complete`,
`POST /payments/webhook` (Phase 8); `PATCH /orders/:id/cancel`,
`GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`
(Phase 9); `POST /coupons/validate`, `GET /coupons`, `POST /coupons`,
`PATCH /coupons/:id`, `DELETE /coupons/:id`, `GET /admin/stats`,
`GET /admin/customers`, `GET /admin/customers/:id`,
`PATCH /admin/customers/:id/status`, `POST /admin/uploads/product-image`
(Phase 10); `GET /products/:slug/reviews`, `POST /products/:id/reviews`,
`PATCH /reviews/:id` (Phase 11).

**Client routes:** `/` (public), `/products`, `/products/:slug`,
`/categories/:slug`, `/login`, `/register`, `/cart`, `/wishlist`, `/addresses`,
`/checkout`, `/orders`, `/orders/:id` and `/account` (signed in), `/admin`,
`/admin/orders`, `/admin/orders/:id`, `/admin/products`, `/admin/categories`,
`/admin/customers` and `/admin/coupons` (admin), `*` (404). The order detail
page owns the payment panel, timeline, tracking card and cancellation. Catalogue
filters are URL-driven (`q`, `category`, `min`, `max`, `rating`, `inStock`,
`sort`, `page`); admin order filters use `?status` and `?page`; coupon and
customer lists use `?search`, `?active`/`?status`, `?page` and `?limit`.

## 7. Environment

| Item         | Value                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS           | Windows 10 x64, Git Bash                                                                                                                                                |
| Node         | v22.14.0 via nvm4w (`.nvmrc`)                                                                                                                                           |
| npm          | 10.9.2                                                                                                                                                                  |
| MongoDB      | 8.2 local, `mongodb://127.0.0.1:27017/ecommerce_dev`                                                                                                                    |
| API (dev)    | http://localhost:5000/api/v1                                                                                                                                            |
| Client (dev) | http://localhost:5173, `VITE_API_URL` (default `http://localhost:5000/api/v1`)                                                                                          |
| CORS         | `CORS_ORIGIN=http://localhost:5173`, credentials enabled                                                                                                                |
| Auth env     | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (32+ chars, different), `JWT_ACCESS_TTL_SECONDS=900`, `JWT_REFRESH_TTL_SECONDS=604800`, `BCRYPT_ROUNDS=12`                    |
| Payment env  | `PAYMENT_MODE=mock` locally; `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`; production requires `razorpay` mode and a key id                      |
| Upload env   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (default `ecommerce-platform`); uploads return `503` when unset             |
| Rate limits  | `RATE_LIMIT_WINDOW_MINUTES=15`, `RATE_LIMIT_MAX=300`, `AUTH_RATE_LIMIT_MAX=30`                                                                                          |
| Infra env    | `LOG_LEVEL=info`, `CACHE_DRIVER=memory`, `CACHE_TTL_SECONDS=60`, `QUEUE_DRIVER=memory`, `MAIL_DRIVER=log`, `MAIL_FROM`; `REDIS_URL` for redis/bullmq, `SMTP_*` for smtp |
| Deployment   | `TRUST_PROXY=1` behind Render, `COOKIE_SAMESITE=none` for cross-site hosting, optional `COOKIE_DOMAIN`; production rejects http/localhost CORS origins                  |
| CI           | `.github/workflows/ci.yml` — server (MongoDB 7 service) and client jobs: install, typecheck, lint, format check, test, build                                            |
| Live hosts   | Not provisioned; `render.yaml` + `client/vercel.json` + `docs/deployment.md` hold the configuration; requires the owner's accounts                                      |
| Test DB      | `mongodb://127.0.0.1:27017/ecommerce_test` (set by `server/tests/setup.ts`, dropped after the suite)                                                                    |
| Admin seed   | `npm run seed:admin -- <email> <password> [name]`                                                                                                                       |
| Catalog seed | `npm run seed:catalog` (idempotent)                                                                                                                                     |
| VS Code      | 1.139.1                                                                                                                                                                 |
| GitHub CLI   | 2.103.3, authenticated as `Owais101074` (keyring)                                                                                                                       |
| GitHub repo  | `ecommerce-platform`, public, default branch `main`                                                                                                                     |
| Docker       | not installed; `Dockerfile` and `docker-compose.yml` added in Phase 12 but not runtime-verified locally                                                                 |
| Redis        | not installed; cache/queue default to in-process drivers                                                                                                                |

## 8. Installed dependencies

**server — runtime:** express 5, mongoose 9, dotenv 18, zod 4, cors 2,
bcryptjs 3, jsonwebtoken 9, cookie-parser 1, helmet 8, express-rate-limit 8,
ioredis 6, bullmq 6, nodemailer 10.
**server — dev:** typescript 6, tsx 4, eslint 10, typescript-eslint 8,
eslint-config-prettier 10, prettier 3, vitest 5, supertest 7, `@types/*` (incl.
jsonwebtoken, cookie-parser, supertest, nodemailer).
**client — runtime:** react 19, react-dom 19, react-router-dom 7, @tanstack/react-query 5,
axios 1, lucide-react.
**client — dev:** vite 8, @vitejs/plugin-react 6, typescript 6, tailwindcss 4,
@tailwindcss/vite 4, eslint 10, typescript-eslint 8, eslint-plugin-react-hooks 7,
eslint-plugin-react-refresh, globals, eslint-config-prettier, prettier 3, vitest 5,
jsdom, @testing-library/react, @testing-library/jest-dom, `@types/*`.

## 9. Phase checklists

### Phase 0 — Planning and Architecture

- [x] Inspect environment and tool versions
- [x] Choose monorepo structure
- [x] Approve architecture and technical decisions
- [x] Define folder structure
- [x] Design database collections
- [x] Design API contract
- [x] Create GitHub repository `ecommerce-platform` (public)
- [x] Initial commit `53b113e` and push to `origin/main`
- [x] Close Phase 0 review

### Phase 1 — Backend Foundation

- [x] Express 5 + TypeScript scaffold with strict compiler options
- [x] ESLint 10 flat config + Prettier
- [x] Zod-validated environment configuration (fail fast at startup)
- [x] MongoDB connection with lifecycle logging and 5s selection timeout
- [x] Central `ApiError` + error middleware (Zod, Mongoose, duplicate key, bad JSON)
- [x] `notFound` handler and 10kb JSON body limit
- [x] Graceful shutdown on SIGINT/SIGTERM with 10s force exit
- [x] `GET /api/v1/health` reporting database state
- [x] `typecheck`, `lint`, and `build` pass
- [x] Live checks: 200 health, 404 unknown route, 400 invalid JSON
- [x] Close Phase 1 review

### Phase 2 — Authentication and Authorization

- [x] `users` collection: unique lowercase email, bcrypt hash, role enum,
      `isActive`, hashed refresh token + expiry, timestamps
- [x] Zod register/login schemas and reusable `validate` middleware
- [x] bcryptjs hashing (cost from `BCRYPT_ROUNDS`, default 12)
- [x] Access token (15 min, Bearer) and refresh token (7 days, httpOnly cookie)
- [x] Refresh rotation with hashed storage and reuse detection
- [x] `authenticate` middleware: token verification, user lookup, inactive check
- [x] `authorize(...roles)` middleware with `customer` / `admin`
- [x] `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
      `POST /auth/logout`, `GET /auth/me`
- [x] `GET /admin/ping` as an RBAC smoke route
- [x] `npm run seed:admin -- <email> <password> [name]`
- [x] `typecheck`, `lint`, and `build` pass
- [x] 18 live checks pass (register, duplicate, validation, login failure,
      me, missing/invalid token, token type confusion, RBAC deny/allow,
      refresh rotation, reuse detection, logout revocation)
- [x] Close Phase 2 review

### Phase 3 — Product and Category Management

- [x] `categories` collection: unique slug, optional parent, description,
      active flag; self-referencing tree
- [x] Category admin CRUD with slug generation, cycle prevention, and delete
      guards for active children/products
- [x] `products` collection: unique slug, price in paise, category reference,
      URL images, stock, rating aggregates
- [x] Indexes: slug unique, `(categoryId, price)`, `createdAt`, text index on
      name/description
- [x] Product admin CRUD plus `PATCH /:id/stock`
- [x] Public listing with text search, category, price range, rating, in-stock,
      sorting, and pagination metadata
- [x] Query validation (unknown sort, `minPrice > maxPrice`, bad numbers → 400)
- [x] `seed:catalog` idempotent sample data script
- [x] `typecheck`, `lint`, `format:check`, and `build` pass
- [x] 34 live checks pass (RBAC, CRUD, slug suffixes, tree, cycle, filters,
      sorting, pagination, search, soft delete, delete guards)
- [x] Close Phase 3 review

### Phase 4 — React Frontend Foundation

- [x] Vite 8 + React 19 + TypeScript 6 scaffold with strict compiler options
- [x] Tailwind CSS 4 via `@tailwindcss/vite`, `@theme` design tokens, base layer
- [x] ESLint 10 flat config + Prettier and the `@/` path alias
- [x] Axios instance: env base URL, `withCredentials`, Bearer request header
- [x] Single-flight 401 refresh with one retry; shared `ApiError` and field errors
- [x] TanStack Query client defaults (stale time, no 4xx retries)
- [x] `AuthProvider`: session bootstrap, login, register, logout, cache clearing
- [x] `RequireAuth` and `RequireAdmin` guards with redirect-back after login
- [x] App shell: responsive header, mobile menu, footer, container
- [x] UI kit plus loading, error, empty and 404 states
- [x] Home, login, register, account, admin and route-error pages
- [x] `typecheck`, `lint`, `format:check`, and `build` pass
- [x] Browser checks: live home data, register, reload restore, logout, guarded
      redirect, login return, wrong password, customer vs admin, 404, and silent
      refresh after expiry
- [x] UI refresh: warm editorial tokens, Fraunces + Plus Jakarta Sans, lucide icons
- [x] UI refresh: announcement bar, sticky header, accessible mobile menu, branded
      footer, `ScrollManager`, and auth-aware footer links
- [x] UI refresh: full-screen split `AuthLayout` for `/login` and `/register`
- [x] UI refresh: shared `BrandMark`, `PasswordInput`, `SectionHeading`; refreshed
      Home, Account, Admin, 404 and route-error pages
- [x] UI refresh: curated Unsplash product photos in `seed:catalog` and the dev DB
- [x] UI refresh: browser re-check of auth, admin, 404 and footer states;
      typecheck, lint and build pass
- [x] Close Phase 4 review

### Phase 5 — Customer Shopping Experience

- [x] `users` module: `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password`
- [x] Profile name validation (2–50) and refreshed user DTO
- [x] Password change verifies the current password, rejects the old password,
      re-hashes, revokes the refresh session and clears the cookie
- [x] Catalogue `/products`: URL-driven search, department, price, rating and
      in-stock filters, sort, filter chips, result count and pagination
- [x] Product detail `/products/:slug`: gallery, breadcrumbs, stock, price,
      rating summary, service notes and related products
- [x] Department `/categories/:slug`: hero, child departments, sort and pagination
- [x] Shared `Select`, `Pagination`, `Breadcrumbs`, `StockBadge`; `useProduct`
      and `useCategory` hooks
- [x] Account page: editable name, read-only email, password change, re-login
      notice forwarded through the route guard
- [x] Header, home CTAs and catalogue cards link into the new routes
- [x] Server live checks for profile, password and session revocation
- [x] Browser checks for listing, filters, search, detail, department,
      profile update and password change; no React console errors
- [x] `typecheck`, `lint`, `format:check`, and `build` pass for both apps
- [x] Close Phase 5 review

### Phase 6 — Cart and Wishlist

- [x] `carts` collection: one cart per user (`userId` unique), embedded items
      with `productId`, `quantity` and `priceAtAdd` in integer paise
- [x] Cart endpoints: `GET /cart`, `POST /cart/items`,
      `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`,
      `DELETE /cart`
- [x] `cart.mapper.ts` computes `lineTotal`, `itemCount`, `subtotal`,
      `currentSubtotal` and `priceChanged`; missing/inactive products filtered
- [x] Cart rules: quantity 1–10, stock checks on add and update, out-of-stock
      and unavailable-product conflicts, 404 for missing lines
- [x] `wishlists` collection with `$addToSet` / `$pull` and active-only listing
- [x] Wishlist endpoints: `GET /wishlist`, `POST /wishlist/:productId`,
      `DELETE /wishlist/:productId`
- [x] Shared `loadProductDTOs` in the product service for cart and wishlist
- [x] Client data layer: `useCart`, `useCartCount`, `useWishlist`,
      `useWishlistCount`, cache-updating mutations, optimistic wishlist toggle
- [x] Toast provider for mutation feedback
- [x] `QuantityStepper`, `AddToCartButton`, `WishlistButton`, `ProductActions`;
      wired into product cards and the product detail purchase panel
- [x] `/cart` page: rows with snapshot and current price, stock warnings,
      quantity stepper, line totals, two-step clear, sticky summary
- [x] `/wishlist` page with empty/loading/error states
- [x] Header cart/wishlist icons with live counts; auth-aware footer links
- [x] Route guards redirect guests from `/cart` and `/wishlist` to login
- [x] Server live checks: auth required, add/increment/update/remove/clear,
      quantity and stock conflicts, out-of-stock, idempotent wishlist add/remove
- [x] Browser checks: add from card and detail, quantity 3, clear cart, wishlist
      save/remove, guest redirect, price-change banner with snapshot restoration,
      no React console errors
- [x] `typecheck`, `lint`, `format:check`, and `build` pass for both apps
- [x] Close Phase 6 review

### Phase 7 — Checkout and Address Management

- [x] `addresses` collection scoped by `userId`: label, full name, phone, line1,
      line2, city, state, pincode, `isDefault`, timestamps
- [x] Address endpoints: `GET /addresses`, `POST /addresses`,
      `PATCH /addresses/:id`, `PATCH /addresses/:id/default`,
      `DELETE /addresses/:id`
- [x] Address rules: first address auto-default, one default enforced, the only
      address cannot lose default status, deleting the default promotes the
      oldest remaining address
- [x] `orders` collection with unique order number, item snapshots, address
      snapshot, integer pricing fields, order status and payment status
- [x] `order.pricing.ts`: discounted subtotal, GST-inclusive tax at 18%, free
      shipping from ₹999, ₹49 below it
- [x] `POST /orders/quote` with `itemCount`, `couponCode` and `priceChanged`
- [x] `POST /orders` recomputes pricing, snapshots cart and address, decrements
      stock conditionally with rollback, clears the cart
- [x] `GET /orders` with pagination and `GET /orders/:id`, both owner-scoped
- [x] Coupon hook rejects supplied codes until Phase 10
- [x] Client address API, order API, types and TanStack Query hooks with cache
      writes
- [x] `/addresses` inline add/edit form, default switch, two-step delete
- [x] `/checkout` address selection, inline creation, quote summary, disabled
      submit until ready
- [x] `/orders` history with pagination and `/orders/:id` detail with snapshots
- [x] Cart checkout link, account/footer links, route guards for new pages
- [x] Server live checks (46): address invariants, quote maths, order creation,
      snapshots, cart clearing, stock decrement, ownership, empty-cart rejection
- [x] Browser checks: address CRUD/default, checkout quote, order placement,
      history, empty-cart state, guest redirects, no console errors
- [x] `typecheck`, `lint`, `format:check`, and `build` pass for both apps
- [x] Close Phase 7 review

### Phase 8 — Payment Integration

- [x] Env: `PAYMENT_MODE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
      `RAZORPAY_WEBHOOK_SECRET`; production must use `razorpay` with a key id
- [x] `payments` collection: unique `orderId`, provider ids, amount, status,
      failure reason, attempts and raw payload
- [x] Provider module: Razorpay Orders REST with Basic auth via `fetch`, mock
      provider for local dev, HMAC-SHA256 signatures with `timingSafeEqual`
- [x] `POST /payments/start` idempotent while an attempt is open; paid orders `409`
- [x] `POST /payments/verify` verifies `<orderId>|<paymentId>`, marks the payment
      paid and a `placed` order confirmed
- [x] `POST /payments/abandon` records a failed attempt; retry increments attempts
- [x] `POST /payments/mock/complete` returns signed credentials or a simulated
      failure in mock mode only
- [x] `POST /payments/webhook` mounted with `express.raw()` before JSON parsing,
      signature checked, amount verified, unknown orders acknowledged
- [x] Client payment types, API, hooks, Razorpay Checkout.js loader and
      `PaymentPanel` with pay, retry, mock outcomes and abandon
- [x] Order/checkout copy updated for the live payment step
- [x] Server live checks (60): idempotency, signatures, ownership, failure,
      retry, abandon, webhook rejection and idempotent replay
- [x] Browser checks: pay via mock success, paid/confirmed UI, failed + retry,
      cancelled attempt, no React console errors
- [x] `typecheck`, `lint`, `format:check`, and `build` pass for both apps
- [x] Close Phase 8 review

### Phase 9 — Order Management

- [x] Lifecycle map `placed → confirmed → shipped → delivered` plus `cancelled`,
      with `statusHistory[]` events `{ status, at, note }`
- [x] `tracking` `{ carrier, trackingNumber, updatedAt }`, required for shipping
- [x] `PATCH /orders/:id/cancel`: owner-scoped, `placed`/`confirmed` only,
      conditional update, idempotent repeat, per-line stock restore
- [x] Paid cancellation refunds through the provider; `refund_pending` claim,
      `refunded` on success, reset to `paid` on gateway failure
- [x] Payment document gains `refundId` and `refundedAt`; order payment status
      becomes `refunded`
- [x] Late payment on a cancelled order is refunded automatically
- [x] Admin `GET /admin/orders` with pagination, `status` and `userId` filters,
      customer summaries via one batched user query
- [x] Admin `GET /admin/orders/:id` and `PATCH /admin/orders/:id/status` with
      transition, paid-confirmation and tracking validation
- [x] Client `OrderTimeline`, `OrderTrackingCard`, `CancelOrderCard` and
      `AdminOrderActions` wired into customer and admin order pages
- [x] `/admin/orders` table with filter chips, pagination and customer columns;
      `/admin/orders/:id` with actions, timeline, tracking and totals
- [x] Server live checks (66): cancellation boundaries, stock restore, refund
      state machine, late-payment refund, admin filters and transition guards
- [x] Browser checks: unpaid and paid cancellation, refunded badge, admin list
      filters, ship with tracking, deliver, no console errors
- [x] `typecheck`, `lint`, `format:check`, and `build` pass for both apps
- [ ] Close Phase 9 review

### Phase 10 — Admin Dashboard

- [x] `coupons` collection with unique uppercase codes, percentage/fixed values
      in paise, minimum order, max discount, start/expiry window, usage limit,
      usage counter and active flag
- [x] `POST /coupons/validate` prices a code against the cart; admin list,
      create, update and soft-deactive endpoints with duplicate `409`s
- [x] Checkout quote and `POST /orders` accept `couponCode`; usage claimed with a
      conditional `$inc`, released on failed placement and cancellation
- [x] `GET /admin/stats` with paid revenue (total/30 days/today), status counts,
      customer/product counters, seven-day sales, top products, low stock and
      recent orders
- [x] Admin customer list/detail with order count and paid lifetime spend;
      `PATCH /admin/customers/:id/status` deactivates and revokes the session
- [x] `POST /admin/uploads/product-image` with 5 MB memory upload,
      JPEG/PNG/WebP validation, server-signed Cloudinary request and `503` when
      unconfigured
- [x] `AdminLayout` plus dashboard, products, categories, customers and coupons
      pages; catalogue writes reuse the existing admin CRUD
- [x] Checkout coupon card with apply, remove, live quote refresh and error
      recovery
- [x] Server live checks (44): coupon lifecycle, discount math, usage
      claim/release, expiry/window/limit/min-order rejections, admin statistics,
      customer deactivation, catalogue writes and upload validation
- [x] Browser checks: dashboard data, coupon form/toggle, customer detail,
      checkout apply/remove totals, no React console errors
- [x] `typecheck`, `lint`, `format:check`, and `build` pass for both apps
- [ ] Close Phase 10 review

### Phase 11 — Testing and Security

- [x] `reviews` collection with a unique `(userId, productId)` index and a
      product/date listing index
- [x] Public paginated review list with rating summary; authenticated create;
      owner-only edit; duplicate review `409`
- [x] Product `ratingAvg` / `ratingCount` recomputed with an aggregation on every
      review write
- [x] Product page review UI: summary, paginated list, create/edit form and guest
      sign-in prompt
- [x] Helmet headers, disabled `x-powered-by`, strict CORS allowlist and
      `X-CSRF-Token` in allowed headers
- [x] Rate limiting: 300 requests per 15 minutes for `/api/v1`, 30 for login and
      register, all environment-configurable
- [x] Double-submit CSRF on `/auth/refresh` and `/auth/logout` with timing-safe
      comparison; client echoes the readable `csrfToken` cookie
- [x] `tokenVersion` in access tokens; password change increments it and rejects
      every older token
- [x] JSON `413` for oversized payloads
- [x] Server test infrastructure (Vitest + Supertest, real `ecommerce_test` DB,
      serial files, shared auth/factory helpers) and 41 tests across pricing,
      coupons, auth, security, orders and reviews
- [x] Client test infrastructure (Vitest + jsdom + Testing Library) and 12 tests
      across format helpers, `Button` and route guards
- [x] Server and client `typecheck`, `lint`, `format:check` and `build` pass
- [x] Live API checks for headers, CORS, rate-limit headers, CSRF `403`, `413`
      and reviews; browser checks for guest and authenticated review flows
- [ ] Close Phase 11 review

### Phase 12 — Advanced Backend Engineering

- [x] Structured JSON logger with levels, child bindings and Error serialisation
- [x] Request correlation through `X-Request-Id` and `AsyncLocalStorage`, with
      the id carried into queued jobs
- [x] Driver-based cache (`memory`/`redis`/`none`) with read-through product,
      category and detail caching plus TTL and failure fallback
- [x] Cache invalidation for product, category, review-rating and order stock
      writes
- [x] Driver-based queue (`memory`/`bullmq`/`none`) with BullMQ retries and
      exponential backoff
- [x] Email templates and driver-based delivery (`log` outbox, SMTP, none)
- [x] Order notifications for placed, confirmed, shipped, delivered and
      cancelled, with idempotent payment confirmation
- [x] Health endpoint reports active infrastructure drivers
- [x] Index review and `npm run perf:indexes` before/after explain benchmark
- [x] Multi-stage `Dockerfile`, `.dockerignore` and Compose services for API,
      MongoDB and Redis
- [x] Server tests for request correlation, cache invalidation and notification
      idempotency (49 tests across 8 files)
- [x] Server `typecheck`, `lint`, `format:check`, `build` and live API check
- [ ] Close Phase 12 review

### Phase 13 — Deployment and CI/CD

- [x] `TRUST_PROXY`, `COOKIE_SAMESITE` and `COOKIE_DOMAIN` environment settings
- [x] Production startup guards: HTTPS-only non-localhost CORS, `SameSite=None`
      only with `NODE_ENV=production`
- [x] Shared cookie options; `Secure` always on in production
- [x] `GET /api/v1/health/live` liveness probe beside the readiness `/health`
- [x] `render.yaml` API blueprint with `sync: false` secrets
- [x] `client/vercel.json` with SPA rewrites and static security headers
- [x] GitHub Actions CI for server (MongoDB 7 service) and client
- [x] Deployment tests for liveness/readiness, CSRF preflight and cookie flags
      (53 tests across 9 files)
- [x] `docs/deployment.md` runbook: Atlas, Redis, Render, Vercel, webhook,
      cookies/CORS, smoke tests, rollback, troubleshooting
- [x] Server and client `typecheck`, `lint`, `format:check`, `build`, tests
- [x] Production-mode live check of cookie flags, CORS, health and request id
- [ ] Provision live hosts and record public URLs (needs owner accounts)
- [ ] Close Phase 13 review

**Scope note:** `server/` was initialized at the start of Phase 1 and `client/`
at the start of Phase 4, so tooling is configured once, in context, instead of
twice.

## 10. Pending tasks

| Phase | Task                                                                       | Status                   |
| ----- | -------------------------------------------------------------------------- | ------------------------ |
| 0     | GitHub repo + first push                                                   | done                     |
| 1     | Express + TS scaffold, env config, DB connect, error middleware, `/health` | done                     |
| 2     | Auth module, JWT, roles, protected routes                                  | done                     |
| 3     | Category + product CRUD, search/filter/sort/pagination, seed script        | done                     |
| 4     | Vite + React + Tailwind + Router + Query scaffold                          | done                     |
| 4     | Storefront UI refresh (design system, shell, auth layout, pages)           | done                     |
| 5     | Catalogue listing, product detail, department pages, profile + password UI | done                     |
| 6     | Cart + wishlist                                                            | done                     |
| 7     | Addresses, checkout quote, orders, order history/detail                    | done                     |
| 8     | Razorpay integration, signature verification, webhook, failure/abandon     | done                     |
| 9     | Order lifecycle + cancellation/refund                                      | done                     |
| 10    | Admin dashboard, coupons and Cloudinary uploads                            | done                     |
| 11    | Reviews, security hardening and test suites                                | done                     |
| 12    | Redis cache, jobs, email, logging, indexes, Docker                         | done                     |
| 13    | Deployment config + GitHub Actions                                         | done                     |
| 13    | Provision Atlas/Redis/Render/Vercel and publish public URLs                | pending (owner accounts) |

## 11. Known bugs

None.

## 12. Conventions

- Branches: `main` stays deployable; work happens on `feat/<scope>` branches.
- Commits: Conventional Commits, e.g. `feat(auth): add refresh token rotation`.
- Every phase ends with: typecheck → lint → tests → docs update → commit → push.
- Never commit `.env` files or secrets.
- Update this file at the end of every phase, no exceptions.
