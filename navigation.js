/*
 * Shared navigation for the Neuroscience teaching tools.
 *
 * Safari restricts scripted cross-tab navigation between local file:// pages.
 * Local files therefore navigate in the current tab. Pages served over HTTP or
 * HTTPS use stable window names, so an absent page opens once and an existing
 * page is reused and brought forward.
 */
(function () {
  'use strict';

  const pageWindowName = document.body.dataset.windowName;
  if (pageWindowName) window.name = pageWindowName;

  const decodedPath = decodeURIComponent(window.location.pathname);
  if (decodedPath.includes('/main-menu-rs-groups/')) {
    document.querySelectorAll('[data-staging-href]').forEach(link => {
      link.href = link.dataset.stagingHref;
    });
  }

  const mainMenuLink = document.querySelector('a[target="neuroscienceTeachingToolsMenu"][data-window-nav]');
  if (mainMenuLink && /\/(?:[^/]+-edit|menu-footer-edit|add-csv-exports)\//.test(decodedPath)) {
    const levelsUp = decodedPath.includes('/menu-footer-edit/') || decodedPath.includes('/add-csv-exports/') ? '../../' : '../';
    mainMenuLink.href = new URL(`${levelsUp}main-menu-rs-groups/index.html`, window.location.href).href;
  }

  document.querySelectorAll('a[data-window-nav]').forEach(link => {
    link.addEventListener('click', event => {
      if (window.location.protocol === 'file:') {
        event.preventDefault();
        window.location.href = link.href;
        return;
      }

      event.preventDefault();
      const destination = window.open(link.href, link.target);
      if (destination) destination.focus();
      else window.location.href = link.href;
    });
  });
})();
