/* ===== VIDEO TOOL BATTLE — AUTO MONTH BADGES ===== */

(function () {
  'use strict';

  const currentMonthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date());

  const refreshBadge = (element) => {
    const text = (element.textContent || '').trim();
    if (!text) return;

    const prefix = text.split(/updated/i)[0].trim();
    element.textContent = `${prefix ? `${prefix} ` : ''}Updated ${currentMonthYear}`.trim();
  };

  const run = () => {
    document.querySelectorAll('.hero-badge, .updated-badge').forEach(refreshBadge);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

