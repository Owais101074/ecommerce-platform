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

### Fixed

- **Phase 1** — TypeScript 6 rejects `moduleResolution: node`; switched to
  `nodenext` while still emitting CommonJS.
- **Phase 1** — dotenv 18 startup banner suppressed with `quiet: true`.

### Decisions

- Monorepo with independently versioned `client` and `server` apps.
- Local MongoDB 8.2 for development.
- Money stored as integer paise; no floating point for prices.
- Access token + httpOnly refresh token authentication.
- Cloudinary uploads deferred to Phase 10; Phase 3 uses image URLs.
