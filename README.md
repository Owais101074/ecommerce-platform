# E-commerce Platform

A production-style e-commerce application built phase by phase, with a focus on
clean architecture, TypeScript, and real-world backend practices.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, lucide-react |
| Backend | Node.js, Express, TypeScript, REST, JWT, Zod |
| Database | MongoDB + Mongoose |
| Tooling | Git, GitHub CLI, ESLint, Prettier, Postman |

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

| Phase | Description | Status |
|---|---|---|
| 0 | Planning and architecture | Complete |
| 1 | Backend foundation | Complete |
| 2 | Authentication and authorization | Complete |
| 3 | Products and categories | Complete |
| 4 | Frontend foundation + storefront UI refresh | Complete |
| 5 | Customer shopping experience | Complete |
| 6 | Cart and wishlist | Not started |
| 7 | Checkout and addresses | Not started |
| 8 | Payments | Not started |
| 9 | Order management | Not started |
| 10 | Admin dashboard | Not started |
| 11 | Testing and security | Not started |
| 12 | Advanced backend | Not started |
| 13 | Deployment and CI/CD | Not started |

## Documentation

- [Project context](PROJECT_CONTEXT.md) — architecture, decisions, current state
- [Project guide](PROJECT_GUIDE.md) — complete phase-by-phase guide, workflows and explanations
- [API contract](docs/api-contract.md) — planned endpoints and conventions
- [Changelog](CHANGELOG.md)

## Getting started

### Prerequisites

- Node.js 22 (`nvm use` reads `.nvmrc`)
- MongoDB running locally on `127.0.0.1:27017`

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
    "timestamp": "2026-11-02T13:52:18.689Z"
  }
}
```

### Server scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with tsx watch (reloads on save) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | TypeScript check, no output files |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run seed:admin -- <email> <password> [name]` | Create an admin or promote an existing user |
| `npm run seed:catalog` | Seed sample categories and products (idempotent) |

### Authentication (Phase 2)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/register` | public |
| POST | `/api/v1/auth/login` | public |
| POST | `/api/v1/auth/refresh` | refresh cookie |
| POST | `/api/v1/auth/logout` | refresh cookie |
| GET | `/api/v1/auth/me` | access token |
| GET | `/api/v1/admin/ping` | admin access token |

Access tokens live for 15 minutes and are sent as `Authorization: Bearer <token>`.
The refresh token is stored in an httpOnly cookie and rotated on every refresh;
reusing an old refresh token revokes the session.

### Catalogue (Phase 3)

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/categories` | public |
| GET | `/api/v1/categories/:slug` | public |
| POST / PATCH / DELETE | `/api/v1/categories...` | admin |
| GET | `/api/v1/products` | public |
| GET | `/api/v1/products/:slug` | public |
| POST / PATCH / DELETE | `/api/v1/products...` | admin |
| PATCH | `/api/v1/products/:id/stock` | admin |

`GET /api/v1/products` supports `q`, `category`, `minPrice`, `maxPrice`,
`rating`, `inStock`, `sort`, `page`, and `limit`. Prices are integer paise.

### Profile (Phase 5)

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/v1/users/me` | access token |
| PATCH | `/api/v1/users/me` | access token |
| PATCH | `/api/v1/users/me/password` | access token |

`PATCH /users/me` updates the name. `PATCH /users/me/password` verifies the
current password, rejects reuse of the old password, hashes the new one, revokes
the stored refresh session and clears the refresh cookie.

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

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check, no output files |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

Client routes:

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Home with live category and product previews |
| `/products` | public | Catalogue with search, filters, sorting and pagination |
| `/products/:slug` | public | Product gallery, price, stock, ratings and related items |
| `/categories/:slug` | public | Department hero with its products |
| `/login` | public | Sign in |
| `/register` | public | Create account |
| `/account` | signed in | Editable profile, password change and session details |
| `/admin` | admin | Role-guarded connectivity check |

The access token is kept in memory only; a reload restores the session through
the httpOnly refresh cookie, and a 401 triggers one silent refresh and retry.

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
