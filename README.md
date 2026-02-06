# Codex CMS demo

Storefront + admin CMS demo built with Next.js, Supabase, and Codex-driven theme generation.  
Current state includes:
- Fixed theme request backend typing/build issues.
- Refreshed modern UI for storefront, login, and admin.
- Cloudflare Workers deployment support via OpenNext + Wrangler.

## Stack
- Next.js 16 (App Router) + Tailwind CSS.
- Supabase Auth + Postgres + Storage.
- GitHub issue-based Codex theme generation (`openai/codex-action@v1`).
- Cloudflare Workers runtime via `@opennextjs/cloudflare`.

## Data model
- `products`: storefront catalog.
- `events`: campaign/event schedule.
- `themes`: event-linked theme requests and rollout state (`requested`, `building`, `ready`, `failed`) with `enabled` toggle.
- Supabase storage bucket: `product-images` (public).

## Theme behavior
- The storefront only applies a theme when a theme row is both:
  - `status = ready`
  - `enabled = true`
- Base UI stays unchanged when no eligible theme exists.
- Existing scoped themes currently include:
  - `merry-christmas`
  - `new-years-event`

## Setup
1. Install dependencies:
   - `npm install`
2. Configure env:
   - `cp .env.local.example .env.local`
   - Fill:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `GITHUB_TOKEN`
     - `GITHUB_REPO_OWNER`
     - `GITHUB_REPO_NAME`
3. Apply SQL migrations from `supabase/migrations`.
4. Start dev server:
   - `npm run dev`

## App routes
- `/`: storefront (public browsing)
- `/login`: admin login (Supabase auth)
- `/admin`: products/events/theme management
- `/api/themes`: creates theme request row + GitHub issue

## Scripts
- `npm run dev`: local Next.js dev server.
- `npm run build`: production Next build.
- `npm run start`: run Next production server.
- `npm run lint`: ESLint checks.
- `npm test`: Vitest test suites.
- `npm run build:cf`: OpenNext Cloudflare build.
- `npm run preview:cf`: local Cloudflare Worker preview.
- `npm run deploy:cf`: build + deploy to Cloudflare.

## Deploy to Cloudflare Workers
This repo is preconfigured with:
- `open-next.config.ts`
- `wrangler.jsonc`
- Next Cloudflare dev init in `next.config.ts`

1. Login to Cloudflare:
   - `npx wrangler login`
2. Optional local worker env file:
   - `cp .dev.vars.example .dev.vars`
3. Build worker bundle:
   - `npm run build:cf`
4. Preview locally:
   - `npm run preview:cf`
5. Set Cloudflare secrets (runtime):
   - `npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL`
   - `npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `npx wrangler secret put GITHUB_TOKEN`
   - `npx wrangler secret put GITHUB_REPO_OWNER`
   - `npx wrangler secret put GITHUB_REPO_NAME`
6. Deploy:
   - `npm run deploy:cf`

Notes:
- Worker entrypoint is generated at `.open-next/worker.js`.
- `nodejs_compat` is enabled in `wrangler.jsonc`.
- For CI deployments, provide the same env/secrets before running `npm run build:cf`.

## Codex theme flow
1. Admin submits a theme request from `/admin`.
2. `/api/themes` validates session, inserts a `themes` row, and opens a GitHub issue (`codex-request`, `theme`).
3. `.github/workflows/codex-theme.yml` runs Codex with strict storefront-only scope (`src/app/page.tsx`, `src/app/globals.css`).
4. After PR merge, enable the theme row in admin.
5. Storefront reads latest `ready + enabled` theme and sets `data-theme`.

## Testing
- Run tests: `npm test`
- Coverage focus:
  - Workflow prompt constraints (`tests/codex-workflow.test.ts`)
  - Theme toggle rules (`tests/home-theme-toggle.test.tsx`)
  - Nav auth states (`tests/storefront-nav.test.tsx`)
  - Admin theme request/toggle behavior (`tests/admin-dashboard.test.tsx`)
