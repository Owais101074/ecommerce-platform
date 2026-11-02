# E-commerce Platform

A production-style e-commerce application built phase by phase, with a focus on
clean architecture, TypeScript, and real-world backend practices.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios |
| Backend | Node.js, Express, TypeScript, REST, JWT, Zod |
| Database | MongoDB + Mongoose |
| Tooling | Git, GitHub CLI, ESLint, Prettier, Postman |

## Repository layout

```
ecommerce-platform/
├── client/   React application (initialized in Phase 4)
├── server/   Express API (initialized in Phase 1)
├── docs/     API contract and technical references
├── PROJECT_CONTEXT.md   Living project state (read this first)
├── CHANGELOG.md
└── README.md
```

## Project status

| Phase | Description | Status |
|---|---|---|
| 0 | Planning and architecture | In progress |
| 1 | Backend foundation | Complete |
| 2 | Authentication and authorization | Not started |
| 3 | Products and categories | Not started |
| 4 | Frontend foundation | Not started |
| 5 | Shopping experience | Not started |
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

## Author

Owais — [GitHub](https://github.com/Owais101074)
