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

### Decisions

- Monorepo with independently versioned `client` and `server` apps.
- Local MongoDB 8.2 for development.
- Money stored as integer paise; no floating point for prices.
- Access token + httpOnly refresh token authentication.
- Cloudinary uploads deferred to Phase 10; Phase 3 uses image URLs.
