/* ===== VIDEO TOOL BATTLE — "UPDATED" BADGES ===== */
/*
 * Shows the page's real last-reviewed month, taken from its Article JSON-LD
 * `dateModified`. Previously this stamped the *current* month on every visit,
 * which told readers (and Google) pages were updated when they weren't.
 * To refresh a badge, review the page and bump its `dateModified`.
 * Pages without a dateModified keep the badge text written in the HTML.
 */
(function () {
  'use strict';

  const findDateModified = () => {
    const blocks = document.querySelectorAll('script[type="application/ld+json"]');
    for (const block of blocks) {
      try {
        const data = JSON.parse(block.textContent || '{}');
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item && item.dateModified) return item.dateModified;
        }
      } catch (e) {
        /* ignore malformed JSON-LD */
      }
    }
    return null;
  };

  const run = () => {
    const raw = findDateModified();
    if (!raw) return;
    const date = new Date(`${raw}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return;

    const monthYear = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date);

    document.querySelectorAll('.hero-badge, .updated-badge').forEach((el) => {
      const text = (el.textContent || '').trim();
      const prefix = text.split(/updated/i)[0].trim();
      el.textContent = `${prefix ? `${prefix} ` : ''}Updated ${monthYear}`.trim();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
