/* ===== VIDEO TOOL BATTLE — PRICING SNAPSHOT ===== */

(function () {
  'use strict';

  const MAX_TOOLS = 10;
  const CANDIDATE_PATHS = [
    'data/tool-intel.json',
    'data/latest-tool-pricing.json'
  ];
  const BATTLE_LINKS = {
    'invideo-ai': 'battles/invideo-ai-vs-heygen.html',
    'invideo': 'battles/invideo-vs-heygen.html',
    'heygen': 'battles/heygen-vs-synthesia.html',
    'runway': 'battles/runway-vs-pika.html',
    'luma': 'battles/runway-vs-luma-dream-machine.html',
    'luma-dream-machine': 'battles/runway-vs-luma-dream-machine.html',
    'pika': 'battles/runway-vs-pika.html',
    'capcut': 'battles/capcut-vs-veed.html',
    'veed': 'battles/capcut-vs-veed.html',
    'synthesia': 'battles/heygen-vs-synthesia.html',
    'colossyan': 'battles/synthesia-vs-colossyan.html',
    'kaiber': 'battles/kaiber-vs-luma-dream-machine.html',
    'descript': 'battles/descript-vs-veed.html',
    'fliki': 'battles/invideo-ai-vs-fliki.html'
  };

  const $updated = document.getElementById('pricing-updated');
  const $status = document.getElementById('pricing-snapshot-status');
  const $tableWrap =
    document.getElementById('pricing-snapshot-table-wrap') ||
    document.getElementById('pricing-snapshot-grid');
  const $toolsTotal = document.getElementById('pricing-tools-total');
  const $toolsMonthly = document.getElementById('pricing-tools-monthly');

  if (!$updated || !$status || !$tableWrap) return;

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

  function extractFallbackValues(points) {
    return points
      .map((point) => {
        const text = String(point || '').toLowerCase();
        if (!text) return null;

        const hasYearlySignal = /\byear\b|\byearly\b|\bannual\b|\/\s*yr\b|\/\s*year\b/.test(text);
        if (hasYearlySignal) return null;

        const match = text.match(/\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/);
        if (!match) return null;
        const amount = Number(match[1].replace(/,/g, ''));
        return Number.isFinite(amount) ? amount : null;
      })
      .filter((amount) => typeof amount === 'number');
  }

  function getMonthlyData(points) {
    const monthlyValues = extractMonthlyValues(points);
    const sourceValues = monthlyValues.length > 0 ? monthlyValues : extractFallbackValues(points);
    if (sourceValues.length === 0) return { label: '', value: null };

    const lowest = Math.min(...sourceValues);
    if (lowest === 0) return { label: 'Free ($0/mo)', value: 0 };
    const formatted = Number.isInteger(lowest) ? String(lowest) : lowest.toFixed(2);
    return { label: `From $${formatted}/mo`, value: lowest };
  }

  function getBattleLink(key) {
    const normalized = String(key || '').trim().toLowerCase();
    if (!normalized) return '';
    return BATTLE_LINKS[normalized] || '';
  }

  function renderComparisonTable(rows) {
    const table = document.createElement('table');
    table.className = 'pricing-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>Tool</th><th>Monthly</th><th>Battle</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, index) => {
      const tr = document.createElement('tr');

      const rank = document.createElement('td');
      rank.className = 'pricing-rank';
      rank.textContent = String(index + 1);
      tr.appendChild(rank);

      const name = document.createElement('td');
      name.className = 'pricing-tool-name';
      name.textContent = row.name;
      tr.appendChild(name);

      const monthly = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'pricing-price';
      if (!row.monthlyLabel) badge.classList.add('is-missing');
      badge.textContent = row.monthlyLabel || 'N/A';
      monthly.appendChild(badge);
      tr.appendChild(monthly);

      const battle = document.createElement('td');
      if (row.battleHref) {
        const link = document.createElement('a');
        link.className = 'btn btn-ghost btn-sm';
        link.href = row.battleHref;
        link.textContent = 'Read battle →';
        battle.appendChild(link);
      } else {
        const fallback = document.createElement('a');
        fallback.className = 'btn btn-ghost btn-sm';
        fallback.href = '#battles';
        fallback.textContent = 'See battles →';
        battle.appendChild(fallback);
      }
      tr.appendChild(battle);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  async function loadSnapshot() {
    setStatus('', '');
    $tableWrap.innerHTML = '';

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
    if (tools.length === 0) {
      if ($toolsTotal) $toolsTotal.textContent = '0';
      if ($toolsMonthly) $toolsMonthly.textContent = '0';
      setStatus('Snapshot loaded, but no tools were found in the dataset.', 'error');
      return;
    }

    const prepared = tools
      .map((tool) => {
        const key = String((tool && tool.key) || '').trim();
        const name = String((tool && tool.name) || key || 'Unknown');
        const points = normalizePricePoints(tool && tool.price_points);
        const monthlyData = getMonthlyData(points);
        const battleHref = getBattleLink(key);
        return {
          key,
          name,
          monthlyLabel: monthlyData.label,
          monthlyValue: monthlyData.value,
          battleHref
        };
      })
      .filter((item) => item.battleHref)
      .sort((a, b) => {
        const aMissing = a.monthlyValue === null ? 1 : 0;
        const bMissing = b.monthlyValue === null ? 1 : 0;
        if (aMissing !== bMissing) return aMissing - bMissing;
        if (a.monthlyValue !== null && b.monthlyValue !== null) return a.monthlyValue - b.monthlyValue;
        return a.name.localeCompare(b.name);
      });

    const topRows = prepared.slice(0, MAX_TOOLS);
    const monthlyCount = topRows.filter((item) => item.monthlyLabel).length;
    if ($toolsTotal) $toolsTotal.textContent = String(topRows.length);
    if ($toolsMonthly) $toolsMonthly.textContent = String(monthlyCount);

    if (topRows.length === 0) {
      setStatus('No battle-linked tools found in the latest snapshot.', 'error');
      return;
    }

    $tableWrap.appendChild(renderComparisonTable(topRows));

    // Keep source path internal and only show status for real errors.
    void path;
    setStatus('', '');
  }
})();
