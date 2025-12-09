Applied a merry christmas theme behind a single toggle while keeping the base storefront logic intact.

- src/app/globals.css: added `[data-theme="merry-christmas"]` design tokens, gradients, snow/glow overlays, and festive utility classes (hero, buttons, chips, cards, labels) that only apply when the flag is present.
- src/app/page.tsx: introduced `enableMerryTheme`/`themeFlag`, scoped the theme via `data-theme` on `<main>`, and switched hero/products/events copy plus styling hooks to holiday variants only when the toggle is true; base text/layout remain unchanged when it’s false.

Next steps: flip `enableMerryTheme` to false to revert to the base look, and optionally run `npm run lint` to double-check.