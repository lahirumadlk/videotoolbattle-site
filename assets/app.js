/* ===== VIDEO TOOL BATTLE — APP.JS ===== */

(function () {
  'use strict';

  /* ---- Dark Mode ---- */
  const THEME_KEY = 'vtb-theme';
  const html = document.documentElement;
  const saved = localStorage.getItem(THEME_KEY);

  if (saved) {
    html.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    html.setAttribute('data-theme', 'dark');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      updateToggleIcon(toggle);
      toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        updateToggleIcon(toggle);
      });
    }

    function updateToggleIcon(btn) {
      const isDark = html.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '☀️' : '🌙';
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    /* ---- Mobile Menu ---- */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
      });
      mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          hamburger.classList.remove('active');
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    /* ---- Category Filters ---- */
    const filterPills = document.querySelectorAll('.filter-pill');
    const battleCards = document.querySelectorAll('.battle-card');
    const noResults = document.getElementById('no-results');
    const countEl = document.getElementById('battle-count');

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        applyFilters();
      });
    });

    /* ---- Search ---- */
    const searchInput = document.getElementById('hero-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => applyFilters());

      // Scroll to results on Enter key
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFilters();
          scrollToResults();
        }
      });
      
      const searchBtn = document.querySelector('.search-btn');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          applyFilters();
          scrollToResults();
        });
      }
    }

    function scrollToResults() {
      // Wait for DOM to update after filtering before calculating scroll position
      requestAnimationFrame(() => {
        setTimeout(() => {
          const target = document.querySelector('.battle-grid') || document.getElementById('battles');
          if (target) {
            const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
            const filterSection = document.querySelector('.filter-section');
            const filterHeight = filterSection ? filterSection.offsetHeight : 0;
            const totalOffset = headerHeight + filterHeight + 20;
            const y = target.getBoundingClientRect().top + window.scrollY - totalOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 50);
      });
    }

    function applyFilters() {
      const activeFilter = document.querySelector('.filter-pill.active');
      const category = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      let visible = 0;

      battleCards.forEach(card => {
        const cats = (card.getAttribute('data-categories') || '').toLowerCase();
        const text = (card.getAttribute('data-search') || card.textContent).toLowerCase();
        const matchCat = category === 'all' || cats.includes(category);
        const matchSearch = !query || text.includes(query);
        const show = matchCat && matchSearch;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      if (noResults) {
        noResults.classList.toggle('visible', visible === 0);
      }
      if (countEl) {
        countEl.textContent = `${visible} comparison${visible !== 1 ? 's' : ''}`;
      }
    }

    /* ---- Scroll Reveal ---- */
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0 && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(el => observer.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('visible'));
    }

    /* ---- Back to Top ---- */
    const backBtn = document.getElementById('back-to-top');
    if (backBtn) {
      window.addEventListener('scroll', () => {
        backBtn.classList.toggle('visible', window.scrollY > 600);
      }, { passive: true });
      backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* ---- Sticky Verdict Bar (battle pages) ---- */
    const stickyVerdict = document.getElementById('sticky-verdict');
    const verdictBox = document.querySelector('.verdict-box');
    if (stickyVerdict && verdictBox) {
      window.addEventListener('scroll', () => {
        const rect = verdictBox.getBoundingClientRect();
        stickyVerdict.classList.toggle('visible', rect.bottom < 0);
      }, { passive: true });
    }

    /* ---- Color-code tool icons and names ---- */
    document.querySelectorAll('.battle-card').forEach(card => {
      // Color the tool icons
      const icons = card.querySelectorAll('.tool-icon');
      if (icons.length >= 2) {
        icons[0].classList.add('tool-a');
        icons[1].classList.add('tool-b');
      }

      // Color the tool names in the h3
      const h3 = card.querySelector('h3');
      if (h3) {
        const text = h3.textContent;
        const vsMatch = text.match(/^(.+?)\s+vs\s+(.+)$/i);
        if (vsMatch) {
          h3.innerHTML = `<span class="tool-name-a">${vsMatch[1].trim()}</span><span class="vs-text"> vs </span><span class="tool-name-b">${vsMatch[2].trim()}</span>`;
        }
      }
    });

    /* ---- Inject percentage labels + Animate score bars ---- */
    const scoreBars = document.querySelectorAll('.score-bar-fill');
    scoreBars.forEach(fill => {
      const pctValue = fill.getAttribute('data-width') || '0%';
      const scoreBar = fill.parentElement;

      // Only wrap if not already wrapped
      if (!scoreBar.parentElement.classList.contains('score-bar-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'score-bar-wrap';
        scoreBar.parentElement.insertBefore(wrap, scoreBar);
        wrap.appendChild(scoreBar);

        const pctLabel = document.createElement('span');
        pctLabel.className = 'score-pct ' + (fill.classList.contains('a') ? 'a' : 'b');
        pctLabel.textContent = pctValue.replace('%', '');
        wrap.appendChild(pctLabel);
      }
    });

    if (scoreBars.length > 0 && 'IntersectionObserver' in window) {
      const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target.getAttribute('data-width');
            entry.target.style.width = target;
            barObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      scoreBars.forEach(bar => {
        bar.style.width = '0';
        barObserver.observe(bar);
      });
    }

    /* ---- Smooth anchor scrolling ---- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
          const y = target.getBoundingClientRect().top + window.scrollY - offset - 40;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
  });
})();
