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

### Verified

- Phase 2 live checks (18): register 201, duplicate 409, validation 400,
  wrong password 401, `/auth/me` 200/401, customer → admin route 403,
  admin → admin route 200, garbage token 401, refresh token used as access
  token 401, refresh rotation 200, old token reuse 401, rotated token after
  reuse 401, logout 200, refresh after logout 401, server-side revocation 401.
- `typecheck`, `lint`, and `build` pass.
