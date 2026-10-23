# Video Tool Battle — site

Static site at https://videotoolbattle.com comparing AI video tools head to head
(Runway, Pika, Luma, HeyGen, Synthesia, Colossyan, InVideo AI, Fliki, CapCut, VEED,
Descript, Kaiber). Owner's goal: a side project that earns affiliate income; small
amounts are fine to start.

Hosting: GitHub Pages via `.github/workflows/deploy.yml` (every push to `main` deploys).
No build step: plain HTML/CSS/JS.

## Working rules (from the owner)

- Work on a branch, then merge it into `main` yourself.
- Commit messages: one short line. No Claude reference, no co-author line, no session link.
- Don't fake freshness: the "Updated <month>" badge must only change when a page's
  content has actually been re-checked (see "Dates" below).

## Layout

- `index.html` — homepage: hero with a Runway vs Pika track panel, filterable list of comparisons, how-we-compare, FAQ, newsletter.
- `battles/*.html` — one page per comparison. `invideo-vs-heygen.html` is a redirect stub to `invideo-ai-vs-heygen.html`; keep it out of the sitemap.
- `privacy.html`, `sitemap.xml`, `robots.txt`, `CNAME`.
- `assets/style.css` — the whole design system (see below).
- `assets/app.js` — theme toggle, mobile menu, search/filter, score-bar fill, colouring tool names in titles.
- `assets/analytics.js` — cookie banner; loads GA4 (G-TXYCK8LPDY) only after consent. Never add a hardcoded gtag snippet to a page.
- `assets/affiliate-links.js` — `AFFILIATE_LINKS` (empty = falls back to `OFFICIAL_LINKS`, earns nothing). Buttons use `data-affiliate="<key>"`.
- `assets/newsletter.js` — set `NEWSLETTER_ENDPOINT` to the provider's form URL; until then the form shows "Coming soon".
- `assets/date-badges.js` — badge text comes from each page's JSON-LD `dateModified`.
- `assets/battle-sources.js` / `pricing-snapshot.js` — read `data/tool-intel.json`.
- `data/tool-intel.json` — written daily by the private scraper repo (see below). Don't hand-edit.
- `data/prices.json` — hand-verified entry-plan prices; the only place a price lives. Elements marked
  `<span data-price="<key>" [data-format="short|short-plan"]>` get their text from it via
  `python3 scripts/sync_prices.py` (also rebuilds the JSON-LD FAQ/description copies). Deploy fails if
  pages are out of sync (`--check`) or any JSON-LD block is invalid.
- `scripts/scrape_tool_pricing.py` — older in-repo scraper; the private repo replaced it.

## Design ("edit bay")

Each matchup is two timeline tracks: tool A is yellow `--track-a #f2c200`, tool B is cyan
`--track-b #12a5b5`. Scores render as clips on a lane with frame ticks. One typeface,
Archivo (variable): `font-stretch: 72%` + weight 800 for headings, 100% for body.
Palette: white, `--surface #eef0f2`, `--ink #1c1f24`, `--muted #5b616b`. Light and dark themes.
Avoid: emoji icons, gradient text, card grids with shadows, scroll fade-ins, "→" in buttons,
ALL-CAPS labels, Title Case headings (use sentence case).
Logo mark = the two offset bars (CSS `.logo::before`, `assets/favicon.svg`/`.png`).
Share image: `assets/og-image.png` (1200×630).

## Dates

The "Updated" badges and sitemap `lastmod` must reflect real reviews. To move a page to a new
month: check every price on it against the tools' official pricing pages, update `data/prices.json`
(set `checked`), run the sync script, fix any wording/winners, then bump that page's JSON-LD
`dateModified` (and `lastmod` in `sitemap.xml`). Headline price = billed monthly, with the yearly
per-month price second (owner's choice, Oct 2026).

Re-checked 2026-10-23: runway-vs-pika, runway-vs-luma, pika-vs-luma, heygen-vs-synthesia,
synthesia-vs-colossyan. Still March (prices only render in a browser; `status: needs_browser_check`
in prices.json): InVideo AI (page served EUR), Fliki, CapCut, VEED, Kaiber — so invideo-ai-vs-heygen,
invideo-ai-vs-fliki, capcut-vs-veed, descript-vs-veed, kaiber-vs-luma and the homepage stay March.
Kaiber vs Luma price winner/scores are set to a tie pending Kaiber's real price.

## Revenue status (Oct 2026)

- Affiliate links live: InVideo AI, HeyGen. Everything else falls back to official links.
  Owner is applying to: Synthesia (Rewardful), VEED (Impact — site already Impact-verified),
  Fliki (no ads/coupon sites), Descript (PartnerStack, no Google Ads). Then Runway, CapCut,
  Colossyan, Pika, Luma, Kaiber.
- Newsletter: needs a provider (Beehiiv / Kit / Buttondown) and its form URL.
- Traffic numbers (GA4 / Search Console) not yet shared.

## Next steps (agreed plan)

1. Price refresh: done Oct 2026 except the five browser-only tools above; owner to send those.
2. Single source of truth: done (`data/prices.json` + `scripts/sync_prices.py`).
3. New page types from that data: "<tool> pricing", "<tool> alternatives",
   "best AI video tool for <job>".
4. Later: tool-picker quiz, real side-by-side test clips, short-form video repurposing.

## Gotchas

- `vtb-scraper-bot` pushes `data/tool-intel.json` straight to `main` daily at ~05:17 UTC.
  If "Require a pull request" branch protection is turned on, that push fails unless the
  bot is exempted. Pull before pushing to avoid conflicts.
- Google Fonts can be blocked in sandboxes; screenshots then fall back to system fonts.
