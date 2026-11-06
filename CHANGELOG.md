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
- Cloudinary uploads deferred to Phase 10; Phase 3 uses image URLs.
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
- Product detail pages reuse the stored rating aggregates; review documents are
  still deferred to Phase 11.
- A password change revokes the refresh session and signs the user out
  everywhere; the login page explains why through a redirect notice.

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
  + price sorting returns the two electronics in ascending order, search and
  chip removal rewrite the URL, product detail renders breadcrumbs, price,
  stock, gallery fallback, "no ratings yet" and related products, unknown
  product and category slugs show their error states, profile update refreshes
  the header name and shows a success alert, a wrong current password shows the
  API message, and a successful password change lands on `/login` with the
  re-login notice.
- Phase 5 network log: `PATCH /users/me` 200, password 400 then 200, logout 200,
  old password login 401, new password login 200. Console has no React errors.
- `typecheck`, `lint`, `format:check`, and `build` pass for both apps; the
  client build reports only the expected single-chunk size advisory.
- `typecheck`, `lint`, `format:check`, and `build` pass for both apps.
- Browser screenshots and scroll offsets could not be captured because the
  in-app browser reported a 0×0 hidden viewport; layout was verified through DOM
  snapshots, computed styles, and interaction checks instead.
- `npm audit --omit=dev` reports 0 vulnerabilities; the remaining moderate
  advisories are in ESLint's `minimatch` dependency chain (dev only).
