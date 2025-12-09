**Spring Theme Refresh**
- Added a scoped `spring-launch/spring-colors` data-theme with light, vibrant tokens, gradients, and component treatments (`spring-*` classes) so only the Spring Launch flag restyles the storefront; base and prior themes stay untouched (`src/app/globals.css`).
- Updated storefront hero/product/event copy and styling hooks to reflect the spring vibe when the theme slug matches, while keeping all data fetching and logic intact (`src/app/page.tsx`).

Tests not run (not requested).

Next steps: 1) Create/enable a Supabase theme row titled “Spring Launch” (status `ready`, `enabled` true) to activate the look. 2) Preview the storefront to confirm the spring palette and text swap in.