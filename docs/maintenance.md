# Maintenance

## Update copy

Edit the relevant file in `data/`. Keep the `window.SARAH_CONTENT` wrapper and valid JavaScript. Text in data is escaped before display. Rich presentation templates live in `js/pages.js`; layout belongs in `css/`, not inline attributes.

Colors, font choices, widths, and spacing foundations are in `css/tokens.css`. No external fonts, analytics, framework, or runtime service is required.

## Add photos

1. Obtain family permission. Keep originals outside this public repository.
2. Apply image orientation, remove EXIF/location metadata, and export a WebP full image and thumbnail into `assets/images/`.
3. Add a record to `data/media.js` with unique id, src, thumb, title, descriptive alt text, tag, publicationState, and source information, following an existing record.
4. Use `undated` unless the capture date is verified. Import/export filenames alone do not prove a capture date.
5. Run `npm test` and inspect the photo archive and all slideshow modes.

The first collection contains 11 shared Drive photos and 19 usable Party Inbox uploads. Album screenshot grids and the screenshot with phone UI were excluded. New import provenance is recorded in `docs/media-import.json`. Some photos depict the same occasion; names and dates can be enriched as relatives identify them.

## Change events

Edit `data/events.js`. Use an explicit `-07:00` offset for Tucson dates and `America/Phoenix` for the timezone. Do not guess an end time. Keep home addresses and personal contact details outside the public repository. The published family email is the designated contribution inbox.

## Publish

Commit to this repository only. In GitHub Settings → Pages select Deploy from a branch, `main`, `/ (root)`. A new push automatically republishes after Pages is configured. Check the deployment status and public page before sharing.

## Contribution service

`js/services/contributions.js` is deliberately an email adapter. Chosen images remain in the visitor's browser and must be manually attached. No automatic delivery, persistent storage, moderation dashboard, or account system is claimed. A future backend should implement reviewed submissions, file validation, size limits, consent records, and private original storage before changing that promise.

## Source review

The schedule follows the family's official birthday weekend communication. Historical sources are listed in `data/history.js`. Family memories are attributed, not presented as recorded quotations. Unresolved dates and naming questions are identified in the relevant source notes. The brief Sarah & Jonas chapters are an initial account, not the final dramatic manuscript. Add approved film assets and full text when supplied.

## Verification before updates

Run `npm test`. Check Home, each primary navigation destination, one detail page, photo search, empty results, photo dialog, contribution validation, event filters/calendar downloads, all three slideshow modes, pause/next/previous/fullscreen, and keyboard navigation. Check a narrow viewport and reduced-motion mode. Never put credentials, private source screenshots, email records, or private home addresses in this repository.

## Photo motion and duplicate checks

The current collection has 47 photos after adding 17 new Drive images and skipping 16 confirmed copies. One phone screenshot was held. Similar frames with different poses are retained. `docs/photo-index.json` tracks source fingerprints and import decisions.

Use the installed Sarah Photo Sync skill for new imports. It checks SHA-256 and oriented pixels for exact copies and flags near duplicates for visual review. `scripts/photo_sync.py` is a repository copy of its import tool (requires Python, Pillow, numpy). Run its audit before applying reviewed entries. Similarity is not proof of duplication.

Set `focus: {x:0.5,y:0.4,confirmed:true}` in a media record only for a family-confirmed Sarah location. Coordinates are fractions of the full photo. Without a confirmed focus, Sarah reveal falls back to gentle zoom. Visitors can adjust focus on their own devices; these changes do not automatically alter the shared record. Motion stops with reduced-motion preferences or Still photos.


## Birthday positioning — September 27, 2026

The site is first a 90th birthday party weekend invitation: a celebration **with Sarah**. Lead with present-tense warmth, invitations, the October 2–4 Tucson events, Saturday’s party, birthday wishes, and making new memories together. Her birthday is October 5. Keep family history and photographs as supporting experiences. Avoid memorial-like headlines, date-span branding, “keep the story alive,” and retrospective tribute framing. Do not add explicit memorial disclaimers or invented first-person quotes from Sarah.

## Comparison edition

This repository is the separate `sarah-birthday-experience` site. Do not publish it over `sarah-eldridge-legacy`. Photo-sync automation still targets the original only. Use `data/experience.js` for the homepage days, timeline capsules, and biography. `js/experience.js` supplies the new homepage and reading pages; `js/chamber.js` supplies the perspective gallery. New styles are isolated in matching CSS files.

The gallery starts paused. Historical records are labeled separately from family photographs. Unknown capture dates remain in the undated collection. Per-image comments use the existing reviewed email pathway and preserve the photo identifier. There is no persistent public comment backend.
