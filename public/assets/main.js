'use strict';

// Build mailto: links from split data attributes, so the full address
// never appears in the HTML source for simple scrapers to collect.
document.querySelectorAll('a[data-email-user][data-email-domain]').forEach((link) => {
  link.href = `mailto:${link.dataset.emailUser}@${link.dataset.emailDomain}`;
});

// Highlight the nav link for the section currently in view.
const navLinks = new Map(
  [...document.querySelectorAll('.site-nav a[href^="#"]')]
    .map((a) => [a.getAttribute('href').slice(1), a])
);
const sections = [...navLinks.keys()]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.removeAttribute('aria-current'));
      navLinks.get(entry.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => observer.observe(s));
}
