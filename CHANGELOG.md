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

### Fixed

- **Phase 1** — TypeScript 6 rejects `moduleResolution: node`; switched to
  `nodenext` while still emitting CommonJS.
- **Phase 1** — dotenv 18 startup banner suppressed with `quiet: true`.

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
- `typecheck`, `lint`, `format:check`, and `build` pass for both apps.
- `npm audit --omit=dev` reports 0 vulnerabilities; the remaining moderate
  advisories are in ESLint's `minimatch` dependency chain (dev only).
