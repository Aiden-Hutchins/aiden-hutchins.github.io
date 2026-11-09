// Runs in <head>, before the page paints (loaded without defer).
// 1. Marks the page as JS-capable, so redaction bars only appear when JS can lift them.
// 2. Decides whether to play the folder intro: only on a fresh open of the page in a
//    tab (not on reload, back/forward, a #section link, or reduced motion), once per tab.
// 3. Pre-computes the geometry that fits the shrunk live page inside the folder.
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  try {
    var nav = performance.getEntriesByType('navigation')[0];
    var type = nav ? nav.type : 'navigate';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (type !== 'navigate' || reduce || location.hash || sessionStorage.getItem('intro-seen')) return;
    sessionStorage.setItem('intro-seen', '1');
  } catch (e) {
    return; // storage blocked or old browser: skip the intro
  }

  var vw = window.innerWidth;
  var vh = window.innerHeight;

  // Folder size: the folder is drawn at 200x144 in site.css and scaled up to
  // roughly a third of the window (never below 1x, so phones keep the base size).
  var FOLDER_W = 200, FOLDER_H = 144;
  var folderScale = Math.min(vw * 0.34 / FOLDER_W, vh * 0.42 / FOLDER_H);
  folderScale = Math.max(1, Math.min(folderScale, 3));

  // Window inside the folder at base size, in px. Must match site.css:
  // back panel = bottom 84% (121px) of the 200x144 stage.
  var WIN_W = 176 * folderScale;          // back width (200) minus a 12px margin each side
  var WIN_H = 100 * folderScale;          // back height (121) minus ~10px top and bottom
  var WIN_OFFSET_Y = 11.5 * folderScale;  // back panel's center sits below the stage's center
  var WIN_RADIUS = 3 * folderScale;       // window corner radius as it appears on screen

  // Show a region of the page with the window's aspect ratio (top of the page,
  // centered), then scale it so that region lands exactly on the window.
  var regionW = Math.min(vw, vh * WIN_W / WIN_H);
  var regionH = regionW * WIN_H / WIN_W;
  var scale = WIN_W / regionW;

  var set = function (name, value) { root.style.setProperty(name, value); };
  set('--folder-scale', folderScale);
  set('--intro-s', scale);
  set('--intro-oy', (regionH / 2) + 'px');
  set('--intro-dy', (vh / 2 + WIN_OFFSET_Y - regionH / 2) + 'px');
  set('--intro-cx', ((vw - regionW) / 2) + 'px');
  set('--intro-cb', (vh - regionH) + 'px');
  set('--intro-r', (WIN_RADIUS / scale) + 'px');

  root.classList.add('intro-active');
})();
