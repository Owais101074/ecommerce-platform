# E-commerce Platform — Complete Project Guide

> A plain-text (Markdown) reference for the entire project: what we are building,
> how it is architected, what each phase delivers, how every important workflow
> runs, and how to explain it to anyone.
>
> Last updated: 2026-11-04 · Branch: `main` · Latest phase: Phase 5
> Repository: https://github.com/Owais101074/ecommerce-platform (public)

---

## 0. How to use this file

| If you want to... | Read |
|---|---|
| Explain the project in an interview | Section 3 (60-second version), Section 13 (Q&A) |
| Understand the folder layout | Section 5 |
| Understand why a technology was chosen | Section 6 |
| Understand the database | Section 7 |
| Know what is built vs planned | Section 9 |
| Understand authentication deeply | Section 10 |
| Run or test the project | Section 11 |
| Know the development rules | Section 12 |
| Be honest about gaps | Section 15 |

Status legend: **DONE** = implemented and verified · **PLANNED** = designed but not built yet.

---

## 1. Project at a glance

| Item | Value |
|---|---|
| Type | Production-style e-commerce platform (learning project) |
| Repository | `ecommerce-platform` (public, GitHub) |
| Structure | Monorepo: `client/` + `server/`, independent `package.json` files, no npm workspaces |
| Backend | Node.js 22, Express 5, TypeScript 6, REST, JWT, Zod 4 |
| Database | MongoDB 8.2 + Mongoose 9 |
| Frontend | React 19 + TypeScript 6 + Vite 8 + Tailwind 4 + React Router 7 + TanStack Query 5 + Axios |
| Tooling | Git, GitHub CLI, ESLint 10, Prettier 3, Postman |
| Current phase | Phase 5 complete (catalogue, product detail, departments, profile), awaiting review |
| Completed phases | 0, 1, 2, 3, 4, 5 |
| Next phase | Phase 6 — Cart and Wishlist |
| API base | `http://localhost:5000/api/v1` |
| Client base | `http://localhost:5173` |
| Database (dev) | `mongodb://127.0.0.1:27017/ecommerce_dev` |

---

## 2. What the product will do

### Customer features
Registration, login, profile, product browsing, search, filters, sorting,
categories, product details, reviews and ratings, cart, wishlist, addresses,
checkout, payment, order history, order tracking, cancellation/refund, email
notifications.

### Admin features
Dashboard, product management, category management, inventory management,
order management, customer management, coupon management, sales analytics,
revenue reports.

### Engineering features
Pagination, Redis caching, Cloudinary image uploads, Razorpay payments,
background jobs, rate limiting, structured logging, security headers, Docker,
deployment, automated tests, CI/CD.

Everything is delivered **one phase at a time**. No phase starts before the
previous phase is reviewed and approved with the exact phrase
`PHASE COMPLETED — START NEXT PHASE`.

---

## 3. The 60-second explanation

> "I am building a production-style e-commerce platform as a monorepo. The
> backend is a feature-modular Express 5 API in strict TypeScript, following
> routes → controllers → services → models. MongoDB and Mongoose store users,
> products, categories, carts, orders, payments, reviews and coupons. The API
> uses Zod for environment and request validation, a central error handler, and
> a consistent JSON response envelope. Authentication uses bcrypt password
> hashing, 15-minute JWT access tokens sent as Bearer tokens, and 7-day refresh
> tokens stored in httpOnly cookies. Refresh tokens are hashed in MongoDB,
> rotated on every refresh, and reuse triggers session revocation. Role-based
> authorization supports `customer` and `admin`. The React frontend with Vite,
> Tailwind, React Router and TanStack Query comes in Phase 4. Every phase ends
> with typecheck, lint, tests, documentation, a conventional commit and a push."

If asked "what is finished right now?", answer:

> "Phases 0–3: the repository and architecture, the Express/TypeScript
> foundation with health check and error handling, complete authentication and
> RBAC with 18 passing checks, and the product/category catalogue with search,
> filters, sorting, pagination and 34 passing checks. Phase 4, the React
> frontend foundation, is next."

---

## 4. Architecture

### 4.1 Monorepo layout

```
ecommerce-platform/
├── client/     React application (Phase 4)
├── server/     Express API (Phase 1+)
├── docs/       API contract and technical references
├── PROJECT_CONTEXT.md   Living project state
├── CHANGELOG.md         Phase history
├── PROJECT_GUIDE.md     This document
└── README.md
```

Why a monorepo: one repository, one history, one place for shared documentation.
No npm workspaces because the two apps share no runtime code and each deploys
independently. This avoids workspace tooling complexity for a learning project.

### 4.2 Backend layers

```
HTTP request
   │
   ▼
route          URL + middleware chain only
   │
   ▼
middleware     validate, authenticate, authorize
   │
   ▼
controller     HTTP concerns: read req, set cookies, shape res
   │
   ▼
service        business rules + database access
   │
   ▼
model          Mongoose schema, indexes, document types
   │
   ▼
MongoDB
```

Hard rules:

1. **Routes contain no logic.** They wire middleware and controllers.
2. **Controllers never call Mongoose.** They call services.
3. **Services never touch `req` or `res`.** They receive plain typed input.
4. **Models contain schema only.** No business logic.
5. **Errors are thrown as `ApiError`.** One global handler formats every error.

Benefits: testable services, reusable business logic, one place to change each
concern, and clean code review boundaries.

### 4.3 Request lifecycle

```
Express app
→ security/CORS/body parser/cookie parser
→ route match
→ validation middleware      → 400 on bad input
→ authentication middleware  → 401 on missing/invalid token
→ authorization middleware   → 403 on wrong role
→ controller                 → calls service
→ service                    → Mongoose → MongoDB
→ controller                 → sendSuccess(...)
→ client receives { success, message, data }
```

If anything throws, Express 5 forwards the rejection to the single error
middleware, which formats the response.

### 4.4 Response envelope

Success:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": { "user": {}, "accessToken": "..." }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

Why: the frontend checks one shape everywhere; no ad-hoc parsing per endpoint.

### 4.5 Error handling pipeline

| Error type | Status | Response message |
|---|---|---|
| `ApiError` | its own status | its own message |
| Zod validation error | 400 | `Validation failed` + field list |
| Mongoose `ValidationError` | 400 | `Validation failed` + field list |
| Mongoose `CastError` (bad ObjectId) | 400 | `Invalid <path>` |
| MongoDB duplicate key `11000` | 409 | `<field> already exists` |
| Malformed JSON body | 400 | `Malformed JSON body` |
| Unknown route | 404 | `Route not found: METHOD URL` |
| Unexpected error | 500 | `Internal server error` |

Stack traces are only included for 5xx errors in development. 5xx errors are
logged; 4xx errors are not, because they are normal client mistakes.

### 4.6 Frontend architecture (implemented in Phase 4)

```
src/
├── api/          axios instance + typed endpoint functions
├── components/   ui/, layout/, product/, cart/ reusable components
├── features/     auth/, products/, cart/, checkout/, orders/, admin/
├── hooks/        TanStack Query wrappers
├── lib/          queryClient, formatters, constants
├── pages/        route-level components
├── routes/       router + ProtectedRoute/AdminRoute
├── types/        shared API types
├── App.tsx
└── main.tsx
```

- Server state (products, orders) lives in TanStack Query.
- Session state lives in a small AuthContext.
- Axios instance attaches the access token and handles 401 → refresh → retry.
- No Redux: there is little global client state.
- Access token kept in memory, refresh token in the httpOnly cookie.

### 4.6.1 Visual design system

The storefront deliberately avoids a stock dashboard look:

| Layer | Choice |
|---|---|
| Surfaces | Cream `#faf7f1` and paper `#fffdf9` |
| Brand | Deep forest green (`brand-800` / `brand-900`) |
| Accent | Terracotta (`accent-500` / `accent-600`) |
| Display type | Fraunces (serif, headings) |
| Body type | Plus Jakarta Sans (UI, prose) |
| Icons | lucide-react |
| Motion | `animate-rise`, `animate-float`, shimmer skeletons, reduced-motion override |

All colours, fonts and shadows are declared with `@theme` in
`client/src/index.css`; utilities such as `surface`, `dot-grid`, `skeleton`,
`animate-rise` and `reveal-*` build on those tokens. Shared primitives live in
`client/src/components/ui/`, so pages compose `Button`, `Input`,
`PasswordInput`, `Badge`, `Alert`, `ErrorState`, `BrandMark` and
`SectionHeading` instead of ad-hoc classes.

Layout split:

- `AppLayout` = announcement bar, sticky header, `ScrollManager`, page outlet,
  footer.
- `AuthLayout` = full-screen two-column split used by `/login` and `/register`,
  outside `AppLayout`, with the session model explained on the green panel.

### 4.7 Security model

| Threat | Mitigation | Status |
|---|---|---|
| Password database leak | bcrypt cost 12, never store plain text | DONE |
| Token theft from JavaScript | refresh token in httpOnly cookie | DONE |
| Stolen refresh token reuse | rotation + reuse detection clears session | DONE |
| Refresh token DB leak | only SHA-256 hash stored | DONE |
| Account enumeration | generic `Invalid email or password` | DONE |
| Wrong role access | `authorize(...roles)` returns 403 | DONE |
| Secret leakage | `.env` gitignored, Zod startup validation | DONE |
| Oversized JSON payload | 10kb body limit | DONE |
| XSS | React escaping + no token in localStorage (frontend plan) | PLANNED |
| CSRF | `sameSite=lax` cookie + cookie scoped to `/api/v1/auth` | DONE (basic) |
| Brute force | rate limiting | PLANNED Phase 11 |
| Security headers | helmet-style headers | PLANNED Phase 11 |
| Input injection | Zod schemas, Mongoose casting | DONE for current routes |

Known CSRF note: if the frontend is later deployed on a different domain, the
cookie must become `sameSite: 'none'; secure: true`, which removes the built-in
CSRF protection. A CSRF token or same-site proxy must be added in Phase 11.

---

## 5. Folder structure

### Current server tree

```
server/
├── .env                (gitignored, real secrets)
├── .env.example        (documented placeholders)
├── eslint.config.mjs
├── .prettierrc
├── .prettierignore
├── tsconfig.json
├── package.json
└── src/
    ├── app.ts                         Express app + middleware + route mounts
    ├── server.ts                      startup, DB connect, graceful shutdown
    ├── config/
    │   ├── env.ts                     Zod-validated environment
    │   └── db.ts                      Mongoose connection + status
    ├── middleware/
    │   ├── auth.ts                    authenticate, authorize
    │   ├── validate.ts                Zod body validation
    │   ├── errorHandler.ts            central error formatter
    │   └── notFound.ts                404 forwarder
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.routes.ts
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.model.ts
    │   │   ├── auth.mapper.ts
    │   │   ├── auth.validation.ts
    │   │   └── auth.types.ts
    │   ├── admin/
    │   │   ├── admin.routes.ts
    │   │   └── admin.controller.ts
    │   ├── categories/
    │   │   ├── category.routes.ts
    │   │   ├── category.controller.ts
    │   │   ├── category.service.ts
    │   │   ├── category.model.ts
    │   │   ├── category.mapper.ts
    │   │   ├── category.validation.ts
    │   │   └── category.types.ts
    │   ├── products/
    │   │   ├── product.routes.ts
    │   │   ├── product.controller.ts
    │   │   ├── product.service.ts
    │   │   ├── product.model.ts
    │   │   ├── product.mapper.ts
    │   │   ├── product.types.ts
    │   │   └── product.validation.ts
    │   └── health/
    │       ├── health.routes.ts
    │       └── health.controller.ts
    ├── scripts/
    │   ├── seedAdmin.ts
    │   └── seedCatalog.ts
    ├── types/
    │   └── express.d.ts               Request.user augmentation
    └── utils/
        ├── ApiError.ts
        ├── ApiResponse.ts
        ├── jwt.ts
        ├── password.ts
        └── cookies.ts
```

Each future backend module (products, categories, cart, orders, ...) follows the
same shape: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.model.ts`,
`*.validation.ts`, optional `*.types.ts` and `*.mapper.ts`.

### Current client tree

```
client/
├── .env.example              VITE_API_URL
├── eslint.config.js          flat config
├── .prettierrc.json
├── index.html
├── public/favicon.svg
├── tsconfig.json             strict, bundler resolution, @/ alias
├── vite.config.ts            React + Tailwind plugins, alias, port 5173
└── src/
    ├── api/
    │   ├── http.ts           axios instance, Bearer, 401 refresh + retry
    │   ├── session.ts        in-memory access token, expiry listeners
    │   ├── errors.ts         ApiError, field error mapping
    │   ├── auth.api.ts       login, register, refresh, logout, me
    │   └── catalog.api.ts    products, categories, admin ping
    ├── components/
    │   ├── layout/           Header, Footer, Container, AppLayout,
    │   │                     AuthLayout, ScrollManager
    │   ├── product/          ProductCard, CategoryCard
    │   └── ui/               Button, button-styles, Input, PasswordInput,
    │                         Alert, Badge, Spinner, Skeleton, ErrorState,
    │                         PageLoader, BrandMark, SectionHeading
    ├── features/auth/        auth-context, AuthProvider, useAuth
    ├── hooks/                useProducts, useCategories, useAdminPing,
    │                         useDocumentTitle
    ├── lib/                  env, queryClient, format, constants
    ├── pages/                Home, Login, Register, Account, Admin, NotFound,
    │                         RouteError
    ├── routes/               router.tsx, guards.tsx
    ├── types/                api, auth, catalog
    ├── App.tsx
    ├── index.css             Tailwind + @theme tokens
    ├── main.tsx
    └── vite-env.d.ts
```

`features/products`, `cart`, `checkout`, `orders` and `admin` folders arrive with
their phases; Phase 4 keeps auth in `features/` and catalogue hooks in `hooks/`.

---

## 6. Technology decisions

| Decision | Choice | Why |
|---|---|---|
| Language | TypeScript strict, `noUncheckedIndexedAccess` | Shape errors caught at compile time |
| Module resolution | `nodenext`, compiled to CommonJS | Modern resolver without ESM `.js` import friction |
| HTTP framework | Express 5 | Native async error forwarding; no `asyncHandler` needed |
| Validation | Zod 4 | One schema for env + requests; `z.infer` gives types |
| Database | MongoDB + Mongoose | Flexible product documents, schema validation, references |
| Auth tokens | 15 min access + 7 day refresh | Short exposure window, long convenience |
| Refresh storage | SHA-256 hash on user document | DB leak does not expose usable tokens |
| Passwords | bcryptjs cost 12 | Slow hashing resists brute force |
| API prefix | `/api/v1` | Room for breaking changes |
| Errors | `ApiError` + single handler | Consistent status and payload |
| Money | Integer **paise** | No floating point rounding errors |
| IDs | ObjectId internally, slug publicly | Stable URLs for products/categories |
| Deletes | Soft delete (`isActive`) | Orders keep valid references |
| Order data | Snapshots of price/name/address | History stays accurate after edits |
| Reviews | Unique `(userId, productId)` index | One review per customer per product |
| Images | URLs in Phase 3, Cloudinary in Phase 10 | Product CRUD is not blocked on a vendor |
| Frontend state | TanStack Query + small AuthContext | Server state vs session state separation |
| Client token storage | Access token in a module variable | Never in localStorage, so injected scripts cannot read it |
| Client refresh | One shared refresh promise, then retry once | Parallel 401s trigger a single rotation |
| Session restore | Refresh cookie on app mount, deduplicated | Survives reload without StrictMode double-rotation |
| Styling | Tailwind 4 with `@theme` tokens | Design tokens generate utilities; no JS config |
| Visual direction | Warm editorial palette, Fraunces + Plus Jakarta Sans, lucide icons | A curated shop feel that still scales to admin screens |
| Routing | React Router 7 data router | Guards and future loaders in one place |
| Cart/wishlist | Stored server-side | Cross-device consistency |
| Testing | Manual/Postman per phase, suite in Phase 11 | Learn behavior before automating |
| Docker | Phase 12 | Core behaviour first, packaging later |

---

## 7. Database design

### 7.1 Implemented — `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | string | 2–50 chars |
| `email` | string | unique, lowercase, trimmed |
| `passwordHash` | string | `select: false`, bcrypt hash |
| `role` | string | `customer` \| `admin`, default `customer` |
| `isActive` | boolean | soft-delete / disable flag |
| `refreshTokenHash` | string \| null | `select: false`, SHA-256 of current refresh token |
| `refreshTokenExpiresAt` | Date \| null | `select: false`, session expiry |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Index: unique index on `email`.

Design notes:

- One stored refresh hash = **one active refresh session per user**. A second
  login replaces the first session's refresh token. This is acceptable for the
  learning build; a `sessions` collection per device is the production upgrade.
- `isActive` lets admins disable accounts without deleting order references.
- Hiding sensitive fields with `select: false` prevents accidental leaks in any
  future endpoint that returns a user document.

### 7.2 Implemented — `categories` and `products`

`categories`:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | string | 2–60 chars |
| `slug` | string | unique, generated from name |
| `description` | string \| null | up to 500 chars |
| `parentId` | ObjectId \| null | self-reference to parent category |
| `isActive` | boolean | soft delete |
| `createdAt` / `updatedAt` | Date | timestamps |

Indexes: `slug` unique, `(parentId, isActive)`.

`products`:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | string | 2–120 chars |
| `slug` | string | unique, generated from name |
| `description` | string | 20–5000 chars |
| `price` | number | integer paise, ≥ 0 |
| `categoryId` | ObjectId | reference to `categories` |
| `images` | string[] | URL strings, max 5 via API |
| `stock` | number | integer, ≥ 0 |
| `ratingAvg` | number | 0–5 aggregate, default 0 |
| `ratingCount` | number | default 0 |
| `isActive` | boolean | soft delete |
| `createdAt` / `updatedAt` | Date | timestamps |

Indexes: `slug` unique, `(categoryId, price)`, `createdAt` descending, text
index on `name` and `description`.

Catalogue rules:

- Slugs are generated from names and made unique with `-2`, `-3` suffixes.
- Products can only be created in an **active** category.
- Category deletion returns 409 while active children or products exist.
- Deletes are soft: public reads filter `isActive: true`.
- Product responses include a category summary `{ id, name, slug }`.
- Ratings are stored aggregates; actual review documents arrive in Phase 11.

### 7.3 Planned collections

| Collection | Key fields | Relationships / indexes |
|---|---|---|
| `carts` | userId, items[{ productId, quantity, priceAtAdd }] | userId unique |
| `wishlists` | userId, productIds[] | userId unique |
| `addresses` | userId, label, line1, line2, city, state, pincode, phone, isDefault | index on userId |
| `orders` | userId, items[] snapshot, address snapshot, subtotal, tax, shipping, discount, total, status, paymentStatus | index on userId + createdAt |
| `payments` | orderId, provider, providerOrderId, providerPaymentId, amount, status, rawPayload | orderId unique |
| `reviews` | userId, productId, rating, comment | unique (userId, productId) |
| `coupons` | code, type, value, minOrder, maxDiscount, startsAt, expiresAt, maxUses, usedCount, isActive | code unique |

### 7.4 Relationship summary

```
User 1─1 Cart
User 1─1 Wishlist
User 1─N Address
User 1─N Order
User 1─N Review
Category 1─N Product
Product 1─N Review
Order 1─1 Payment
Order N─1 Coupon (optional)
```

Every document reference is by ObjectId. Product/category public URLs use slugs.

### 7.5 Data rules

- **Prices are integers in paise.** ₹499.00 is stored as `49900`.
- **Orders snapshot** product name, price and the delivery address.
- **Soft delete** for users and products so historic orders stay valid.
- **Unique indexes** enforce email, slug, coupon code, and one review per user
  per product at the database level, not only in application code.

---

## 8. API design

### 8.1 Conventions

| Rule | Value |
|---|---|
| Base URL | `/api/v1` |
| Format | JSON; payment webhook needs raw body |
| Auth | `Authorization: Bearer <accessToken>` |
| Roles | `customer` (default), `admin` |
| Pagination | `?page=1&limit=20`, `meta: { page, limit, total, totalPages }` |
| Sorting | `price_asc`, `price_desc`, `newest`, `rating` |
| Money | integer paise |
| Public IDs | products/categories by slug, others by ObjectId |

Status codes: 200 OK, 201 Created, 204 Deleted, 400 validation, 401 missing/
invalid token, 403 wrong role, 404 not found, 409 duplicate, 422 business rule
(out of stock), 429 rate limited, 500 server error.

### 8.2 Implemented endpoints

| Method | Endpoint | Access | Behaviour |
|---|---|---|---|
| GET | `/health` | public | 200 healthy, 503 if DB down |
| POST | `/auth/register` | public | 201, sets refresh cookie, returns user + access token |
| POST | `/auth/login` | public | 200, sets refresh cookie, returns user + access token |
| POST | `/auth/refresh` | refresh cookie | 200, rotates token, returns user + access token |
| POST | `/auth/logout` | refresh cookie | 200, revokes session, clears cookie |
| GET | `/auth/me` | access token | 200, returns current user |
| GET | `/admin/ping` | admin access token | 200, RBAC smoke test |
| GET | `/categories` | public | 200, nested active category tree |
| GET | `/categories/:slug` | public | 200, category detail |
| POST/PATCH/DELETE | `/categories...` | admin | create, update, soft delete (204) |
| GET | `/products` | public | 200, filtered/sorted/paginated list + meta |
| GET | `/products/:slug` | public | 200, product detail |
| POST/PATCH/DELETE | `/products...` | admin | create, update, soft delete (204) |
| PATCH | `/products/:id/stock` | admin | set absolute stock |
| GET | `/users/me` | access token | 200, current profile |
| PATCH | `/users/me` | access token | update name, returns the user |
| PATCH | `/users/me/password` | access token | verify current password, revoke sessions, clear cookie |

### 8.3 Planned endpoints by phase

| Phase | Endpoints |
|---|---|
| 6 | `/cart/*`, `/wishlist/*` |
| 7 | `/addresses/*`, `POST /orders`, `GET /orders*` |
| 8 | `/payments/orders`, `/payments/verify`, `/payments/webhook` |
| 9 | cancel order, admin order routes |
| 10 | `/coupons/*`, `/admin/*` |

Full contract: `docs/api-contract.md`. Any endpoint added outside it must be
recorded there in the same commit.

---

## 9. Phase-by-phase history and roadmap

### Phase 0 — Planning and Architecture — **DONE**

**Goal:** decide what to build and how before writing code.

**Delivered:**
- Environment audit: Node 22.14.0, npm 10.9.2, Git 2.53.0, VS Code 1.139.1,
  MongoDB 8.2, GitHub CLI 2.103.3 authenticated as `Owais101074`.
- Monorepo decision and folder plan.
- Architecture: layered backend, feature modules.
- Database design: 10 collections and relationships.
- API contract conventions and planned endpoints.
- Public GitHub repository `ecommerce-platform`.
- `.gitignore`, `.gitattributes`, `.nvmrc`, `README.md`.
- Initial commit `53b113e` and verified push.

**Be able to explain:** why a monorepo, why layered architecture, what
collections exist, what `/api/v1` means, why money is stored in paise.

---

### Phase 1 — Backend Foundation — **DONE**

**Goal:** a running API skeleton with safety nets.

**Delivered:**
- Express 5 + TypeScript 6 scaffold with strict compiler options.
- ESLint 10 flat config and Prettier 3.
- `config/env.ts`: Zod-validated environment; invalid config exits at startup.
- `config/db.ts`: Mongoose connection, lifecycle logging, 5s server selection
  timeout, status helper.
- `ApiError` + central `errorHandler` handling Zod, Mongoose validation/cast,
  duplicate key, malformed JSON, unknown routes.
- `notFound` middleware, 10kb body limits, CORS with credentials,
  `x-powered-by` disabled, morgan logging in development.
- Graceful shutdown on SIGINT/SIGTERM with a 10-second forced exit,
  plus `unhandledRejection` / `uncaughtException` handling.
- `GET /api/v1/health` returning uptime and `database: "connected"`.
- Live verified: 200 health, 404 unknown route, 400 malformed JSON.
- Commits `332cb21`, `c5b8dd2`, `a686772`.

**Be able to explain:** why validate env at startup, why a single error
handler, why Express 5 removes `asyncHandler`, what graceful shutdown does.

---

### Phase 2 — Authentication and Authorization — **DONE**

**Goal:** secure accounts and role-based access.

**Delivered:**
- `users` collection with unique lowercase email, bcrypt hash, role, active flag,
  hashed refresh token and expiry.
- Zod register/login schemas and reusable `validate` middleware.
- bcryptjs hashing with configurable cost (default 12).
- Access token (15 min, Bearer) + refresh token (7 days, httpOnly cookie).
- Refresh rotation with hashed storage and reuse detection.
- `authenticate` (token → user) and `authorize(...roles)` middleware.
- `Request.user` type augmentation.
- Endpoints: register, login, refresh, logout, me, admin ping.
- `seed:admin` script.
- 18 live checks passed; typecheck, lint, format, build all pass.
- Commit `49f0fd7`.

**Be able to explain:** the two-token model, refresh rotation, reuse detection,
why the refresh token is in a cookie, why login errors are generic, the
difference between 401 and 403.

---

### Phase 3 — Product and Category Management — **DONE**

**Goal:** the catalogue.

**Delivered:**
- `categories` module: name, slug, optional parent, description, active flag;
  public nested tree; admin CRUD; cycle prevention; delete guards.
- `products` module: name, slug, description, price (paise), category, image
  URLs, stock, rating aggregates; admin CRUD and stock endpoint.
- Public listing with text search `q`, category slug, price range, rating,
  in-stock, sorting (`price_asc`, `price_desc`, `newest`, `rating`), and
  pagination with `meta`.
- Indexes: unique slugs, `(categoryId, price)`, `createdAt`, and a text index
  on product name/description.
- Reusable `slugify` + unique-slug generator, query-validation middleware, and
  query schemas.
- Idempotent `seed:catalog` script: 3 categories and 6 products.
- 34 live checks passed; typecheck, lint, format, and build pass.

**Be able to explain:** how slug collisions are resolved, why category deletion
is blocked, how the product filter object is built, why `countDocuments` runs
in parallel with the page query, and why text search needs an index.

**Key concepts learned:** Mongoose query filters, `$text`, `$in`, `$gte/$lte`,
whitelisted sort maps, pagination math, DTO mapping without leaking documents,
Express 5 read-only `req.query` (hence `validatedQuery`).

---

### Phase 4 — React Frontend Foundation — **DONE**

**Goal:** a typed frontend shell that talks to the API.

**Delivered:**
- Vite 8 + React 19 + TypeScript 6 client; Tailwind 4 through
  `@tailwindcss/vite`; `@theme` tokens for brand, ink and accent colours.
- Path alias `@/`, strict compiler options, ESLint 10 flat config, Prettier.
- Typed API layer: response envelope types, `ApiError` with status and field
  errors, `http` axios instance (`withCredentials`, env base URL, Bearer).
- Response interceptor: on 401 it performs one shared refresh and retries the
  original request once; auth endpoints are excluded to avoid loops.
- Access token kept in a module variable; the refresh token stays in the
  httpOnly cookie, so a reload restores the session.
- Deduplicated session bootstrap so React StrictMode cannot rotate twice.
- `AuthProvider` (status `loading` / `authenticated` / `guest`) exposing
  `login`, `register`, `logout`; logout clears the query cache.
- React Router 7 routes with `RequireAuth` and `RequireAdmin` guards and
  redirect-back after login.
- App shell: responsive header with mobile menu, footer, container.
- UI kit: button, input, alert, badge, spinner, skeleton, error state, loader.
- Pages: Home (hero, live counters, categories, newest products), Login,
  Register, Account, Admin, 404, route error.
- TanStack Query hooks: products, categories, admin ping; defaults skip retries
  on 4xx and cache for 60 seconds.

**Verification:** typecheck, lint, format check and build pass; browser checks
covered registration, reload restore, logout, guarded redirect, login return,
wrong password, customer vs admin, 404 and silent refresh after expiry.
Commit `0e6367f`.

#### UI refresh (after Phase 4 verification)

**Goal:** make the foundation feel like a curated store before Phase 5.

**Delivered:**
- Warm editorial tokens in `index.css`: cream/paper surfaces, forest-green
  brand, terracotta accent, Fraunces + Plus Jakarta Sans, soft/lift shadows,
  shimmer skeletons and reduced-motion overrides.
- New shared primitives: `BrandMark`, `PasswordInput` (show/hide with
  `aria-pressed`), `SectionHeading`; refreshed `Button`, `Badge`, `Input`,
  `Alert`, `ErrorState`, `PageLoader` and `Skeleton`.
- Shell: announcement bar, sticky cream header, hash-aware nav, accessible
  mobile menu, branded footer with live session links, and `ScrollManager`.
- Full-screen split `AuthLayout` for login and register, moved outside
  `AppLayout` without changing guards or redirect behaviour.
- Redesigned Home (hero, categories, manifesto, new arrivals, account CTA),
  Account, Admin, 404 and route-error pages.
- lucide-react icons and curated Unsplash photos for the six seeded products,
  applied to both the seed script and the existing development documents.

**Verification:** typecheck, lint and build pass; browser checks re-ran
registration, validation, password toggle, logout, login, wrong password,
admin promotion and `/admin/ping`, footer auth state, and the 404 page. The
in-app browser reported a 0×0 hidden viewport, so screenshots and scroll
offsets were not available; structure and computed styles were checked through
DOM snapshots instead. Commit `7295129`.

**Be able to explain:** why the access token is not in localStorage, how the
401 refresh-and-retry interceptor works, why the refresh promise is shared,
why session bootstrap is deduplicated under StrictMode, how `RequireAuth`
preserves the intended destination, why TanStack Query holds server state, and
how the envelope types keep the client aligned with the API.

**Key concepts learned:** React context with a typed value, controlled forms
with server field errors, `createBrowserRouter`, `Navigate` state, Axios
interceptors, module-level mutable state, `useQuery` loading/error states,
Tailwind 4 theme configuration, TypeScript generics over API envelopes.

---

### Phase 5 — Customer Shopping Experience — **DONE**

**Goal:** browse and discover products, and manage the account profile.

**Delivered:**
- `users` module with `GET /users/me`, `PATCH /users/me` and
  `PATCH /users/me/password`, all behind `authenticate`.
- Profile name validation (2–50 characters) with the refreshed user DTO
  returned to the client context.
- Password change: verify the current password, reject reuse of the old one,
  re-hash with bcrypt, clear the stored refresh hash/expiry, clear the refresh
  cookie, and ask the client to sign in again.
- Catalogue at `/products`: search, department, price range in rupees (sent as
  paise), rating, in-stock and sort controls; filters live in the URL; active
  filter chips; result count; skeleton, error and empty states; pagination.
- Product detail at `/products/:slug`: breadcrumbs, image gallery with
  thumbnails and fallback, stock badge and count, exact price, rating summary
  from stored aggregates, service notes and related products from the same
  department.
- Department page at `/categories/:slug`: hero, child departments, sort,
  product grid, pagination and links to the other departments.
- Account page: editable full name, read-only email, password change with
  confirm-password validation, and a re-login notice forwarded through the
  route guard to `/login`.
- Shared `Select`, `Pagination`, `Breadcrumbs` and `StockBadge`; `useProduct`
  and `useCategory` hooks; catalogue links in the header, home CTAs, category
  cards and product cards.
- Responsive layouts across the new pages (mobile filter toggle, stacked hero,
  fluid grids).

**Verification:** server live checks covered profile read/update, validation,
wrong-current-password rejection, old-password rejection, successful change,
refresh-cookie revocation, and old vs new password login. Browser checks covered
listing, filters, sorting, search, chip removal, product detail, unknown slugs,
department pages, profile update and the full password-change re-login flow.
`typecheck`, `lint`, `format:check` and `build` pass for both apps. The in-app
browser again reported a 0×0 hidden viewport, so screenshots and pointer clicks
were unavailable; structure and behaviour were checked through DOM snapshots,
DOM-triggered interactions, console and network logs. Commit `5878956`.

**Be able to explain:** why filters belong in the URL, how rupee inputs map to
integer paise, why the catalogue query is memoised, how the password change
invalidates every session, why the login notice is forwarded through the guard,
and why ratings are read from aggregates instead of a reviews collection yet.

**Key concepts learned:** `useSearchParams` as state, derived query objects with
`useMemo`, optional query hooks (`enabled`), controlled filter drafts syncing to
the URL, redirect state across guards, React context updates after a mutation,
and validating business rules (password reuse) in the service layer.

---

### Phase 6 — Cart and Wishlist — **PLANNED**

**Goal:** let customers save products.

**Will deliver:**
- Server-side cart: add, update quantity, remove, clear.
- Price-at-add snapshot and computed totals.
- Stock validation.
- Wishlist add/remove/list.
- TanStack Query mutations with optimistic updates (where appropriate).

---

### Phase 7 — Checkout and Address Management — **PLANNED**

**Goal:** turn a cart into an order before payment.

**Will deliver:**
- Address CRUD and default address.
- Checkout workflow and order summary.
- Shipping and tax calculated in integer paise.
- Coupon validation hook (full coupon management in Phase 10).
- Order draft creation with address and item snapshots.

---

### Phase 8 — Payment Integration — **PLANNED**

**Goal:** take money safely.

**Will deliver:**
- Razorpay order creation for an app order.
- Signature verification on the client response.
- Webhook endpoint with raw body and signature validation.
- Failed and abandoned payment handling.
- Idempotent payment records, one per order.

---

### Phase 9 — Order Management — **PLANNED**

**Goal:** manage the order lifecycle.

**Will deliver:**
- Order history and detail pages.
- Status transitions (placed → confirmed → shipped → delivered).
- Cancellation rules per status.
- Refund workflow linked to payment status.
- Admin order listing and status updates.

---

### Phase 10 — Admin Dashboard — **PLANNED**

**Goal:** operational control.

**Will deliver:**
- Admin login flow and dashboard layout.
- Sales analytics and revenue reports.
- Product, inventory, order, customer and coupon management.
- Cloudinary image uploads for products.
- Low-stock and top-product reports.

---

### Phase 11 — Testing and Security — **PLANNED**

**Goal:** prove correctness and harden the system.

**Will deliver:**
- Unit tests for services and utilities.
- Integration/API tests for critical flows.
- Frontend component tests.
- Rate limiting, security headers, stricter CORS.
- CSRF protection for cookie-based refresh.
- Auth hardening: token versioning, multi-device sessions if adopted.
- Centralized test data management.

---

### Phase 12 — Advanced Backend Engineering — **PLANNED**

**Goal:** production behaviour under load.

**Will deliver:**
- Redis caching for product listings and categories with invalidation.
- Background jobs (emails, cleanup, payment reconciliation).
- Email notifications for orders and account events.
- Structured logging with request correlation.
- Database index review and performance measurement.
- Docker and Docker Compose for API, MongoDB and Redis.

---

### Phase 13 — Deployment and CI/CD — **PLANNED**

**Goal:** ship it.

**Will deliver:**
- Frontend and backend deployment.
- Production MongoDB (Atlas or managed).
- Production environment variables and secrets management.
- Domain and HTTPS.
- GitHub Actions: typecheck, lint, tests, build.
- Production smoke tests.
- Complete README and deployment documentation.

---

## 10. Authentication deep dive

### 10.1 Why two tokens

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| Access | 15 minutes | Returned in JSON, kept in memory | Proves identity on API calls |
| Refresh | 7 days | httpOnly cookie, path `/api/v1/auth` | Obtains new access tokens |

A single long-lived token is dangerous: if stolen, the attacker has long access.
A single short token is annoying: the user logs in constantly. The pair solves
both problems, and the refresh token can be revoked server-side.

### 10.2 Token payloads

Access token:

```json
{ "sub": "<userId>", "role": "customer", "type": "access", "iat": 0, "exp": 0 }
```

Refresh token:

```json
{ "sub": "<userId>", "jti": "<uuid>", "type": "refresh", "iat": 0, "exp": 0 }
```

- `sub` = subject, the user id.
- `jti` = unique token id, prevents identical tokens from two logins in the
  same second.
- `type` = explicit guard against using one token as the other.
- Different secrets for access and refresh add a second layer of separation.

### 10.3 Registration workflow

```
POST /auth/register { name, email, password }
→ validate(registerSchema)          trim, lowercase, length checks
→ registerUser
   → User.exists({ email })         friendly duplicate check
   → hashPassword(password)         bcrypt cost 12
   → User.create(... role customer)
   → issueTokens
      → sign access + refresh
      → store SHA-256(refresh) + expiry
      → save user
→ set refresh cookie (httpOnly)
→ 201 { user, accessToken }
```

Refresh token is **never** returned in the JSON body.

### 10.4 Login workflow

```
POST /auth/login
→ validate(loginSchema)
→ findOne({ email }).select('+passwordHash')
→ bcrypt.compare
→ isActive check
→ issueTokens (new refresh hash replaces the old one)
→ set cookie
→ 200 { user, accessToken }
```

Unknown email and wrong password return the same 401 message. A disabled account
with the correct password gets 403.

### 10.5 Protected request workflow

```
GET /admin/ping
Authorization: Bearer <accessToken>
→ authenticate
   → require "Bearer " prefix
   → verify signature, expiry, type, role
   → User.findById(sub)
   → reject missing/inactive
   → req.user = { id, name, email, role, createdAt }
→ authorize('admin')
   → no user → 401
   → role not allowed → 403
→ controller → 200
```

The database is queried on every protected request so role changes and
deactivations apply immediately.

### 10.6 Refresh and rotation

```
POST /auth/refresh (cookie sent automatically)
→ read refreshToken cookie
→ verify JWT + type
→ load user with +refreshTokenHash +refreshTokenExpiresAt
→ no stored session              → 401
→ hash mismatch (old token)      → clear session, 401
→ stored expiry passed           → clear session, 401
→ otherwise issue new pair, save new hash, set new cookie → 200
```

Reuse detection: if an attacker replays an old refresh token, the hash no longer
matches, the session is cleared, and both the attacker and the legitimate user
must log in again. This converts silent theft into a visible logout.

### 10.7 Logout

```
POST /auth/logout
→ verify refresh token (invalid = no-op)
→ load user + refreshTokenHash
→ if hash matches, clear hash and expiry
→ clear cookie
→ 200
```

Logout is idempotent and cannot be triggered with a forged token.

### 10.8 Role-based access

- Roles: `customer`, `admin`.
- New registrations are always `customer`.
- Admins are created with `npm run seed:admin -- <email> <password> [name]`.
- `authorize('admin')` on a route returns 403 for customers.
- Admin role is read from the database on each request, not trusted blindly from
  the token.

### 10.9 Failure behaviour

| Situation | Status | Message |
|---|---|---|
| Missing Bearer header | 401 | Authentication required |
| Expired/garbage access token | 401 | Invalid or expired access token |
| Refresh token used as access token | 401 | Invalid or expired access token |
| Deleted/disabled user | 401 | Account is not available |
| Authenticated customer on admin route | 403 | You do not have permission... |
| Wrong password | 401 | Invalid email or password |
| Disabled account, correct password | 403 | Account is disabled |
| Duplicate email | 409 | Email is already registered |
| Invalid register body | 400 | Validation failed + field errors |
| No refresh cookie | 401 | Refresh token is required |
| Reused/logged-out refresh token | 401 | Session expired |

### 10.10 Known limitation

Only one refresh session is stored per user. Logging in on a second device
replaces the first device's refresh token, so the first device cannot refresh
(its access token still works for up to 15 minutes). The production fix is a
`sessions` collection with one hashed token per device and per-device revocation.

---

## 11. Running and testing

### Prerequisites

- Node.js 22 (`nvm use` reads `.nvmrc`)
- MongoDB running on `127.0.0.1:27017`
- npm 10+

### Setup

```bash
cd server
npm install
cp .env.example .env        # Windows CMD: copy .env.example .env
npm run dev                 # tsx watch on port 5000
```

Second terminal, from the repository root:

```bash
cd client
npm install
npm run dev                 # Vite on http://localhost:5173
```

The client reads `VITE_API_URL`; without a `client/.env` it falls back to
`http://localhost:5000/api/v1`.

Generate real secrets (never commit them):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice and put the values in `.env` as `JWT_ACCESS_SECRET` and
`JWT_REFRESH_SECRET`. They must be different and at least 32 characters.

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | development / test / production | development |
| `PORT` | HTTP port | 5000 |
| `MONGODB_URI` | MongoDB connection string | required |
| `CORS_ORIGIN` | allowed browser origins, comma-separated | http://localhost:5173 |
| `JWT_ACCESS_SECRET` | access token signing secret | required, 32+ chars |
| `JWT_REFRESH_SECRET` | refresh token signing secret | required, 32+ chars, different |
| `JWT_ACCESS_TTL_SECONDS` | access token lifetime | 900 |
| `JWT_REFRESH_TTL_SECONDS` | refresh token lifetime | 604800 |
| `BCRYPT_ROUNDS` | bcrypt cost | 12 |

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | tsx watch |
| `npm run build` | compile to `dist/` |
| `npm start` | run compiled build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with fixes |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run seed:admin -- <email> <password> [name]` | create/promote admin |
| `npm run seed:catalog` | seed sample categories and products (idempotent) |

Client commands (`cd client`):

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | type-check then build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier write / check |

### Quick manual checks

```bash
# health
curl http://localhost:5000/api/v1/health

# register (stores refresh cookie)
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Passw0rd123"}' \
  http://localhost:5000/api/v1/auth/register

# login
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Passw0rd123"}' \
  http://localhost:5000/api/v1/auth/login

# authenticated request (paste the access token)
curl -i -H "Authorization: Bearer <accessToken>" \
  http://localhost:5000/api/v1/auth/me

# refresh (cookie)
curl -i -b cookies.txt -X POST http://localhost:5000/api/v1/auth/refresh

# logout
curl -i -b cookies.txt -X POST http://localhost:5000/api/v1/auth/logout
```

Swagger/OpenAPI is not used yet. Phase 2 was tested with curl and can be
repeated in Postman; no Postman collection is committed.

### Verified Phase 2 results (18 checks)

| # | Check | Result |
|---|---|---|
| 1 | Register | 201 |
| 2 | Duplicate register | 409 |
| 3 | Validation errors | 400 with field list |
| 4 | Wrong password | 401 |
| 5 | `/auth/me` with token | 200 |
| 6 | `/auth/me` without token | 401 |
| 7 | Customer → `/admin/ping` | 403 |
| 8 | Refresh rotation | 200, cookie changed |
| 9 | Old refresh token reuse | 401 |
| 10 | New token after reuse detection | 401 |
| 11 | Fresh login | 200 |
| 12 | Logout | 200 |
| 13 | Refresh after logout | 401 |
| 14 | Server-side revocation | 401 |
| 15 | Admin login | 200 |
| 16 | Admin → `/admin/ping` | 200 |
| 17 | Garbage access token | 401 |
| 18 | Refresh token as access token | 401 |

`typecheck`, `lint`, `format:check` and `build` all pass.

### Verified Phase 3 results (34 checks)

| Area | Checks |
|---|---|
| RBAC | anonymous write 401, customer write 403 |
| Categories | create 201, duplicate slug `-2`, child creation, nested tree, cycle 400, detail by slug |
| Products | create 201, duplicate slug, validation 400, detail, update, stock update |
| Listing | pagination meta, text search, category filter, price range, ascending sort, in-stock filter |
| Validation | `minPrice > maxPrice` 400, unknown sort 400 |
| Deletion | category blocked 409 with products, empty child 204, product soft delete 404, category delete after cleanup 204 |
| Seed | first run 3 categories + 6 products, second run created 0 |

The development database currently contains the seeded catalogue: Electronics,
Fashion and Home, with six products.

### Verified Phase 4 results (browser)

| # | Check | Result |
|---|---|---|
| 1 | Home renders live counters, categories and products | 6 products, 3 departments |
| 2 | Register with valid data | session created, lands on `/account` |
| 3 | Reload `/account` | session restored from the refresh cookie |
| 4 | Sign out | session cleared, redirect to `/login` |
| 5 | Guest visits `/account` | redirected to `/login` with `from` state |
| 6 | Login after redirect | returns to `/account` |
| 7 | Wrong password | "Invalid email or password" alert |
| 8 | Customer visits `/admin` | "Admins only" panel, API never called |
| 9 | Admin visits `/admin` | `Admin access granted` from `/admin/ping` |
| 10 | Unknown URL | 404 page with title and home link |
| 11 | Expired access token (3s TTL test) | `/admin/ping` 401 → refresh 200 → retry 200 |
| 12 | Console | no React warnings or errors |

Test accounts were removed afterwards; the client build and both test suites
(typecheck, lint, format, build) pass.

### Verified UI refresh results (browser)

| # | Check | Result |
|---|---|---|
| 1 | Home data and media | 3 category cards, 4 new-arrival cards, all product images loaded at 900px width |
| 2 | Fonts and surfaces | Fraunces + Plus Jakarta Sans loaded; body background `rgb(250, 247, 241)` |
| 3 | Empty register submit | name, email and password errors shown; form not sent |
| 4 | Password toggle | `password` → `text` → `password`, label and `aria-pressed` update |
| 5 | Register valid data | 201, session created, lands on `/account` as customer |
| 6 | Sign out | cookie cleared, redirect to `/login` |
| 7 | Empty login submit | email and password required errors, both fields `aria-invalid` |
| 8 | Wrong password | "Invalid email or password" alert |
| 9 | Valid login | returns to `/account` |
| 10 | Admin promotion + reload | role shows ADMIN; `/admin` shows "Admin access granted" from `/admin/ping` |
| 11 | Footer while signed in | account link, plus admin console link for admins; no guest links |
| 12 | Unknown URL | 404 page with store and new-arrivals links |
| 13 | Console | no React warnings or errors; only the expected guest `/auth/refresh` 401 |
| 14 | Screenshots / scroll offsets | unavailable: in-app browser reported a 0×0 hidden viewport |

The UI test user was deleted from MongoDB after the run. The only API request
added by this refresh was the existing session bootstrap; no endpoints changed.

---

## 12. Engineering workflow

### Per-phase process

1. Work on one phase only.
2. Implement small tasks; inspect files before modifying.
3. Run typecheck → lint → format check → build.
4. Live-test every new endpoint, including failure paths.
5. Clean test data from the development database.
6. Update `PROJECT_CONTEXT.md`, `CHANGELOG.md`, `README.md`, `docs/api-contract.md`.
7. Scan for secrets; confirm `.env` is ignored.
8. Commit with Conventional Commits and push.
9. Verify the push with `git status -sb` and remote log.
10. Stop and produce a teaching review (A–I) before the next phase.

### Git conventions

- Branch `main` stays deployable.
- Future work may use `feat/<scope>` branches.
- Commit style: `feat(auth): add refresh token rotation`,
  `fix(products): reject negative stock`, `docs: update phase 3 endpoints`.

### Commit history so far

| Commit | Message |
|---|---|
| `53b113e` | chore(repo): initialize monorepo and phase 0 architecture docs |
| `332cb21` | feat(server): add Express TypeScript foundation with health check |
| `69d9963` | docs: record phase 0 repository setup and completion status |
| `c5b8dd2` | docs: mark phase 1 complete and document server setup |
| `a686772` | refactor(server): remove unused ApiError flag |
| `49f0fd7` | feat(auth): add JWT authentication and role-based access |
| `1639558` | feat(catalog): add category and product management |
| `0e6367f` | feat(client): add React frontend foundation |
| `fa30e3e` | docs: record phase 4 commit in project guide |
| `7295129` | feat(ui): refresh storefront design and shared primitives |

---

## 13. Interview and explanation Q&A

### Architecture

**Q1. Explain the architecture.**  
Express 5 app split into feature modules. Each module has routes, controller,
service, model. Routes wire middleware, controllers handle HTTP, services hold
business logic, models define schemas. Shared concerns live in middleware and
utils.

**Q2. Why not put everything in the route handler?**  
It becomes untestable and unmaintainable. Separating HTTP from business logic
lets services be reused and unit-tested without Express.

**Q3. Why a monorepo?**  
One repository and one documentation set for client and server. Each app still
has its own dependencies and deploys independently.

**Q4. Why Express 5?**  
Async handler rejections are forwarded to error middleware automatically, so no
`asyncHandler` wrapper is needed. It also has improved routing internals.

**Q5. How do errors stay consistent?**  
Every expected failure throws `ApiError`; the single error middleware formats
ApiError, Zod, Mongoose, duplicate-key and JSON errors into the same envelope.

**Q6. What is the response envelope and why?**  
`{ success, message, data, errors?, meta? }`. The frontend handles one shape
everywhere, with pagination metadata separated from data.

**Q7. Why `/api/v1`?**  
Versioning lets breaking changes ship under `/v2` while old clients keep working.

**Q8. What happens on an unknown route?**  
`notFound` middleware creates a 404 `ApiError`, which the error handler formats.

### Database

**Q9. Why MongoDB?**  
Product documents vary (sizes, attributes, images) and evolve quickly; documents
map naturally to those shapes. Mongoose adds schema validation and indexes.

**Q10. Why store prices in paise?**  
JavaScript floats produce rounding errors (`0.1 + 0.2`). Integer paise makes
totals, tax and refunds exact.

**Q11. Why soft delete?**  
Orders must keep referencing products and users that are no longer for sale.
`isActive` hides them without breaking history.

**Q12. Why snapshots in orders?**  
Prices and addresses change. Snapshotting preserves what the customer actually
agreed to at purchase time.

**Q13. Why a unique index on email if code already checks?**  
The check can race between two concurrent requests. The index is the actual
guarantee; the application handles error `11000` as a 409.

**Q14. Why `(userId, productId)` unique on reviews?**  
Prevents duplicate reviews from the same customer for the same product at the
database level.

**Q15. Why store `refreshTokenHash` instead of the token?**  
A database leak would otherwise hand attackers working refresh tokens. SHA-256
lets us compare without storing anything usable.

**Q16. Why `select: false` on secrets?**  
Any future `res.json(user)` cannot accidentally expose the password hash or
refresh fields; they must be explicitly selected.

### Authentication and security

**Q17. Why bcrypt and not SHA-256 for passwords?**  
SHA-256 is fast, so attackers can try billions of guesses. bcrypt is
deliberately slow and salted, making brute force expensive.

**Q18. Why cost 12?**  
A balance between security and login latency. Higher is safer but slower.

**Q19. Why access + refresh tokens?**  
A short access token limits damage if leaked; a long refresh token keeps the
user logged in and can be revoked.

**Q20. Why is the refresh token in an httpOnly cookie?**  
JavaScript cannot read it, so XSS cannot steal it. The access token stays in
memory and is sent explicitly.

**Q21. What is refresh token rotation?**  
Each refresh issues a new refresh token and replaces the stored hash. The old
token stops working.

**Q22. What is reuse detection?**  
Presenting an already-rotated token means someone replayed it. We clear the
session and force a fresh login.

**Q23. Difference between 401 and 403?**  
401 = not authenticated (missing/bad credentials). 403 = authenticated but not
allowed (for example, customer on an admin route).

**Q24. Why not trust the role inside the JWT?**  
It can be up to 15 minutes stale. Loading the user makes deactivation and role
changes immediate.

**Q25. Why is the login error generic?**  
Different messages reveal which emails have accounts (account enumeration).

**Q26. Why check password before `isActive`?**  
Otherwise a disabled-account response reveals the account exists to someone who
does not know the password.

**Q27. How is CSRF handled?**  
Cookie is `sameSite=lax` and scoped to `/api/v1/auth`, so cross-site POSTs do
not carry it. A separate-domain deployment will need a CSRF token.

**Q28. What would you add before production?**  
Rate limiting, security headers, CSRF protection for cross-site cookies,
multi-device sessions, token versioning, audit logs, and automated tests.

### TypeScript

**Q29. Why `interface` for documents and `type` for unions?**  
Interfaces describe object shapes and can be extended; type aliases are better
for unions and composed types. Both are erased at runtime.

**Q30. What does `z.infer` do?**  
Creates a TypeScript type from a Zod schema, so validation and typing share one
source of truth.

**Q31. What is `HydratedDocument<IUser>`?**  
A Mongoose document type: the fields plus `_id`, `save()`, and other document
methods.

**Q32. What is module augmentation in `express.d.ts`?**  
It adds `user?: AuthUser` to Express's `Request`, so `req.user` is typed
everywhere without casting.

**Q33. What is a closure in middleware?**  
`authorize(...roles)` returns a function that captures `roles`. Express calls
the returned function per request.

**Q34. Why no `any`?**  
`any` disables type checking and hides bugs. We use `unknown` plus narrowing
(for cookies) and narrow casts only after runtime validation.

### Project and process

**Q35. How is the project organised into phases?**  
Fourteen phases from planning to deployment. Each phase has a single concern,
ends with verification, documentation, commit and push, then a teaching review.

**Q36. How do you ensure quality without a test suite yet?**  
Typecheck, lint, format, build, and manual/Postman checks of success and failure
paths. Automated tests arrive in Phase 11; the API is designed for testability.

**Q37. What would you do differently?**  
Add automated tests earlier, use a sessions collection for multi-device refresh,
and add OpenAPI/Swagger generation from Zod schemas.

**Q38. What is the hardest part so far?**  
Refresh rotation with reuse detection: coordinating JWT expiry, hashed storage,
and session revocation without leaking which check failed.

**Q39. How does product filtering work?**  
A Mongoose filter object is built conditionally: `isActive: true`, optional
`$text` search, `categoryId` from the category slug lookup, `price` with
`$gte/$lte`, `ratingAvg` with `$gte`, and `stock > 0`. A whitelisted sort map
prevents arbitrary field sorting. The same filter is used for `countDocuments`
and the paginated `find`.

**Q40. Why generate slugs instead of using ObjectIds in URLs?**  
Slugs are readable and better for SEO (`/products/wireless-mouse`). The unique
index guarantees no collision, and the `-2` suffix resolves duplicate names.

**Q41. Why validate `req.query` into `validatedQuery` instead of assigning
`req.query`?**  
Express 5 defines `req.query` as a read-only getter. Parsed values are stored on
a separate typed property so controllers receive numbers and booleans, not raw
strings, without fighting the framework.

**Q42. Why block category deletion instead of cascading?**  
Cascading deletes could silently remove products and break order history.
Returning 409 forces an explicit decision: move or deactivate products first.

**Q43. Why keep the access token in memory instead of localStorage?**  
localStorage is readable by any script running on the page, so one XSS bug
leaks a usable token. An in-memory token disappears on reload, and the session
is rebuilt from the httpOnly refresh cookie that JavaScript cannot read.

**Q44. How does the 401 refresh-and-retry interceptor work?**  
Every response passes through an interceptor. On 401 (except on auth routes) it
sets a `_retried` flag, awaits one shared refresh promise, updates the
Authorization header and replays the request. If the refresh fails, listeners
clear the session and the user becomes a guest.

**Q45. Why share a single refresh promise between parallel requests?**  
Refresh tokens rotate. If three queries 401 at once and each refreshes, two of
them would use an already-invalidated token and the backend would treat it as
reuse. One promise means one rotation for the whole page.

**Q46. Why is session bootstrap deduplicated?**  
React StrictMode runs effects twice in development. Two bootstraps would send
the same refresh cookie twice; the second would look like token reuse and clear
the session. A module-level promise makes both effect runs await one request.

**Q47. What is the difference between server state and session state here?**  
Server state (products, categories, ping) is cached, retried and invalidated by
TanStack Query. Session state (who is signed in) lives in a small context and
changes only on login, refresh or logout.

### "Explain the project in a deeper 2 minutes"

> "The repo is a monorepo with a React client and an Express API. The API is
> organized by feature: auth, health, admin now; products, categories, cart,
> orders, payments, reviews, coupons next. Each feature has routes, controller,
> service and model, with validation and auth middleware in between. MongoDB
> stores users with bcrypt hashes and a hashed refresh token. Authentication
> issues a 15-minute access token and a 7-day refresh token in an httpOnly
> cookie; refresh rotates the token and detects replay. Authorization is
> role-based. Errors flow through one handler and every response uses one
> envelope. Phase 1 added the foundation and health check; Phase 2 added auth
> and RBAC with 18 verified scenarios; Phase 3 added the catalogue: categories
> with a nested tree, products with admin CRUD, text search, filters, sorting
> and pagination, verified by 34 checks. Phase 4 adds the React foundation:
> a typed Axios layer with silent token refresh, an auth context that restores
> the session from the httpOnly cookie, guarded routes, a responsive app shell,
> and live catalogue data on the home page."

---

## 14. Glossary

| Term | Meaning |
|---|---|
| Access token | Short-lived JWT proving identity |
| Refresh token | Long-lived token used to obtain new access tokens |
| Rotation | Replacing the refresh token on every refresh |
| Reuse detection | Revoking a session when an old refresh token is replayed |
| RBAC | Role-based access control (`customer`, `admin`) |
| Middleware | Function running between request and controller |
| DTO | Data transfer object; the safe shape returned to clients |
| Envelope | Standard success/error JSON wrapper |
| Soft delete | Marking inactive instead of removing |
| Snapshot | Copy of data stored at a point in time |
| Paise | 1/100 of a rupee; integer money unit |
| Slug | URL-friendly unique name, e.g. `wireless-mouse` |
| Idempotent | Repeating the operation gives the same result |
| `select: false` | Mongoose field hidden unless explicitly requested |
| Hydrated document | Mongoose document instance, not a plain object |
| CSRF | Cross-site request forgery |
| XSS | Cross-site scripting |
| JWT `sub` | Subject claim, here the user id |
| JWT `jti` | Unique token id claim |

---

## 15. Known limitations and deferred work

| Area | Limitation | Plan |
|---|---|---|
| Frontend depth | Catalogue, detail, department and account screens are built; no cart or checkout UI yet | Phase 6 |
| Profile API | Name and password only; email changes and avatar upload are not built | Later |
| Client tests | Manual browser checks only | Phase 11 |
| UI verification | No screenshots captured; in-app browser had no viewport | Re-check visuals when a real browser is available |
| Catalogue images | One image per seeded product, so the gallery is exercised by code but not by sample data | Add more images in Phase 10 |
| Product images | URL strings only, no upload | Cloudinary in Phase 10 |
| Ratings | Aggregate fields exist but no review documents | Phase 11 |
| Multi-device sessions | One refresh hash per user | Sessions collection later |
| Automated tests | Manual checks only | Phase 11 |
| Rate limiting | Not implemented | Phase 11 |
| CSRF token | Not needed for same-site dev; required for cross-site prod | Phase 11 |
| Swagger/OpenAPI | Not implemented | Optional later |
| Redis, jobs, email | Not implemented | Phase 12 |
| Docker | Not installed | Phase 12 |
| Deployment/CI | Not implemented | Phase 13 |
| Admin seed cleanup | Test admin deleted after verification | Create your own with the script |

Known bugs: none.

---

## 16. Next step

Phase 6 — Cart and Wishlist: server-side carts with quantity and price-at-add
snapshots, stock validation, wishlist add/remove/list, and the client mutations
(TanStack Query) that drive the shopping UI.

Do not start until the reviewer explicitly says:

```
PHASE COMPLETED — START NEXT PHASE
```
