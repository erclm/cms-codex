# Codex CMS demo

MVP storefront + admin for an ecommerce CMS. Built with Next.js (App Router), Tailwind, Supabase Auth/Postgres, and a GitHub Action that runs `openai/codex-action@v1` to generate new storefront themes from GitHub issues.

## Stack and data model
- Next.js 16 + App Router, Tailwind CSS, and a minimal component set.
- Supabase: `products`, `events`, and `themes` tables with RLS; storage bucket `product-images` for uploads (public).
- Auth: any authenticated user is treated as an admin for the demo.
- Migrations live in `supabase/migrations` and seed sample products/events.

## Prereqs and setup
1) Install dependencies: `npm install`  
2) Copy envs: `cp .env.local.example .env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.
   - `GITHUB_TOKEN` (repo scope), `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME` so API routes and the workflow can open issues/commits.
3) Apply Supabase migrations (via Supabase CLI or dashboard SQL) to create tables, RLS, seed rows, and the `product-images` bucket.
4) Start local dev: `npm run dev` and open http://localhost:3000

## Local usage
- Storefront (`/`): lists published products/events; anonymous users can browse.
- Login (`/login`): email/password auth; any account in Supabase Auth acts as admin.
- Admin (`/admin`): CRUD for products/events, upload product images to `product-images`, request a Codex-built theme tied to an event.

## Codex theme flow
1) From `/admin`, pick an event and submit the theme request form. The API (`/api/themes`) checks the Supabase session, inserts a `themes` row in `requested` -> `building` state, and opens a GitHub issue with labels `codex-request` and `theme`. The issue body includes the event/title/notes for traceability.
2) `.github/workflows/codex-theme.yml` triggers when the `codex-request` label is present. Concurrency serializes per issue: `codex-theme-<issue number>`.
3) The workflow checks out the default branch, prepares `codex-theme-<issue>` branch, and runs `openai/codex-action@v1` with a prompt that enforces:
   - Touch storefront only (`src/app/page.tsx`, `src/app/globals.css`); admin/auth/tests stay untouched.
   - Keep the diff small and reuse existing tokens; no extra assets/routes.
   - Preserve prior theme definitions; append new `data-theme` scopes rather than replacing existing ones.
   - Make the theme toggleable only when a theme row is both `enabled` and `status=ready`; never force-enable in code.
   - Respect the GitHub issue title as the requested mood and include issue body notes verbatim.
4) Workflow drops any workflow file edits, commits/pushes the branch, then comments on the issue with compare link and the Codex summary.
5) Once the PR is merged, toggle the theme to `enabled=true` in `/admin` for the associated event. The storefront reads the latest ready+enabled theme and sets `data-theme` accordingly.

### Prompting tips for Codex
- Issue title = the vibe/mood you want (e.g., “Desert dusk storefront”).
- Issue body = specific requests (colors, layout hints, must-keep elements). These notes are injected into the Codex prompt verbatim.
- Ensure the issue carries the `codex-request` label so the workflow runs. Label can be applied at creation or after.
- Keep notes focused on storefront styling; admin and tests are intentionally excluded.

### Codex prompt breakdown (from `.github/workflows/codex-theme.yml`)
- Role: “Generate a refreshed storefront theme for this Next.js + Tailwind ecommerce demo.”
- Scope guardrails: keep all data fetching/logic; edit only `src/app/page.tsx` + `src/app/globals.css`; do not touch admin/auth/tests; avoid new assets/routes; keep the diff small and reuse tokens.
- Theme behavior: preserve existing theme definitions; append a new `data-theme` block; never enable by default—only apply when Supabase theme row is `enabled` and `status=ready`; base look must stay unchanged when the flag is off.
- Inputs: requested mood = GitHub issue title; notes = full issue body injected under a divider; workflow runs on the default branch for stability.
- Quality: maintain accessibility, contrast, and mobile responsiveness; keep generation quick.

## Testing
- Run all tests: `npm test`
- What the suites cover:
  - `tests/codex-workflow.test.ts`: asserts the GitHub workflow prompt stays strict (toggleable theme flag, storefront-only edits, concurrency, preserve themes, include issue body).
  - `tests/home-theme-toggle.test.tsx`: ensures the storefront only applies `data-theme` when a theme is ready+enabled and falls back to the base look otherwise.
  - `tests/storefront-nav.test.tsx`: checks nav accessibility label and login/logout/admin button states driven by Supabase auth.
  - `tests/admin-dashboard.test.tsx`: validates the theme request form payload, prevents auto-enable, and verifies enable/disable toggling writes to `themes.enabled`.
- Tests run with Vitest + jsdom; see `tests/setup.tsx` for Next.js mocks.
