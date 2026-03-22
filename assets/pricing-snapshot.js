/* ===== VIDEO TOOL BATTLE — PRICING SNAPSHOT ===== */

(function () {
  'use strict';

  const CANDIDATE_PATHS = [
    'data/tool-intel.json',
    'data/latest-tool-pricing.json'
  ];

  const $updated = document.getElementById('pricing-updated');
  const $status = document.getElementById('pricing-snapshot-status');
  const $grid = document.getElementById('pricing-snapshot-grid');
  const $toolsTotal = document.getElementById('pricing-tools-total');
  const $toolsMonthly = document.getElementById('pricing-tools-monthly');

  if (!$updated || !$status || !$grid) return;

  document.addEventListener('DOMContentLoaded', () => {
    loadSnapshot().catch((err) => {
      setStatus(`Snapshot unavailable (${safeMessage(err)}).`, 'error');
    });
  });

  function setStatus(message, tone) {
    if (!message) {
      $status.hidden = true;
      $status.textContent = '';
      $status.classList.remove('is-error', 'is-ok');
      return;
    }
    $status.hidden = false;
    $status.textContent = message;
    $status.classList.toggle('is-error', tone === 'error');
    $status.classList.toggle('is-ok', tone === 'ok');
  }

  function safeMessage(err) {
    if (!err) return 'unknown error';
    if (typeof err === 'string') return err;
    return err.message || 'unknown error';
  }

  async function fetchFirstJson(paths) {
    for (const path of paths) {
      try {
        const res = await fetch(path, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        return { data, path };
      } catch {
        // try next candidate
      }
    }
    return { data: null, path: null };
  }

  function formatUtc(iso) {
    if (!iso || typeof iso !== 'string') return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })} (${iso.includes('+00:00') || iso.endsWith('Z') ? 'UTC' : 'UTC'})`;
  }

  function normalizePricePoints(points) {
    if (!Array.isArray(points)) return [];
    const cleaned = points
      .map(p => String(p || '').trim())
      .filter(Boolean);
    return Array.from(new Set(cleaned));
  }

  function extractMonthlyValues(points) {
    return points
      .map((point) => {
        const text = String(point || '').toLowerCase();
        if (!text) return null;

        const isMonthly =
          /\/\s*mo\b/.test(text) ||
          /\/\s*month\b/.test(text) ||
          /\bper\s+month\b/.test(text) ||
          /\bmonthly\b/.test(text);

        const isYearly = /\byear\b|\byearly\b|\bannual\b|\/\s*yr\b|\/\s*year\b/.test(text);
        if (!isMonthly || isYearly) return null;

        const match = text.match(/\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
        if (!match) return null;

        const amount = Number(match[1].replace(/,/g, ''));
        return Number.isFinite(amount) ? amount : null;
      })
      .filter((amount) => typeof amount === 'number');
  }

  function getMonthlyLabel(points) {
    const monthlyValues = extractMonthlyValues(points);
    if (monthlyValues.length === 0) return '';

    const lowest = Math.min(...monthlyValues);
    if (lowest === 0) return 'Free ($0/mo)';
    const formatted = Number.isInteger(lowest) ? String(lowest) : lowest.toFixed(2);
    return `From $${formatted}/mo`;
  }

  function renderToolCard(tool) {
    const key = (tool && tool.key) ? String(tool.key) : '';
    const name = (tool && tool.name) ? String(tool.name) : key || 'Unknown tool';

    const points = normalizePricePoints(tool && tool.price_points);
    const sources = Array.isArray(tool && tool.source_urls) ? tool.source_urls : [];
    const monthlyLabel = getMonthlyLabel(points);

    const card = document.createElement('article');
    card.className = 'pricing-card reveal';

    const title = document.createElement('h3');
    title.className = 'pricing-title';
    title.textContent = name;
    card.appendChild(title);

    const price = document.createElement('p');
    price.className = 'pricing-price';
    price.textContent = monthlyLabel || 'Monthly not detected';
    if (!monthlyLabel) {
      price.classList.add('is-missing');
    }
    card.appendChild(price);

    const meta = document.createElement('p');
    meta.className = 'pricing-meta';
    meta.textContent = monthlyLabel
      ? 'Estimated entry monthly pricing from latest crawl.'
      : 'Could not parse monthly text from current pricing page content.';
    card.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'pricing-actions';

    const primary = document.createElement('a');
    primary.className = 'btn btn-primary btn-sm';
    primary.textContent = 'Check pricing →';

    // Prefer affiliate/official routing if available.
    if (key) {
      primary.setAttribute('href', '#');
      primary.setAttribute('data-affiliate', key);
    } else if (sources[0]) {
      primary.setAttribute('href', sources[0]);
      primary.setAttribute('target', '_blank');
      primary.setAttribute('rel', 'nofollow noopener');
    } else {
      primary.setAttribute('href', '#');
      primary.setAttribute('aria-disabled', 'true');
    }
    actions.appendChild(primary);

    const sourceLink = pickBestSourceUrl(sources);
    if (sourceLink) {
      const source = document.createElement('a');
      source.className = 'btn btn-ghost btn-sm';
      source.textContent = 'Sources';
      source.href = sourceLink;
      source.target = '_blank';
      source.rel = 'nofollow noopener';
      actions.appendChild(source);
    }

    card.appendChild(actions);

    return card;
  }

  function pickBestSourceUrl(urls) {
    if (!Array.isArray(urls) || urls.length === 0) return '';
    const prefer = urls.find(u => /pricing|plans/i.test(String(u)));
    return prefer || String(urls[0] || '');
  }

  async function loadSnapshot() {
    setStatus('', '');
    $grid.innerHTML = '';

    const { data, path } = await fetchFirstJson(CANDIDATE_PATHS);
    if (!data) {
      $updated.textContent = '—';
      if ($toolsTotal) $toolsTotal.textContent = '0';
      if ($toolsMonthly) $toolsMonthly.textContent = '0';
      setStatus('No snapshot data found yet. Run the private scraper workflow and try again.', 'error');
      return;
    }

    const generatedAt = data.generated_at_utc || data.generatedAtUtc || data.generated_at || '';
    $updated.textContent = formatUtc(String(generatedAt || ''));

    const tools = Array.isArray(data.tools) ? data.tools : [];
    if ($toolsTotal) $toolsTotal.textContent = String(tools.length);
    if (tools.length === 0) {
      if ($toolsMonthly) $toolsMonthly.textContent = '0';
      setStatus('Snapshot loaded, but no tools were found in the dataset.', 'error');
      return;
    }

    const monthlyCount = tools.filter((tool) => {
      const points = normalizePricePoints(tool && tool.price_points);
      return getMonthlyLabel(points).length > 0;
    }).length;
    if ($toolsMonthly) $toolsMonthly.textContent = String(monthlyCount);

    tools
      .slice()
      .sort((a, b) => String(a.name || a.key || '').localeCompare(String(b.name || b.key || '')))
      .forEach(t => $grid.appendChild(renderToolCard(t)));

    // If affiliate-links.js is present, update hrefs for dynamically inserted links.
    if (typeof window.vtbApplyAffiliateLinks === 'function') {
      window.vtbApplyAffiliateLinks();
    }

    // Trigger reveal animation for newly added cards.
    requestAnimationFrame(() => {
      document.querySelectorAll('.pricing-card.reveal').forEach(el => el.classList.add('visible'));
    });

    // Keep source path internal and only show status for real errors.
    void path;
    setStatus('', '');
  }
})();
