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
      
      const searchBtn = document.querySelector('.search-btn');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => applyFilters());
      }
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

    /* ---- Animate score bars ---- */
    const scoreBars = document.querySelectorAll('.score-bar-fill');
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
