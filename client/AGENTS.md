# Client instructions

These instructions extend the repository-level `AGENTS.md` for work under `client/`.

## Architecture

- Preserve the Feature-Sliced Design direction: `app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`.
- Higher layers may compose lower layers; lower layers must not import from higher layers.
- Keep domain types in `entities`, user-facing scenarios in `features`, composed sections in `widgets`, and generic infrastructure in `shared`.
- Use the existing `@/` alias and public `index.ts` exports where the surrounding slice already exposes them.
- Use the shared `apiClient` for HTTP and TanStack Query for server state. Keep Zustand for genuinely client-side shared state.

## React and UI

- Use function components and hooks; keep side effects at integration boundaries.
- Preserve React Compiler compatibility. Do not add manual memoization without measured need.
- Reuse existing UI primitives and design tokens before introducing a new component or dependency.
- Preserve keyboard access, focus behavior, reduced-motion support, responsive behavior, loading states, and actionable error messages.
- For changes to task ordering, dates, authentication, uploads, or caching, verify both optimistic UI behavior and recovery after request failure.

## Verification

- Run lint, format check, both TypeScript checks, and a production build for code changes.
- For visible changes, inspect the affected flow at relevant desktop and mobile widths.
- Add focused tests for new non-trivial behavior once the test harness is available.
