# Project Context

Living state document. Read this before starting any work; update it at the end of
every phase. If chat context is lost, this file is the source of truth.
For a full project explanation (phases, architecture, workflows, interview Q&A),
read [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

**Last updated:** 2026-11-02
**Current phase:** Phase 2 — Authentication and Authorization (complete, awaiting review)
**Completed phases:** Phase 0, Phase 1, Phase 2
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
│       ├── api/                  axios instance + typed endpoint functions
│       ├── components/           ui/, layout/, product/, cart/
│       ├── features/             auth/, products/, cart/, checkout/, orders/, admin/
│       ├── hooks/                TanStack Query wrappers
│       ├── lib/                  queryClient, formatters, constants
│       ├── pages/                route-level components
│       ├── routes/               router + ProtectedRoute/AdminRoute
│       ├── types/                shared API types
│       ├── App.tsx
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

| Area | Decision | Why |
|---|---|---|
| Language | TypeScript strict mode, no implicit `any` | Catch shape errors at compile time |
| Money | Integer **paise** | Avoids floating point errors in totals/tax |
| Auth | 15 min access token + 7 day refresh token in httpOnly cookie | XSS-safe refresh, revocable sessions |
| Refresh storage | SHA-256 hash of the refresh token on the user document | A database leak does not expose usable tokens |
| Refresh rotation | New token on every refresh; reuse of an old token clears the session | Detects stolen refresh tokens |
| Passwords | bcryptjs, cost factor 12 | Slow hashing resists brute force |
| Validation | Zod for env and request bodies | One schema source; infer TS types |
| Response shape | `{ success, message, data, meta? }` | Predictable frontend handling |
| Errors | `ApiError` + single global error middleware | Consistent status codes and payloads |
| API prefix | `/api/v1` | Room for breaking changes later |
| API framework | Express 5 | Native async error forwarding; no `asyncHandler` wrapper needed |
| Module system | TypeScript `nodenext`, compiled to CommonJS | Modern resolution without ESM `.js` import friction |
| IDs | Mongo ObjectId | Default; slugs used for public product/category URLs |
| Deletes | Soft delete on products/users (`isActive`) | Orders keep valid references |
| Order data | Price/name/address snapshots | Historical accuracy after edits |
| Reviews | Compound unique index `(user, product)` | One review per customer per product |
| Images | URL strings in Phase 3, Cloudinary in Phase 10 | Don't block product CRUD on a vendor |
| Server state | TanStack Query | Caching, retries, loading states |
| Cart/wishlist | Persisted server-side | Cross-device consistency |
| Testing | Manual + Postman per phase; formal suite in Phase 11 | Learn behavior before automating |

## 5. Database collections

| Collection | Key fields | Relationships / indexes |
|---|---|---|
| `users` | name, email, passwordHash, role, isActive | email unique; 1–1 cart; 1–N addresses, orders, reviews |
| `categories` | name, slug, parentId, isActive | slug unique; self-referencing tree |
| `products` | name, slug, description, price, categoryId, images, stock, ratingAvg, ratingCount | slug unique; index on categoryId, price, createdAt; text index on name/description |
| `carts` | userId, items[{ productId, quantity, priceAtAdd }] | userId unique |
| `wishlists` | userId, productIds[] | userId unique |
| `addresses` | userId, label, line1, line2, city, state, pincode, phone, isDefault | index on userId |
| `orders` | userId, items[] snapshot, address snapshot, subtotal, tax, shipping, discount, total, status, paymentStatus | index on userId + createdAt |
| `payments` | orderId, provider, providerOrderId, providerPaymentId, amount, status, rawPayload | orderId unique |
| `reviews` | userId, productId, rating, comment | unique (userId, productId) |
| `coupons` | code, type, value, minOrder, maxDiscount, startsAt, expiresAt, maxUses, usedCount, isActive | code unique |

## 6. API surface

Planned endpoints and conventions: [docs/api-contract.md](docs/api-contract.md).
Marked complete here as each phase lands.

**Implemented:** `/health` (Phase 1); `/auth/register`, `/auth/login`,
`/auth/refresh`, `/auth/logout`, `/auth/me`, `/admin/ping` (Phase 2).
User profile endpoints are deferred to Phase 5 with the account UI.

## 7. Environment

| Item | Value |
|---|---|
| OS | Windows 10 x64, Git Bash |
| Node | v22.14.0 via nvm4w (`.nvmrc`) |
| npm | 10.9.2 |
| MongoDB | 8.2 local, `mongodb://127.0.0.1:27017/ecommerce_dev` |
| API (dev) | http://localhost:5000/api/v1 |
| Auth env | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (32+ chars, different), `JWT_ACCESS_TTL_SECONDS=900`, `JWT_REFRESH_TTL_SECONDS=604800`, `BCRYPT_ROUNDS=12` |
| Admin seed | `npm run seed:admin -- <email> <password> [name]` |
| VS Code | 1.139.1 |
| GitHub CLI | 2.103.3, authenticated as `Owais101074` (keyring) |
| GitHub repo | `ecommerce-platform`, public, default branch `main` |
| Docker | not installed (Phase 12) |

## 8. Installed dependencies

**server — runtime:** express 5, mongoose 9, dotenv 18, zod 4, cors 2, morgan 1,
bcryptjs 3, jsonwebtoken 9, cookie-parser 1.
**server — dev:** typescript 6, tsx 4, eslint 10, typescript-eslint 8,
eslint-config-prettier 10, prettier 3, `@types/*` (incl. jsonwebtoken, cookie-parser).
**client:** none yet.

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
- [ ] Close Phase 2 review

**Scope note:** app scaffolding is intentionally deferred — `server/` is
initialized at the start of Phase 1 and `client/` at the start of Phase 4, so
tooling is configured once, in context, instead of twice.

## 10. Pending tasks

| Phase | Task | Status |
|---|---|---|
| 0 | GitHub repo + first push | done |
| 1 | Express + TS scaffold, env config, DB connect, error middleware, `/health` | done |
| 2 | Auth module, JWT, roles, protected routes | done |
| 3 | Category + product CRUD, search/filter/sort/pagination, seed script | not started |
| 4 | Vite + React + Tailwind + Router + Query scaffold | not started |
| 5 | Home, listing, details, search UI | not started |
| 6 | Cart + wishlist | not started |
| 7 | Addresses + checkout | not started |
| 8 | Razorpay integration | not started |
| 9 | Order lifecycle + cancellation/refund | not started |
| 10 | Admin dashboard + Cloudinary | not started |
| 11 | Tests + security hardening | not started |
| 12 | Redis, jobs, email, logging, Docker | not started |
| 13 | Deployment + GitHub Actions | not started |

## 11. Known bugs

None.

## 12. Conventions

- Branches: `main` stays deployable; work happens on `feat/<scope>` branches.
- Commits: Conventional Commits, e.g. `feat(auth): add refresh token rotation`.
- Every phase ends with: typecheck → lint → tests → docs update → commit → push.
- Never commit `.env` files or secrets.
- Update this file at the end of every phase, no exceptions.
