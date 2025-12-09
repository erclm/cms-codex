**Changes**
- Added a scoped winter-wonderland token set in `src/app/globals.css` with frosty gradients, snow speckle overlay, and dedicated `ww-*` utilities so the base and prior themes stay intact.
- Wired `src/app/page.tsx` to recognize the `"winter-wonderland"` slug, layering the new shell/hero/card/button styles only when the ready+enabled Supabase theme is active.
- Refreshed storefront copy for the winter mood (Christmas Sale CTA, snow-ready messaging, new highlights/badges) and tagged the matching event ID with a themed chip while keeping product/event logic untouched.

**Notes**
- No tests or linting were run; consider `npm run lint` or a quick page load to verify.