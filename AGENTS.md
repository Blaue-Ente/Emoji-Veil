# AGENTS.md

## Cursor Cloud specific instructions

This is a pnpm workspace (Node.js, TypeScript). See `replit.md` for the canonical command list and stack notes. The dependency refresh (`pnpm install`) runs automatically via the startup update script, so you normally only need to start/run services.

### Services / packages
- `@workspace/emoji-encrypt` (`artifacts/emoji-encrypt`) — the primary product: a **purely client-side** Vite + React app ("Emoji Encrypt for LLM"). It does not call the API server or DB.
- `@workspace/mockup-sandbox` (`artifacts/mockup-sandbox`) — dev/design tooling sandbox, not part of the shipped product.
- `@workspace/api-server` (`artifacts/api-server`) — Express scaffold with only a health route; not used by the emoji-encrypt app.
- `@workspace/db` (`lib/db`) — Drizzle/Postgres scaffold. `pnpm --filter @workspace/db run push` requires `DATABASE_URL` (Postgres). Not needed to run the emoji-encrypt app.
- `lib/api-client-react`, `lib/api-zod`, `lib/api-spec` — generated API client/schemas (codegen via `pnpm --filter @workspace/api-spec run codegen`).

### Running the app (gotchas)
- Run the main app with: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/emoji-encrypt run dev` (serves on port 5000).
- **Vite configs require both `PORT` and `BASE_PATH` env vars** even for `build` — they throw immediately if unset. Because of this, the root `pnpm run build` fails at the `mockup-sandbox`/`emoji-encrypt` build step when those vars are not set. To build the main app, pass them: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/emoji-encrypt run build`.
- `pnpm run typecheck` works without any env vars and covers all packages.

### Other notes
- pnpm is enforced; a `preinstall` hook rejects npm/yarn and deletes their lockfiles.
- `.npmrc` sets `minimumReleaseAge: 1440` (24h), so brand-new npm releases may be blocked from install for a day (security policy — do not disable).
