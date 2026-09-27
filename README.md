# Mother Sarah Eldridge — 90th Birthday Weekend

A birthday party weekend website inviting family and friends to celebrate Mother Sarah Eldridge’s 90th birthday with her in Tucson, October 2–4, 2026. Family history, photographs, and stories support the celebration. This repository is separate from all other sites in the account.

## Run and verify

No build step or package installation is required. Run `npm start`, then open localhost:8080. Run `npm test` for content, asset, safety, calendar, and playlist checks.

GitHub Pages: deploy the `main` branch, repository root. Navigation uses hash routes so every story can be bookmarked on static hosting.

## File organization

- `index.html`: semantic shell, navigation, metadata, and script order.
- `css/`: tokens, foundation, layout, components, slideshow, and motion.
- `js/`: routing, page rendering, shared UI, calendars, and slideshow controls.
- `js/services/contributions.js`: email contribution adapter and local photo previews.
- `data/`: editable public content, family roster, photographs, stories, and event schedule.
- `assets/images/`: optimized WebP photos and thumbnails; no private originals.
- `assets/icons/`: local SVG artwork.
- `docs/maintenance.md`: updating instructions and release limitations.
- `tests/`: dependency-free automated verification.

## Included

Home, life journey, Sarah & Jonas, family profiles, Sarah at 90, weekend events with calendar downloads, memories, searchable photo archive, historical context, and three slideshow modes. The first release contains 47 authentic family photos. Responsive layouts, keyboard controls, reduced-motion support, image descriptions, and focus handling are included.

## Contributions and unfinished source material

The contribution form prepares an email draft. It does **not** upload photos or send email automatically; visitors attach photos in their email application. The full cinematic film and final long-form love-story manuscript are not available. The site clearly labels the current short account and forthcoming film. Amazon album photos could not be accessed and are not included.

Family content and photos are not licensed for unrelated reuse. Historical imagery links to its originating institutions on the credits page.

Photo motion includes Sarah reveal, gentle zoom, and a still option. Adjust focus stores a preference on the visitor’s device. Shared focal coordinates require family confirmation. A Sarah Photo Sync skill supports reviewed Drive imports and duplicate checks.
