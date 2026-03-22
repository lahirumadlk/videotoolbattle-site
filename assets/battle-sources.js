/* ===== VIDEO TOOL BATTLE — BATTLE PAGE PRICING SOURCES ===== */

(function () {
  'use strict';

  if (!window.location.pathname.includes('/battles/')) return;

  const DATA_PATHS = ['../data/tool-intel.json', '../data/latest-tool-pricing.json'];
  const KEY_ALIASES = {
    'luma-dream-machine': 'luma'
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadSources().catch(() => {
      // Keep battle pages resilient if data is unavailable.
    });
  });

  async function loadSources() {
    const { data } = await fetchFirstJson(DATA_PATHS);
    if (!data || !Array.isArray(data.tools)) return;

    const keys = getPageToolKeys();
    if (keys.length === 0) return;

    const toolMap = buildToolMap(data.tools);
    const matchedTools = keys
      .map((key) => toolMap.get(key))
      .filter(Boolean);

    if (matchedTools.length === 0) return;
    mountSourcesSection(matchedTools, data.generated_at_utc || data.generated_at || '');
  }

  async function fetchFirstJson(paths) {
    for (const path of paths) {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) continue;
        const data = await response.json();
        return { data, path };
      } catch {
        // try next path
      }
    }
    return { data: null, path: null };
  }

  function buildToolMap(tools) {
    const map = new Map();
    tools.forEach((tool) => {
      const key = normalizeKey(tool && tool.key);
      if (key) map.set(key, tool);
    });
    return map;
  }

  function getPageToolKeys() {
    const links = Array.from(document.querySelectorAll('a[data-affiliate]'));
    const keys = links
      .map((link) => normalizeKey(link.getAttribute('data-affiliate')))
      .filter(Boolean);
    return Array.from(new Set(keys));
  }

  function normalizeKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    return KEY_ALIASES[key] || key;
  }

  function mountSourcesSection(tools, generatedAt) {
    const host =
      document.querySelector('.page-wrap.battle-page') ||
      document.querySelector('main') ||
      document.querySelector('.container');
    if (!host) return;
    if (document.getElementById('battle-pricing-sources')) return;

    const section = document.createElement('section');
    section.id = 'battle-pricing-sources';
    section.className = 'battle-sources';

    const title = document.createElement('h2');
    title.textContent = 'Pricing Sources';
    section.appendChild(title);

    const lead = document.createElement('p');
    lead.className = 'battle-sources-lead';
    lead.textContent = 'Reference links used for the latest pricing snapshot shown on this site.';
    section.appendChild(lead);

    const grid = document.createElement('div');
    grid.className = 'battle-sources-grid';

    tools.forEach((tool) => {
      const card = document.createElement('article');
      card.className = 'battle-source-card';

      const heading = document.createElement('h3');
      heading.textContent = tool.name || tool.key || 'Tool';
      card.appendChild(heading);

      const urls = Array.isArray(tool.source_urls) ? tool.source_urls : [];
      if (urls.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'battle-source-empty';
        empty.textContent = 'No source links available in the latest snapshot.';
        card.appendChild(empty);
      } else {
        const list = document.createElement('ul');
        list.className = 'battle-source-links';
        urls.slice(0, 4).forEach((url) => {
          const item = document.createElement('li');
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.target = '_blank';
          anchor.rel = 'nofollow noopener';
          anchor.textContent = shortenUrl(url);
          item.appendChild(anchor);
          list.appendChild(item);
        });
        card.appendChild(list);
      }

      grid.appendChild(card);
    });

    section.appendChild(grid);

    const stamp = document.createElement('p');
    stamp.className = 'battle-sources-stamp';
    stamp.textContent = generatedAt
      ? `Last checked (UTC): ${formatUtc(generatedAt)}`
      : 'Last checked (UTC): not available';
    section.appendChild(stamp);

    const relatedSection = host.querySelector('.related-section');
    if (relatedSection) {
      host.insertBefore(section, relatedSection);
    } else {
      host.appendChild(section);
    }
  }

  function shortenUrl(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname}`;
    } catch {
      return String(url || '');
    }
  }

  function formatUtc(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().replace('.000Z', 'Z');
  }
})();
