# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Phase 0** — environment audit (Node, npm, Git, VS Code, MongoDB, GitHub CLI).
- **Phase 0** — monorepo layout with `client/` and `server/` workspaces.
- **Phase 0** — `PROJECT_CONTEXT.md` for cross-session continuity.
- **Phase 0** — planned API contract in `docs/api-contract.md`.
- **Phase 0** — root tooling files: `.gitignore`, `.gitattributes`, `.nvmrc`.
- **Phase 0** — public GitHub repository created at
  https://github.com/Owais101074/ecommerce-platform and initial commit pushed.
- **Phase 1** — Express 5 + TypeScript server foundation with strict compiler
  options and `nodenext` resolution.
- **Phase 1** — Zod-validated environment config that exits on invalid values.
- **Phase 1** — Mongoose connection with lifecycle logging and graceful shutdown.
- **Phase 1** — central `ApiError` and error middleware handling Zod, Mongoose
  validation/cast, duplicate-key, and malformed-JSON errors.
- **Phase 1** — `GET /api/v1/health` reporting uptime and database state.
- **Phase 1** — ESLint 10 flat config and Prettier.
- **Phase 2** — `users` collection with unique lowercase email, bcrypt hash,
  role, active flag, and hashed refresh token storage.
- **Phase 2** — registration and login with Zod validation and generic
  credential errors.
- **Phase 2** — JWT access tokens (15 min) plus httpOnly refresh cookies
  (7 days) with rotation and reuse detection.
- **Phase 2** — `authenticate` and `authorize(...roles)` middleware and
  `Request.user` type augmentation.
- **Phase 2** — `POST /auth/register`, `/auth/login`, `/auth/refresh`,
  `/auth/logout`, `GET /auth/me`, and admin-only `GET /admin/ping`.
- **Phase 2** — `npm run seed:admin` script to create or promote an admin.
- **Phase 2** — auth environment variables validated at startup; access and
  refresh secrets must be at least 32 characters and different.
- **Phase 3** — `categories` collection with unique slug, optional parent,
  description, active flag, and a self-referencing tree.
- **Phase 3** — category admin CRUD with unique slug suffixes, hierarchy cycle
  prevention, and delete guards for active children or products.
- **Phase 3** — `products` collection with paise pricing, category reference,
  URL images, stock, ratings, soft delete, and catalogue indexes.
- **Phase 3** — product admin CRUD and `PATCH /products/:id/stock`.
- **Phase 3** — public product search, category and price filters, rating and
  in-stock filters, sorting, and pagination metadata.
- **Phase 3** — query validation for filters, including `minPrice > maxPrice`
  and unknown sort values.
- **Phase 3** — idempotent `seed:catalog` script with three categories and six
  products.
- **Phase 4** — Vite 8 + React 19 + TypeScript 6 client with Tailwind CSS 4,
  React Router 7, TanStack Query 5, and Axios.
- **Phase 4** — typed API layer: shared response types, Axios instance with
  credentials, Bearer injection, single-flight 401 refresh, and one
  `ApiError` shape for the UI.
- **Phase 4** — `AuthProvider` that restores the session from the refresh
  cookie on load, exposes login/register/logout, and clears cached queries on
  sign out.
- **Phase 4** — route guards for signed-in (`/account`) and admin (`/admin`)
  pages, with redirect-back after login.
- **Phase 4** — app shell with responsive header, mobile navigation, footer,
  sealed container, and a small UI kit (button, input, alert, badge, spinner,
  skeleton, error state, page loader).
- **Phase 4** — Home page with hero, live catalogue counters, category tiles,
  and newest-product previews including loading and error states.
- **Phase 4** — Login and register forms with client validation, server field
  errors, and disabled/loading submit states.
- **Phase 4** — Account page showing profile and how the session works, plus
  an admin-only connectivity check.
- **UI refresh** — warm editorial design system: cream and paper surfaces,
  forest-green brand, terracotta accent, Fraunces display type and Plus Jakarta
  Sans body type, shared shadows, motion and skeleton tokens.
- **UI refresh** — new shared primitives (`BrandMark`, `PasswordInput`,
  `SectionHeading`) plus refreshed buttons, badges, inputs, alerts, loaders and
  error states.
- **UI refresh** — storefront shell with announcement bar, sticky cream header,
  accessible mobile menu, branded footer, and a `ScrollManager` for hash anchors
  and scroll-to-top navigation.
- **UI refresh** — full-screen split `AuthLayout` for `/login` and `/register`,
  with the session model explained alongside the form.
- **UI refresh** — redesigned Home, Account, Admin, 404 and route-error pages,
  using live catalogue data with loading, error and empty states.
- **UI refresh** — lucide-react icons across the shell and forms.
- **UI refresh** — curated Unsplash product photos in `seed:catalog`, and the
  same URLs applied to the six existing development products.
- **Phase 5** — `users` module with `GET /users/me`, `PATCH /users/me` and
  `PATCH /users/me/password`, all behind the access-token guard.
- **Phase 5** — profile updates validate the name (2–50 characters) and return
  the refreshed user DTO.
- **Phase 5** — password change verifies the current password, rejects reuse of
  the old password, re-hashes with bcrypt, clears the stored refresh hash and
  expiry, and clears the refresh cookie.
- **Phase 5** — catalogue page at `/products` with URL-driven search, department,
  price, rating, in-stock and sort filters, removable filter chips, result
  counts, empty/error/skeleton states and pagination.
- **Phase 5** — product detail page at `/products/:slug` with an image gallery,
  breadcrumbs, stock, exact price, rating summary, service notes and related
  products from the same department.
- **Phase 5** — department page at `/categories/:slug` with a hero, child
  departments, sort control, product grid and pagination.
- **Phase 5** — account page now edits the profile name (read-only email) and
  changes the password, then signs out with a notice on the login page.
- **Phase 5** — shared `Select`, `Pagination`, `Breadcrumbs` and `StockBadge`
  primitives, plus `useProduct` and `useCategory` query hooks.
- **Phase 5** — header, home CTAs, category cards and product cards now link into
  the catalogue, product and department routes.
- **Phase 6** — `carts` collection with one cart per user and embedded
  `{ productId, quantity, priceAtAdd }` items.
- **Phase 6** — cart endpoints: `GET /cart`, `POST /cart/items`,
  `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`,
  `DELETE /cart`; every response returns server-computed totals.
- **Phase 6** — price-at-add snapshots in integer paise plus a `currentSubtotal`
  and `priceChanged` flag when catalogue prices move.
- **Phase 6** — cart rules: max 10 units per line, stock checks on add and update,
  inactive products filtered out, and clear 404/409 conflicts.
- **Phase 6** — `wishlists` collection with one document per user and
  `$addToSet` / `$pull` operations for idempotent add and remove.
- **Phase 6** — wishlist endpoints: `GET /wishlist`, `POST /wishlist/:productId`,
  `DELETE /wishlist/:productId`.
- **Phase 6** — client data layer: `useCart`, `useCartCount`, `useWishlist`,
  `useWishlistCount` and mutations that update the TanStack Query cache.
- **Phase 6** — optimistic wishlist toggles with rollback on failure.
- **Phase 6** — toast provider for success and error feedback.
- **Phase 6** — `QuantityStepper`, `AddToCartButton`, `WishlistButton` and
  `ProductActions` primitives, wired into product cards and the detail page.
- **Phase 6** — `/cart` and `/wishlist` pages behind `RequireAuth`, with empty,
  loading, error, price-change, stock-warning and two-step clear states.
- **Phase 6** — header cart/wishlist icons with live counts; both routes added
  to the authenticated footer links.
- **Phase 7** — `addresses` collection scoped by `userId`, with label, contact,
  address lines, pincode and an `isDefault` flag; compound index on
  `(userId, createdAt)`.
- **Phase 7** — address endpoints `GET /addresses`, `POST /addresses`,
  `PATCH /addresses/:id`, `PATCH /addresses/:id/default`, `DELETE /addresses/:id`.
- **Phase 7** — address rules: the first address becomes default automatically,
  only one default can exist, the only address cannot lose default status, and
  deleting the default promotes the oldest remaining address.
- **Phase 7** — `orders` collection with unique `ORD-YYYYMMDD-XXXXXX` numbers,
  item snapshots (`name`, `slug`, `image`, `price`, `quantity`, `lineTotal`),
  a delivery address snapshot, integer pricing fields, order status and payment
  status.
- **Phase 7** — `order.pricing.ts` computes discounted subtotal, GST-inclusive
  tax (`round(subtotal × 18 / 118)`), free shipping at ₹999 (99,900 paise) and
  ₹49 (4,900 paise) below it, all in integer paise.
- **Phase 7** — `POST /orders/quote` returns a server-computed checkout quote
  plus `itemCount`, `couponCode` and a `priceChanged` flag.
- **Phase 7** — `POST /orders` re-reads the cart, validates ownership of the
  address, computes pricing again, snapshots items and address, decrements stock
  with conditional updates, rolls back earlier decrements on failure, creates the
  order and clears the cart.
- **Phase 7** — `GET /orders` paginated own-order history and `GET /orders/:id`
  ownership-scoped detail.
- **Phase 7** — coupon hook rejects supplied codes with a clear `400` until full
  coupon management lands in Phase 10.
- **Phase 7** — client data layer: address and order API files, typed models,
  `useAddresses` with cache-writing mutations, `useOrders`, `useOrder`,
  `useCheckoutQuote` and `usePlaceOrder` (clears the cart cache on success).
- **Phase 7** — `/addresses` with inline add/edit form, label selection, digit
  filtering, default handling, two-step delete and default promotion feedback.
- **Phase 7** — `/checkout` with saved-address selection, inline address
  creation, delivery summary, server quote (subtotal, shipping, discount, GST,
  total), price-change warning and disabled submit until an address and quote
  exist.
- **Phase 7** — `/orders` history with pagination and status badges, and
  `/orders/:id` detail with the just-placed notice, item snapshots, address
  snapshot, status cards and payment summary.
- **Phase 7** — checkout link from the cart, order/address links in the account
  page and authenticated footer, and `RequireAuth` guards on all new routes.
- **Phase 8** — `PAYMENT_MODE` (`mock` | `razorpay`), `RAZORPAY_KEY_ID`,
  `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` env validation; production
  must use `razorpay` and supply a key id.
- **Phase 8** — `payments` collection with a unique `orderId` (one payment per
  order), provider order/payment ids, integer paise amount, status, failure
  reason, attempt count and the raw gateway payload.
- **Phase 8** — `payment.provider.ts` calls the Razorpay Orders REST API with
  Basic auth through Node `fetch` (no SDK), validates the echoed amount and
  currency, and provides HMAC-SHA256 payment/webhook signatures with
  `timingSafeEqual` comparisons.
- **Phase 8** — local `mock` provider generates `order_mock_*` ids but signs and
  verifies a real HMAC, so the client always exercises the real
  `POST /payments/verify` path.
- **Phase 8** — `POST /payments/start` (idempotent while an attempt is open),
  `POST /payments/verify`, `POST /payments/abandon`, `POST /payments/mock/complete`
  and the public signed `POST /payments/webhook`.
- **Phase 8** — webhook middleware mounts `express.raw()` before `express.json()`
  so the signature is checked over the exact bytes; unknown orders and amount
  mismatches are acknowledged without changing state.
- **Phase 8** — a verified payment sets `paymentStatus: paid` and moves a
  `placed` order to `confirmed`; failed, declined or abandoned attempts set
  `paymentStatus: failed`. Retrying starts a new gateway order and increments
  `attempts`. Paid orders reject new attempts with `409`.
- **Phase 8** — client payment types, API file and TanStack Query hooks; the
  order detail page gains a `PaymentPanel` with Razorpay Checkout.js loaded on
  demand, mock success/failure controls, retry after failure, abandonment on
  modal dismiss and automatic order-query invalidation.
- **Phase 8** — copy updated so checkout and order pages describe the real
  payment step instead of deferring it to a later phase.
- **Phase 9** — order lifecycle `placed → confirmed → shipped → delivered`
  plus `cancelled`, backed by a server-owned transition map and a
  `statusHistory[]` of `{ status, at, note }` events.
- **Phase 9** — `tracking` on the order stores `{ carrier, trackingNumber,
updatedAt }`; cancelling clears it and the detail page renders it.
- **Phase 9** — `PATCH /orders/:id/cancel`: owner-scoped, allowed only for
  `placed` and `confirmed`, conditional update so concurrent cancels cannot
  double-restore stock, idempotent repeat cancel, stock restored per line.
- **Phase 9** — paid-order cancellation triggers a provider refund through the
  Razorpay Refunds REST API (or `rfnd_mock_*` in mock mode). The payment
  atomically claims `paid → refund_pending → refunded`, resets to `paid` on
  gateway failure, and repeat cancels retry a pending refund.
- **Phase 9** — payment statuses gain `refund_pending`, and payments store
  `refundId` and `refundedAt`; the order's `paymentStatus` becomes `refunded`.
- **Phase 9** — late payment on a cancelled order (webhook/verify arriving after
  cancellation) is detected and refunded automatically.
- **Phase 9** — admin endpoints `GET /admin/orders` (pagination plus `status`
  and `userId` filters), `GET /admin/orders/:id`, and
  `PATCH /admin/orders/:id/status` with transition, payment and tracking
  validation. Admin list responses include a customer summary resolved with one
  batched user query.
- **Phase 9** — client `OrderTimeline`, `OrderTrackingCard`, `CancelOrderCard`
  and `AdminOrderActions`; order detail now shows history, tracking and a
  two-step cancel with refund wording.
- **Phase 9** — `/admin/orders` table with status filter chips and pagination,
  and `/admin/orders/:id` with items, address snapshot, timeline, tracking,
  customer details and status actions. Both sit behind `RequireAdmin`.
- **Phase 10** — `coupons` collection with an uppercase unique code, percentage
  or fixed value in paise, minimum order, optional maximum discount, start and
  expiry dates, optional usage limit, usage counter and active flag.
- **Phase 10** — `POST /coupons/validate` computes the discount from the
  customer's current cart; `GET/POST /coupons` and `PATCH/DELETE /coupons/:id`
  give admins listing, creation, editing and deactivation with duplicate-code
  `409`s and date/value refinements.
- **Phase 10** — checkout quotes and order placement accept `couponCode`,
  recompute the discount server-side, claim coupon usage atomically with a
  conditional `$inc`, and release it when the order is cancelled.
- **Phase 10** — `GET /admin/stats` aggregates paid revenue, order statuses,
  customer and catalogue counters, a seven-day revenue series, top products
  (cancelled orders excluded), low-stock products and recent orders.
- **Phase 10** — admin customer list and detail with order counts, lifetime
  spend (paid orders only) and recent orders resolved through batched
  aggregations; deactivation clears the refresh session and blocks the access
  token immediately.
- **Phase 10** — `POST /admin/uploads/product-image` accepts JPEG/PNG/WebP up to
  5 MB, signs the Cloudinary upload on the server and returns the secure URL
  (`503` when Cloudinary is not configured).
- **Phase 10** — `AdminLayout` with section navigation plus dashboard, products,
  categories, customers and coupons pages; product management supports image
  upload or URL entry, stock badges and soft delete.
- **Phase 10** — checkout coupon card with apply/remove, server quote refresh,
  discount and recalculated GST/total, and a remove action when the quote
  rejects the applied code.
- **Phase 11** — `reviews` collection with one review per customer per product
  (unique compound index) and a product/date index for listing.
- **Phase 11** — public `GET /products/:slug/reviews` with pagination and a
  rating summary, authenticated `POST /products/:id/reviews`, and owner-only
  `PATCH /reviews/:id`; duplicates return `409`.
- **Phase 11** — every review create or edit recomputes `ratingAvg` and
  `ratingCount` with a MongoDB aggregation, so catalogue cards, filters and the
  product detail summary always agree.
- **Phase 11** — product page review section: summary with stars, paginated
  list, create/edit form for signed-in customers, and a sign-in prompt for
  guests.
- **Phase 11** — Helmet security headers, `x-powered-by` disabled, a strict CORS
  allowlist that rejects unknown origins with `403`, and the CORS
  `X-CSRF-Token` header.
- **Phase 11** — `express-rate-limit` on `/api/v1` (300 requests) and on
  `/auth/login` and `/auth/register` (30 requests) per 15-minute window, with
  configurable `RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX` and
  `AUTH_RATE_LIMIT_MAX`.
- **Phase 11** — double-submit CSRF protection for `/auth/refresh` and
  `/auth/logout`: a readable `csrfToken` cookie must match the `X-CSRF-Token`
  header, compared with `timingSafeEqual`; the client echoes the cookie on every
  request.
- **Phase 11** — access tokens carry `tokenVersion`; a password change bumps the
  stored version, so every previously issued access token is rejected on the
  next request.
- **Phase 11** — oversized payloads return a JSON `413` instead of an HTML error
  page.
- **Phase 11** — server test suite: Vitest + Supertest against a real
  `ecommerce_test` database, 41 tests over pricing, coupons, auth, security,
  orders and reviews.
- **Phase 11** — client test suite: Vitest + jsdom + Testing Library, 12 tests
  over formatting helpers, the `Button` primitive and the route guards.
- **Phase 11** — shared test helpers for database lifecycle, auth cookies,
  tokens and factories for categories, products, addresses and coupons.
- **Phase 12** — structured JSON logger with levels and child bindings, plus
  request correlation: `X-Request-Id` is reused or generated, echoed on the
  response, attached to every log line and propagated into queued jobs through
  `AsyncLocalStorage`.
- **Phase 12** — driver-based catalogue cache (`memory`, `redis`, `none`) with
  read-through list/detail/category caching, TTL, JSON serialisation and
  graceful fallback when Redis fails.
- **Phase 12** — cache invalidation on product create/update/delete/stock,
  category writes, review rating recomputation and order stock changes.
- **Phase 12** — driver-based background queue (`memory`, `bullmq`, `none`) with
  three BullMQ attempts, exponential backoff and completion/failure retention.
- **Phase 12** — order email notifications for placed, confirmed, shipped,
  delivered and cancelled events, with escaped HTML templates and driver-based
  delivery (`log` outbox, SMTP/Nodemailer, `none`).
- **Phase 12** — confirmation emails are sent only when a payment transitions to
  paid, so webhook retries and repeated verification do not duplicate mail.
- **Phase 12** — health endpoint reports the active cache, queue and mail
  drivers.
- **Phase 12** — index review with `isActive`-led compound indexes for newest,
  price, rating, category/price and low-stock queries.
- **Phase 12** — `npm run perf:indexes` explains those queries against 5,000
  synthetic products in a throwaway database and drops it afterwards.
- **Phase 12** — multi-stage server `Dockerfile`, `.dockerignore`, and a root
  `docker-compose.yml` for the API, MongoDB and Redis.
- **Phase 12** — server tests for request correlation, health driver reporting,
  cache read-through/invalidation, and order notification idempotency
  (49 tests across 8 files).

### Fixed

- **Phase 1** — TypeScript 6 rejects `moduleResolution: node`; switched to
  `nodenext` while still emitting CommonJS.
- **Phase 1** — dotenv 18 startup banner suppressed with `quiet: true`.
- **UI refresh** — the footer kept showing "Sign in" and "Create account" while
  signed in; it now renders account (and admin) links from the live session.

### Decisions

- Monorepo with independently versioned `client` and `server` apps.
- Local MongoDB 8.2 for development.
- Money stored as integer paise; no floating point for prices.
- Access token + httpOnly refresh token authentication.
- Refresh tokens are stored as SHA-256 hashes, never in plain text.
- Refresh token reuse is treated as theft and clears the stored session.
- Cloudinary uploads are signed by the server; products still store image URLs,
  so the catalogue never blocks on a vendor account.
- Catalogue slugs are generated from names and made unique with numeric suffixes.
- Category deletion is blocked while active children or products exist.
- Product search uses a MongoDB text index on name and description.
- Access tokens are held in memory only; localStorage is never used.
- A 401 triggers one shared refresh call, then the original request retries.
- Session bootstrap is deduplicated so React StrictMode's double effect cannot
  invalidate a rotating refresh token.
- Client data fetching goes through TanStack Query; no Redux.
- Tailwind CSS 4 is wired through the `@tailwindcss/vite` plugin with design
  tokens declared in `@theme`.
- The storefront uses a warm editorial palette (cream, forest green, terracotta)
  with Fraunces display type to feel like a curated shop rather than a dashboard.
- Login and register sit in a full-screen split layout outside the store shell,
  so authentication gets a focused surface without duplicating the app chrome.
- Icons come from lucide-react instead of hand-drawn SVGs.
- Catalogue filters live in the URL, so search, sort, filters and page are
  shareable and survive reloads; rupee inputs convert to integer paise.
- Product detail pages read the stored rating aggregates; review documents were
  added in Phase 11 with the aggregate recomputed on every write.
- A password change revokes the refresh session and signs the user out
  everywhere; the login page explains why through a redirect notice.
- Addresses are stored per user and scoped by `userId` in every query, so an id
  from another account returns `404` instead of leaking existence.
- Exactly one address can be the default. The service enforces the invariant on
  create, update, default switch and delete instead of trusting the client.
- Checkout pricing is server-only: the client displays a quote but never sends a
  price, and `POST /orders` recomputes every total before saving.
- Tax is inclusive GST: `tax = round(subtotal × 18 / 118)` is the tax portion
  inside the price, not an amount added on top.
- Shipping is free from ₹999 and ₹49 below it, measured after discount.
- Orders snapshot product name, slug, image, price and the delivery address, so
  later catalogue and address edits never rewrite history.
- Stock is decremented with a conditional `stock: { $gte: quantity }` update and
  earlier decrements are rolled back if a later line fails; there are no
  transactions on a standalone MongoDB.
- Order numbers use the UTC date plus six random hex characters, backed by a
  unique index.
- Coupon codes are validated on the server against the cart subtotal instead of
  being rejected or trusted from the client.
- Payment stays `pending` when an order is placed; Phase 8 adds gateway creation,
  signature verification and webhooks.
- Payments are recorded in their own collection with a unique `orderId`, so the
  same order can never hold two payment documents; retries reuse the document
  and replace the provider order id.
- The Razorpay REST API is called with Node's built-in `fetch` and Basic auth
  instead of adding the SDK dependency.
- `PAYMENT_MODE` is explicit. Mock mode is allowed only outside production and
  still signs/verifies real HMACs; production configuration refuses to boot
  without `razorpay` mode and a key id.
- The webhook route is mounted before `express.json()` because a parsed and
  re-serialised body would no longer match the signature.
- Signatures are compared with `timingSafeEqual` after a length check, and the
  webhook amount/currency are checked against the stored payment before any
  order state changes.
- Webhooks for unknown orders or mismatched amounts return `200` without
  changing data, so Razorpay does not retry forever and a forged payload cannot
  confirm an order.
- Payment verification is idempotent: replaying the same signed response returns
  the same paid payment, while a different payment id for the same gateway order
  returns `409`.
- Abandonment is treated as a failed attempt, not a cancellation; the order stays
  placed and can be paid again.
- Order transitions are a single server-owned map (`ALLOWED_TRANSITIONS`), so the
  client never decides which status is legal next.
- Every status change is recorded as an event with a timestamp and optional
  note; the mapper backfills `placed` and the current status for older orders,
  so the timeline is complete without a migration.
- Cancellation is a conditional update guarded by the current status. Stock is
  restored only by the request that actually performed the transition, which
  prevents double restores without transactions.
- Refunds use an atomic `paid → refund_pending → refunded` claim. A gateway
  failure resets the payment to `paid` so a retry is possible, and a concurrent
  cancel gets `409` instead of a second refund.
- A mock refund id (`rfnd_mock_*`) is generated locally so the full refund state
  machine is exercised without credentials.
- Shipping requires both a carrier and a tracking number; the service refuses to
  ship with partial tracking instead of storing an unusable reference.
- `confirmed` is only reachable when `paymentStatus` is `paid`, so an admin
  cannot confirm an unpaid order.
- Admin order lists fetch customers with one `User.find({ _id: { $in } })`
  instead of one query per row.
- The admin screens live under `/admin/orders` rather than extending the
  customer order routes, keeping role guards and payload shapes separate.
- The client timeline renders only server-provided history; there is no
  client-side status inference.
- Coupon discounts are computed in integer paise on the server, capped at the
  subtotal, and applied before shipping and GST; the client only displays the
  quote.
- Coupon usage is claimed with a conditional `$inc` guarded by the date window,
  active flag and `usedCount < maxUses`, then released when order creation fails
  or the order is cancelled. This prevents over-redemption without transactions.
- Admin analytics use MongoDB aggregations and paid orders only; the seven-day
  series buckets by UTC day so the chart matches stored timestamps.
- Admin customer spending is computed in one aggregation and recent orders are
  mapped through the existing admin order mapper, avoiding N+1 queries.
- Customer deactivation relies on the existing `isActive` check in
  `authenticate`, so an already-issued access token stops working immediately
  rather than waiting for it to expire.
- Cloudinary uploads use a server-generated SHA-1 signature over
  `folder` and `timestamp`; the API secret never reaches the browser. The
  endpoint returns `503` when credentials are absent so local development stays
  vendor-independent.
- Admin product and category pages reuse the public read endpoints and the
  existing admin CRUD endpoints; no duplicate catalogue API was added.
- Tests run against a real local MongoDB (`ecommerce_test`) rather than mocks, so
  indexes, unique constraints and aggregation behaviour are exercised for real;
  collections are cleared between tests and files run serially.
- Rating aggregates stay denormalised on the product (recomputed on write)
  instead of aggregating reviews on every catalogue request.
- CSRF uses the double-submit pattern: the token cookie is intentionally
  readable by the client, but a cross-site page cannot read it to fill the
  header.
- Console logging was replaced by structured JSON logs with levels, so
  production can ship lines to any collector and filter by `LOG_LEVEL`.
- Cache, queue and mail use driver abstractions with in-process defaults. Redis,
  BullMQ and SMTP are production choices, not requirements for local development
  or tests.
- Cache failures are logged and ignored: a stale or unavailable cache degrades
  latency, never correctness.
- Catalogue keys are namespaced (`catalog:products:*`, `catalog:categories:*`)
  so invalidation is a prefix operation instead of tracking individual keys.
- Notifications are fired after the business transaction succeeds and are
  best-effort; a mail or queue failure never fails an order or payment request.
- Email idempotency is enforced with the payment status transition
  (`modifiedCount > 0`) rather than an extra dedupe table.
- Query plans were measured, not assumed: the benchmark compares collection
  scans with the declared indexes and only the indexes used by real queries were
  added.
- Compose passes secrets through environment interpolation with required
  variables, so a missing secret stops the stack instead of booting with a
  hardcoded default.
- Rate limits are environment-driven, so tests can raise them and production can
  tighten them without code changes.

### Verified

- Phase 2 live checks (18): register 201, duplicate 409, validation 400,
  wrong password 401, `/auth/me` 200/401, customer → admin route 403,
  admin → admin route 200, garbage token 401, refresh token used as access
  token 401, refresh rotation 200, old token reuse 401, rotated token after
  reuse 401, logout 200, refresh after logout 401, server-side revocation 401.
- Phase 3 live checks (34): public listing 200, anonymous/customer writes
  401/403, category CRUD, duplicate-name slug suffixes, nested tree, cycle
  rejection, product CRUD, validation 400, text search, category/price/rating
  and in-stock filters, price sorting, pagination meta, stock update, soft
  delete 404s, and category delete guards (409).
- `seed:catalog` created 3 categories and 6 products, and a second run created
  nothing (idempotent).
- Phase 4 browser checks: home renders 6 products and 3 categories from the
  API, register creates a session and lands on `/account`, reload restores the
  session through the refresh cookie, sign out clears it, guest `/account`
  redirects to `/login` with a `from` state, login returns to `/account`,
  wrong password shows "Invalid email or password", customer `/admin` is
  blocked, admin `/admin` confirms via `/admin/ping`, unknown URLs show the 404
  page, and an expired access token triggers a silent refresh then a successful
  retry.
- UI refresh browser checks: home renders the curated product photos, both
  fonts load, the mobile menu opens and closes, register validation blocks an
  empty form, the password visibility toggle switches `password` ↔ `text`,
  registration lands on `/account`, sign out returns to `/login`, login rejects
  an empty form and a wrong password, the promoted test admin reaches `/admin`
  with a live `/admin/ping` success, the footer switches to account links when
  signed in, and unknown URLs render the 404 page.
- UI refresh console check: no React warnings or errors; the only 401 is the
  expected `/auth/refresh` probe made while the visitor is a guest.
- Phase 5 API live checks: register 201, `GET /users/me` 200, anonymous request
  401, invalid name 400, valid name update 200 with email unchanged, wrong
  current password 400, reusing the old password 400, successful change 200,
  refresh with the revoked cookie 401, login with the old password 401, login
  with the new password 200.
- Phase 5 browser checks: catalogue shows all six products, category + in-stock
  - price sorting returns the two electronics in ascending order, search and
    chip removal rewrite the URL, product detail renders breadcrumbs, price,
    stock, gallery fallback, "no ratings yet" and related products, unknown
    product and category slugs show their error states, profile update refreshes
    the header name and shows a success alert, a wrong current password shows the
    API message, and a successful password change lands on `/login` with the
    re-login notice.
- Phase 5 network log: `PATCH /users/me` 200, password 400 then 200, logout 200,
  old password login 401, new password login 200. Console has no React errors.
- Phase 7 API live checks (46): anonymous address list 401, invalid address 400
  with six field errors, first address auto-default, explicit default switch,
  edit, set default, delete non-default, delete default with promotion, quote
  subtotal/shipping/GST/total, free shipping at quantity 3, unknown address 404,
  coupon rejection 400, order 201 with `ORD-` number, `placed`/`pending` status,
  item and address snapshots, cart cleared, stock decremented, list/detail,
  cross-user order 404, order survives address deletion, empty-cart order 400.
- Phase 7 browser checks: address empty state, validation errors mapping to
  fields, add address (auto-default), second address, default switch, edit,
  two-step delete with toast, cart checkout link, checkout address pre-selection
  with ₹49 shipping, ₹76 GST and ₹548 total, order placement, confirmation with
  snapshots, order history with pagination counts, empty-cart checkout state,
  guest redirects from `/orders` and `/checkout` to `/login`, and no console
  errors.
- Phase 8 API live checks (60): start requires auth, validates the order id and
  returns `404` for unknown orders; creates one payment with the mock provider,
  correct amount/currency and attempt 1; repeat start is idempotent; another
  user cannot start or verify the payment; wrong and malformed signatures return
  `400` and leave the order pending; mock completion returns a signed credential
  pair; tampering with the payment id breaks the signature; a valid signature
  marks the payment paid and the order confirmed; repeat verification is
  idempotent; a paid order returns `409` on start and ignores abandonment; mock
  failure and abandonment store reasons and mark the order failed; retries create
  a fresh provider order, increment attempts and return the order to pending;
  webhooks reject missing/invalid signatures and malformed JSON, ignore unknown
  orders and amount mismatches, handle `payment.failed`, mark `payment.captured`
  as paid/confirmed, and stay idempotent on replay.
- Phase 8 browser checks: login and order detail render the payment panel, mock
  success moves the badges to CONFIRMED/PAID and swaps in the paid message with
  a "Payment received" toast, mock failure shows PAYMENT FAILED with "Retry
  payment", retrying opens a new mock session, and cancelling that attempt
  returns to the failed state. The only console entry was the expected guest
  `/auth/refresh` 401.
- Browser screenshots and scroll offsets could not be captured because the
  in-app browser reported a 0×0 hidden viewport; layout was verified through DOM
  snapshots and interaction checks instead.
- Phase 9 API live checks (66): anonymous cancel `401`, unknown order `404`,
  invalid body `400`, unpaid cancel with stock restore, repeat cancel
  idempotent, nested cancels, paid cancel → `refund_pending` → `refunded` with a
  mock refund id and `refundedAt`, payment and order `paymentStatus` updated,
  late payment on a cancelled order auto-refunded, shipped and delivered
  cancellation blocked with `409`, admin list auth/role guard, status and
  `userId` filters, pagination meta, customer summaries, admin detail `404`,
  unpaid confirm blocked, invalid transition `400`, stale transition race `409`,
  admin confirm/ship with tracking/reject partial tracking/deliver, admin cancel
  with stock restore and refund, and terminal-state guards.
- Phase 9 browser checks: customer cancellation of an unpaid order shows
  CANCELLED and a two-entry timeline; cancelling a paid order shows CANCELLED +
  PAYMENT REFUNDED with placed → confirmed → cancelled history; the customer
  cannot open another account's order; the admin order desk lists 17 orders
  with customer, status, payment and total columns; the `shipped` filter writes
  `?status=shipped` and renders the empty state; "Mark shipped" stays disabled
  until carrier and tracking are supplied, then shows the SHIPPED timeline and
  tracking card; "Mark delivered" completes the timeline. No console errors.
- Phase 10 API live checks (44): admin login and stats shape, customer `403`s on
  admin/coupon routes, percentage coupon creation, duplicate `409`,
  case-insensitive validation, quote and order discount, usage claimed on order,
  released on cancellation, single-use exhaustion, expired/future/minimum-order
  and inactive rejections, active filter, customer list/detail and immediate
  session rejection after deactivation, reactivation, category and product
  creation/update/stock/soft delete, hidden soft-deleted product, upload `400`s
  for a missing file and wrong type, and `503` for a valid image when Cloudinary
  is not configured.
- Phase 10 browser checks: dashboard renders live revenue, order pipeline,
  seven-day chart, top products, low stock and recent orders; coupons page
  creates a coupon through the form, toggles it inactive and back; customers page
  opens a detail panel with spending, recent orders and deactivation; checkout
  applies a coupon (₹499 + ₹49 shipping − ₹25 = ₹523) and removes it back to
  ₹548. Test coupons, the temporary address and the cart were removed afterwards.
- Cloudinary credentials were absent in this environment, so the live upload
  path was verified through validation (missing file, wrong type) and the
  documented `503` short-circuit, not a real vendor upload.
- `typecheck`, `lint`, `format:check`, and `build` pass for both apps; the
  client build reports only the expected single-chunk size advisory.
- `npm audit --omit=dev` reports 0 vulnerabilities; the remaining moderate
  advisories are in ESLint's `minimatch` dependency chain (dev only).
- Phase 11 server suite: 41 tests across 6 files pass against the local
  `ecommerce_test` database (pricing 4, coupons 11, auth 10 including CSRF and
  token invalidation, security 6, orders 5, reviews 5).
- Phase 11 client suite: 12 tests across 3 files pass (format helpers, `Button`,
  route guards).
- Phase 11 live API checks: Helmet headers present and `x-powered-by` absent,
  unknown CORS origin `403`, allowed origin echoed with credentials, rate-limit
  headers (`RateLimit-Limit: 300`), CSRF-less refresh `403`, JSON `404`,
  oversized JSON `413`, review list shape with summary and pagination.
- Phase 11 browser checks: guest sees the sign-in prompt in the review section;
  a signed-in customer creates a review and the summary, aggregate, list and
  Edit action update; sign-out still works. The QA review, user and rating
  reset were removed afterwards.
- Phase 11 gates: server and client `typecheck`, `lint`, `format:check` and
  `build` pass; the client build reports only the expected chunk-size advisory.
- Phase 12 server suite: 49 tests across 8 files pass against the local
  `ecommerce_test` database; the new infra suite covers request-id reuse and
  replacement, health driver reporting, cache read-through plus invalidation
  (direct and through an admin update), and notification tests cover placed,
  confirmed (including duplicate verification), shipped, delivered and
  cancellation idempotency.
- Phase 12 index benchmark: 5,000 synthetic products; before indexes every query
  was a `COLLSCAN` examining 5,000 documents in 9–11 ms; after indexes the plans
  used the expected compound indexes, examined 1–20 documents and returned the
  same rows in 1–2 ms. The text query used the text index at 25 ms. The
  throwaway database was dropped.
- Phase 12 live check: the built API started with structured logs, echoed a safe
  `X-Request-Id`, reported memory/memory/log drivers at `/health`, and served the
  product list.
- Phase 12 gates: server `typecheck`, `lint`, `format:check` and `build` pass.
- Phase 12 Docker files could not be executed because Docker is not installed on
  this machine; the Compose file and Dockerfile are not runtime-verified here.
- Phase 12 Redis/BullMQ and SMTP paths are implemented and type-checked but not
  exercised locally for the same reason (no Redis or SMTP server available);
  the memory and log drivers are what the suite and live check used.
- `npm audit --omit=dev` reports 0 vulnerabilities; the 10 moderate advisories
  remain in the ESLint `minimatch` chain (dev only).
