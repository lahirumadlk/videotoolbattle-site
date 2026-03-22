/* ===== VIDEO TOOL BATTLE — ANALYTICS + COOKIE CONSENT (GA4) ===== */

(function () {
  'use strict';

  const GA4_MEASUREMENT_ID = 'G-TXYCK8LPDY';
  const CONSENT_KEY = 'vtb_analytics_consent'; // 'granted' | 'denied'

  const hasStorage = (() => {
    try {
      const k = '__vtb_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  })();

  const getConsent = () => {
    if (!hasStorage) return null;
    const value = (localStorage.getItem(CONSENT_KEY) || '').trim();
    return value === 'granted' || value === 'denied' ? value : null;
  };

  const setConsent = (value) => {
    if (!hasStorage) return;
    localStorage.setItem(CONSENT_KEY, value);
  };

  const gaAlreadyLoaded = () =>
    Boolean(document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]'));

  const loadGa4 = () => {
    if (gaAlreadyLoaded()) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  };

  const ensureBannerStylesHook = () => {
    document.documentElement.classList.add('vtb-has-consent-ui');
  };

  const bannerId = 'vtb-cookie-banner';

  const removeBanner = () => {
    const existing = document.getElementById(bannerId);
    if (existing) existing.remove();
  };

  const showBanner = () => {
    removeBanner();
    ensureBannerStylesHook();

    const banner = document.createElement('div');
    banner.id = bannerId;
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Cookie preferences');

    const wrap = document.createElement('div');
    wrap.className = 'cookie-banner-inner';

    const title = document.createElement('div');
    title.className = 'cookie-banner-title';
    title.textContent = 'Cookies and analytics';

    const text = document.createElement('p');
    text.className = 'cookie-banner-text';
    text.textContent =
      "We use analytics to understand traffic and improve comparisons. You can accept or reject analytics tracking. Affiliate links may earn us a commission.";

    const actions = document.createElement('div');
    actions.className = 'cookie-banner-actions';

    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'btn btn-ghost btn-sm';
    reject.textContent = 'Reject';

    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'btn btn-primary btn-sm';
    accept.textContent = 'Accept';

    const policy = document.createElement('a');
    policy.className = 'cookie-banner-link';
    policy.textContent = 'Privacy policy';
    policy.href = getPrivacyHref();

    actions.appendChild(policy);
    actions.appendChild(reject);
    actions.appendChild(accept);

    wrap.appendChild(title);
    wrap.appendChild(text);
    wrap.appendChild(actions);
    banner.appendChild(wrap);

    reject.addEventListener('click', () => {
      setConsent('denied');
      removeBanner();
    });

    accept.addEventListener('click', () => {
      setConsent('granted');
      loadGa4();
      removeBanner();
    });

    document.body.appendChild(banner);
  };

  const getPrivacyHref = () => {
    // Works for `/` and `/battles/*` without hardcoding domains.
    const path = window.location.pathname || '';
    return path.includes('/battles/') ? '../privacy.html' : 'privacy.html';
  };

  const openCookieSettings = () => showBanner();
  window.vtbOpenCookieSettings = openCookieSettings;

  document.addEventListener('click', (event) => {
    const el = event.target && event.target.closest ? event.target.closest('[data-cookie-settings]') : null;
    if (!el) return;
    event.preventDefault();
    openCookieSettings();
  });

  // Boot: only load GA after explicit consent.
  const saved = getConsent();
  if (saved === 'granted') {
    loadGa4();
  } else if (saved === null) {
    // Show banner only if user hasn't made a choice yet.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();

