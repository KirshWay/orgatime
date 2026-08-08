# Orgatime

Orgatime is a task-management application with a React client and a NestJS API.

## Repository map

- `client/`: React 19, Vite, Feature-Sliced Design, TanStack Query, and PWA support.
- `server/`: NestJS, Prisma, PostgreSQL, authentication, and file uploads.
- `.github/workflows/`: build and deployment automation.
- `docker-compose.yml`: production Docker Swarm stack.
- `scripts/bump-version.sh`: release command that commits, tags, and pushes.

Read the root README and the README for the area you change before making architectural changes.

## Working rules

- Inspect `git status` before writing and preserve all pre-existing changes.
- Keep each change scoped to one coherent outcome. Do not perform unrelated cleanup.
- Treat `develop` as the normal development base and `main` as the release branch unless the task says otherwise.
- Do not commit, push, merge, create tags, deploy, or run `scripts/bump-version.sh` unless the user explicitly requests that action.
- Never read, print, copy, or commit secrets. Keep `.env*`, credentials, tokens, runtime data, uploads, logs, and generated output out of Git.
- Use the package-manager version declared in each `package.json`; do not switch package managers or update dependencies without a task-specific reason.
- Do not rewrite existing Prisma migration history. Schema changes require a new migration and explicit verification.
- Prefer deterministic checks over subjective review. Report checks that were skipped and why.
- Do not create repository-local task boards, current-task files, or generated progress journals.

## Verification

Run checks for every affected area. For cross-cutting changes, run both sets.

Client:

```bash
cd client
pnpm lint
pnpm format:check
pnpm exec tsc -p tsconfig.app.json --noEmit --incremental false
pnpm exec tsc -p tsconfig.node.json --noEmit --incremental false
pnpm build
```

Server:

```bash
cd server
pnpm lint
pnpm format:check
pnpm exec tsc -p tsconfig.json --noEmit --incremental false
pnpm build
```

Run focused automated tests when they exist. Do not start databases, apply migrations, or use production credentials merely to satisfy a check.
