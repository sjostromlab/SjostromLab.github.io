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

  /*
   * Keep the collection footer identical across simulations whose main
   * layouts and accent colours differ. The repository URL below is the
   * planned permanent location for this collection.
   */
  const footer = document.querySelector('footer');
  if (footer) {
    footer.classList.add('site-footer');

    const footerStyle = document.createElement('style');
    footerStyle.textContent = `
      .site-footer {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px 24px !important;
        margin-top: 28px !important;
        padding: 20px 18px 12px !important;
        box-sizing: border-box !important;
        border: 0 !important;
        border-top: 1px solid #dce3e8 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #647580 !important;
        font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        text-align: left !important;
      }
      .site-footer p { margin: 0 !important; }
      .site-footer nav {
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
        gap: 12px 20px !important;
      }
      .site-footer a {
        color: #385568 !important;
        font-weight: 400 !important;
        text-underline-offset: 4px !important;
      }
      .site-footer a:focus-visible {
        outline: 3px solid #184d8b !important;
        outline-offset: 4px !important;
      }
      @media (max-width: 540px) {
        .site-footer {
          align-items: flex-start !important;
          justify-content: flex-start !important;
          flex-direction: column !important;
        }
      }
    `;
    document.head.appendChild(footerStyle);

    let label = footer.querySelector('p');
    if (!label) {
      label = document.createElement('p');
      footer.prepend(label);
    }
    label.innerHTML = '<strong>Neuroscience teaching tools</strong>';

    let footerNav = footer.querySelector('nav');
    if (!footerNav) {
      footerNav = document.createElement('nav');
      footer.appendChild(footerNav);
    }
    footerNav.setAttribute('aria-label', 'Further information');

    const footerMainMenu = Array.from(footerNav.querySelectorAll('a')).find(
      link => link.textContent.trim() === 'Main menu'
    );
    const labLink = document.createElement('a');
    labLink.href = 'http://plasticity.muhc.mcgill.ca/index.html';
    labLink.target = '_blank';
    labLink.rel = 'noopener';
    labLink.textContent = 'Sjöström Lab';

    const sourceLink = document.createElement('a');
    sourceLink.href = 'https://github.com/sjostromlab/neurosci-sims';
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener';
    sourceLink.textContent = 'GitHub source';

    footerNav.replaceChildren(...(footerMainMenu ? [footerMainMenu] : []), labLink, sourceLink);
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
