'use strict';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Email links ──────────────────────────────────────────────
// Build mailto: links from split data attributes, so the full address
// never appears in the HTML source for simple scrapers to collect.
document.querySelectorAll('a[data-email-user][data-email-domain]').forEach((link) => {
  link.href = `mailto:${link.dataset.emailUser}@${link.dataset.emailDomain}`;
});

// ── Nav: highlight the section in view ───────────────────────
const navLinks = new Map(
  [...document.querySelectorAll('.site-nav a[href^="#"]')]
    .map((a) => [a.getAttribute('href').slice(1), a])
);
const sections = [...navLinks.keys()].map((id) => document.getElementById(id)).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.removeAttribute('aria-current'));
      navLinks.get(entry.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => navObserver.observe(s));
}

// ── Redaction lift ───────────────────────────────────────────
// Any element with .redact gets a black bar (CSS) that lifts when an ancestor
// with [data-redact-group] receives .redact-ready.
//   data-redact-group="load"   → lifts once the page (and intro, if any) is ready
//   data-redact-group="scroll" → lifts when the group scrolls into view
const liftGroup = (group) => group.classList.add('redact-ready');
const loadGroups = [...document.querySelectorAll('[data-redact-group="load"]')];
const scrollGroups = [...document.querySelectorAll('[data-redact-group="scroll"]')];

if ('IntersectionObserver' in window && !reduceMotion) {
  const redactObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      liftGroup(entry.target);
      redactObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  scrollGroups.forEach((g) => redactObserver.observe(g));
} else {
  scrollGroups.forEach(liftGroup);
}

// ── Folder intro ─────────────────────────────────────────────
// intro.js (in <head>) adds .intro-active when the intro should play.
// Timing matches the original draft.
const INTRO_STAGES = [
  [40,   'stage-in'],      // folder fades/slides into place
  [480,  'stage-open'],    // front flap opens, revealing the shrunk live page
  [1050, 'stage-expand'],  // the page scales up to fill the screen
];
const INTRO_DONE = 1050 + 900;

function pageReady() {
  loadGroups.forEach(liftGroup);
}

if (root.classList.contains('intro-active')) {
  INTRO_STAGES.forEach(([delay, cls]) => setTimeout(() => root.classList.add(cls), delay));
  setTimeout(() => {
    // Settled at full size: drop the intro machinery so the page returns
    // to normal, scrollable document flow.
    root.classList.remove('intro-active', 'stage-in', 'stage-open', 'stage-expand');
    pageReady();
  }, INTRO_DONE);
} else {
  pageReady();
}

// ── Footer wordmark: hutchins → hutchinsight → hutch insight → hutch in sight ──
(() => {
  const CONFIG = {
    stepMs: 2400,   // time on each stage
    loop: true,     // false = play through once each time the footer scrolls into view
  };

  const STAGES = [
    { icon: 'name',    gaps: [],     hi: [] },
    { icon: 'site',    gaps: [],     hi: [] },
    { icon: 'insight', gaps: [5],    hi: [5, 6, 7, 8, 9, 10, 11] },
    { icon: 'sight',   gaps: [5, 7], hi: [7, 8, 9, 10, 11] },
  ];

  const footer = document.querySelector('.hs-footer');
  if (!footer) return;
  const mark = footer.querySelector('.hs-mark');
  const word = footer.querySelector('.hs-word');
  const icons = [...footer.querySelectorAll('.hs-icon svg')];

  const letters = [];
  const addLetter = (parent, ch, delay = 0) => {
    const s = document.createElement('span');
    s.className = 'hs-ch';
    s.textContent = ch;
    if (delay) s.style.transitionDelay = `${delay}ms`; // CSSOM: allowed by the CSP
    parent.appendChild(s);
    letters.push(s);
  };
  [...'hutchins'].forEach((c) => addLetter(word, c));
  const ext = document.createElement('span');
  ext.className = 'hs-ext';
  word.appendChild(ext);
  [...'ight'].forEach((c, i) => addLetter(ext, c, i * 70));
  const tld = document.createElement('span');
  tld.className = 'hs-ext hs-ext--tld';
  word.appendChild(tld);
  [...'.com'].forEach((c, i) => addLetter(tld, c, 280 + i * 70)); // after "ight" lands

  function show(n) {
    const s = STAGES[n];
    mark.classList.toggle('is-joined', n > 0);
    mark.classList.toggle('is-domain', s.icon === 'site');
    letters.forEach((el, i) => {
      el.style.marginLeft = s.gaps.includes(i) ? '0.5em' : '0';
      el.classList.toggle('is-hi', s.hi.includes(i));
    });
    icons.forEach((svg) => svg.classList.toggle('is-active', svg.dataset.icon === s.icon));
  }

  // Reduced motion: show the joined domain statically and stop.
  if (reduceMotion) { show(1); return; }

  let stage = 0;
  let timer = null;
  let visible = false;

  function stop() { clearInterval(timer); timer = null; }
  function step() {
    const next = stage + 1;
    if (next >= STAGES.length && !CONFIG.loop) { stop(); return; }
    stage = next % STAGES.length;
    show(stage);
  }
  function start() {
    if (timer) return;
    if (!CONFIG.loop) { stage = 0; show(0); }
    timer = setInterval(step, CONFIG.stepMs);
  }

  show(0);

  // Only animate while the footer is on screen and the tab is visible.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !document.hidden) start(); else stop();
  }, { threshold: 0.5 }).observe(mark);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible) start();
  });
})();
