# Server instructions

These instructions extend the repository-level `AGENTS.md` for work under `server/`.

## Architecture

- Keep HTTP parsing, guards, and response shaping in controllers; keep business rules in services.
- Validate external input through DTOs and the global validation pipeline.
- Keep database access behind injected services and scope every user-owned query by the authenticated user.
- Prefer one ownership query over repeated per-item checks. Use Prisma transactions when a logical operation spans multiple writes.
- Keep filesystem and database state consistent: validate authorization before writing files and compensate for partial failures.
- Use Nest logging instead of ad hoc production `console` calls when touching operational paths.

## Security and data

- Treat authentication, refresh tokens, password recovery, uploads, exports, and deployment configuration as security-sensitive areas.
- Do not weaken secure cookie, validation, CORS, Helmet, upload-size, or MIME/type checks without an explicit requirement.
- Use configuration injection for new environment-dependent behavior and fail fast when required production configuration is missing.
- Never use a development or production database for automated tests. Tests that need PostgreSQL must use an isolated disposable database.
- Add a new Prisma migration for schema changes; never edit an applied migration.

## Verification

- Run lint, format check, TypeScript, and a production build for code changes.
- Add focused unit tests for business rules and integration tests for API/database behavior once the test harness is available.
- Migration and upload changes require explicit failure-path verification, not only a successful-path check.
