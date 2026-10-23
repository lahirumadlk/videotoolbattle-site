/* ===== VIDEO TOOL BATTLE — NEWSLETTER FORM ===== */
/*
 * Paste your newsletter provider's form endpoint below. Examples:
 *   Buttondown: https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME
 *   Kit (ConvertKit): https://app.kit.com/forms/YOUR_FORM_ID/subscriptions
 *   Beehiiv: use the "embed" form URL from Beehiiv's Grow > Subscribe forms
 * The email field is sent as `email` (set EMAIL_FIELD if your provider differs,
 * e.g. Kit uses `email_address`).
 *
 * Until NEWSLETTER_ENDPOINT is filled in, the form says the newsletter is
 * launching soon instead of pretending to subscribe people.
 */
(function () {
  'use strict';

  const NEWSLETTER_ENDPOINT = '';
  const EMAIL_FIELD = 'email';

  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');

  if (!NEWSLETTER_ENDPOINT) {
    if (input) {
      input.disabled = true;
      input.placeholder = 'Newsletter launching soon';
    }
    if (button) {
      button.disabled = true;
      button.textContent = 'Coming soon';
    }
    form.addEventListener('submit', (event) => event.preventDefault());
    return;
  }

  form.setAttribute('action', NEWSLETTER_ENDPOINT);
  if (input) input.setAttribute('name', EMAIL_FIELD);

  form.addEventListener('submit', () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'newsletter_signup', { page_path: window.location.pathname || '/' });
    }
    // Let the browser submit to the provider (opens its confirmation page in a new tab),
    // then reset the button here.
    setTimeout(() => {
      if (button) button.textContent = 'Check your inbox';
      if (input) input.value = '';
    }, 50);
  });
})();
