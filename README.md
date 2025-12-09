# Codex CMS demo

MVP storefront + admin for an ecommerce CMS. Uses Next.js (App Router), Tailwind, Supabase Auth/Postgres, and a GitHub Action that runs `openai/codex-action@v1` to generate new themes via issues.

## Setup

1) Install deps: `npm install`  
2) Copy envs: `cp .env.local.example .env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase project)
   - `GITHUB_TOKEN` (repo scope), `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`
3) Supabase schema: tables `products` and `events` with RLS already applied. (Created via migrations in this repo using MCP.)
4) Start dev server: `npm run dev` and open http://localhost:3000

## Usage

- Storefront: `/` shows published products/events (anon-readable).  
- Auth: `/login` email/password (all authenticated users are admins).  
- Admin: `/admin` CRUD for products/events plus a form to create GitHub issues tagged `codex-request, theme`.  
- GitHub workflow: `.github/workflows/codex-theme.yml` listens for issues with `codex-request`, runs `openai/codex-action@v1` to restyle the storefront, and opens a PR with the changes.

## Notes

- Products/events RLS: anonymous can read published rows; authenticated can read/write everything (MVP).  
- Sample seed data is inserted by the Supabase migration for a quick demo.  
- Theme requests require `OPENAI_API_KEY` secret in GitHub for the workflow.
