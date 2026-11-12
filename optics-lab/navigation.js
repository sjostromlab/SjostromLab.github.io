/* Vibe coding by Jesper Sjöström with help from ChatGPT Codex. Updated 2026-11-11. Shared course navigation and footer. */
(function() {
  'use strict';

  // Ordered course metadata used by every simulation page.
  const pages = [{
    file: 'optics-lab-polarization.html',
    short: 'Polarization',
    challenge: 'Set a horizontal input to 50% transmitted power first with a rotating polarizer and then with the half-wave plate plus PBS. Compare the two output polarizations.',
    checkpoint: 'Both approaches can give 50% power. The rotating polarizer leaves the transmitted field at 45°, whereas the fixed PBS output remains P-polarized; the half-wave plate changes the split rather than the output axis.'
  }, {
    file: 'optics-lab-scan-relay.html',
    short: 'Scan relay',
    challenge: 'First obtain an approximately collimated telescope without scanning. Then image the X galvo onto the objective back aperture and inspect the residual Y-axis walk.',
    checkpoint: 'The lens separation should be close to f₁ + f₂. Because the two physical galvos are separated, one objective back-aperture plane cannot be perfectly conjugate to both at once.'
  }, {
    file: 'optics-lab-pupil-focus.html',
    short: 'Back aperture to focus',
    challenge: 'Compare underfilling, matched filling, and overfilling while holding incident power constant. Identify where resolution gains become small but aperture loss continues to rise.',
    checkpoint: 'Underfilling broadens the focus. Moderate overfilling approaches the uniformly illuminated aperture limit, but progressively wastes more incident power outside the back aperture.'
  }, {
    file: 'optics-lab-chirp.html',
    short: 'Pulse chirp',
    challenge: 'Load the Chameleon Ultra II preset, increase the optical-path GDD, and note what changes despite constant average power. Then apply ideal compensation and explain the recovery.',
    checkpoint: 'Dispersion conserves pulse energy in this model but spreads it over time. The lower peak power reduces two-photon excitation; equal and opposite pre-chirp restores the transform-limited duration when only second-order dispersion is present.'
  }, {
    file: 'optics-lab-raster-image.html',
    short: 'Scanned image',
    challenge: 'Make the pixel spacing finer than half the optical FWHM, then compare short and long dwell times with shot noise enabled.',
    checkpoint: 'Finer sampling preserves spatial information but does not improve the optical PSF. Longer dwell increases photon counts and SNR while reducing frame rate.'
  }, {
    file: 'optics-lab-pmt-collection.html',
    short: 'PMT imaging',
    challenge: 'Load the epi and substage presets, display the conjugate-image arrows, and compare how much the back-aperture image moves during the angle sweep.',
    checkpoint: 'The two-lens substage arrangement places the conjugate image close to the PMT surface. The measured one-lens epi arrangement works, but its image moves more during scanning and is constrained by the R3896’s 8 mm short axis.'
  }, {
    file: 'optics-lab-filters.html',
    short: 'Filters',
    challenge: 'Populate filter positions 1–5 for green/red detection. Then remove the 2p excitation blocker from the two-filter stack at position 2 and reverse the red/green dichroic at position 3. Explain the different failures.',
    checkpoint: 'The collection dichroic, laser blocker, channel-splitting dichroic, and two emission filters perform different jobs. A dichroic alone neither guarantees excitation rejection nor defines a clean detector band.'
  }, {
    file: 'optics-lab-image-diagnosis.html',
    short: 'Troubleshooting',
    challenge: 'Work through the preset faults without revealing the answer. Use the simulated alignment tests to distinguish clipping, conjugation error, underfilling, sampling noise, and detector walk.',
    checkpoint: 'Image appearance is rarely diagnostic by itself. A useful diagnosis combines the spatial pattern with a targeted test: inspect the back aperture, reduce scan amplitude, move the beam, change dwell, or sweep the PMT image.'
  }];

  // Add page-specific guidance and previous/next navigation.
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  const pageIndex = pages.findIndex((page) => page.file === currentFile);

  if (pageIndex >= 0) {
    const page = pages[pageIndex];
    const previous = pages[pageIndex - 1];
    const next = pages[pageIndex + 1];
    const course = document.createElement('section');
    course.className = 'learning-nav';
    course.setAttribute('aria-label', 'Guided training');
    course.innerHTML = `
      <div class="learning-heading">
        <div><span>GUIDED TRAINING · ${pageIndex + 1} OF ${pages.length}</span><strong>${page.short}</strong></div>
        <a href="index.html">All simulations</a>
      </div>
      <details class="learning-challenge">
        <summary>Try the guided challenge</summary>
        <p>${page.challenge}</p>
        <details class="checkpoint"><summary>Reveal the checkpoint</summary><p>${page.checkpoint}</p></details>
      </details>
      <nav class="sequence-links" aria-label="Simulation sequence">
        ${previous ? `<a href="${previous.file}">← ${previous.short}</a>` : '<span></span>'}
        ${next ? `<a href="${next.file}">${next.short} →</a>` : '<span></span>'}
      </nav>
    `;
    const main = document.querySelector('main');
    if (main) main.appendChild(course);
  }

  // Create the shared footer when a page does not already provide one.
  let footer = document.querySelector('footer');
  if (!footer) {
    footer = document.createElement('footer');
  }

  footer.className = 'site-footer';
  const overallMenuLink = currentFile === 'index.html' ? '<a href="../index.html">Main menu</a>' : '';
  footer.innerHTML = `
    <p><strong>Optics Lab</strong></p>
    <nav aria-label="Further information">
      ${overallMenuLink}
      <a href="http://plasticity.muhc.mcgill.ca/index.html" target="_blank" rel="noopener">Sjöström Lab</a>
      <a href="https://github.com/sjostromlab/optics-lab" target="_blank" rel="noopener">GitHub source</a>
    </nav>
  `;

  const main = document.querySelector('main');
  if (main) main.insertAdjacentElement('afterend', footer);
  else document.body.appendChild(footer);

  // Shared navigation and footer styles live here to keep all pages consistent.
  const style = document.createElement('style');
  style.textContent = `
    .site-footer {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px 24px !important;
      width: min(100% - 40px, 1180px) !important;
      margin: 0 auto 24px !important;
      padding: 18px 0 0 !important;
      border: 0 !important;
      border-top: 1px solid #d4e0dc !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      color: #60767d !important;
      font: 13px/1.5 system-ui, -apple-system, sans-serif !important;
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
      outline: 3px solid #ce922f !important;
      outline-offset: 4px !important;
    }
    .learning-nav {
      margin: 18px 0 0 !important;
      padding: 16px !important;
      border: 1px solid #cfdeda !important;
      border-radius: 9px !important;
      background: #ffffff !important;
      color: #24424b !important;
      font: 13px/1.5 system-ui, -apple-system, sans-serif !important;
    }
    .learning-heading,
    .sequence-links {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 14px !important;
    }
    .learning-heading span {
      display: block !important;
      color: #087f79 !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      letter-spacing: .12em !important;
    }
    .learning-heading strong { display: block !important; font-size: 16px !important; }
    .learning-nav a { color: #176d69 !important; text-underline-offset: 3px !important; }
    .learning-challenge {
      margin: 13px 0 !important;
      padding: 11px 13px !important;
      border-radius: 7px !important;
      background: #e8f2ef !important;
    }
    .learning-challenge > summary,
    .checkpoint > summary { cursor: pointer !important; font-weight: 700 !important; }
    .learning-challenge p { margin: 8px 0 0 !important; }
    .checkpoint {
      margin-top: 10px !important;
      padding-top: 9px !important;
      border-top: 1px solid #c7dbd5 !important;
    }
    .sequence-links { border-top: 1px solid #dce7e3 !important; padding-top: 12px !important; }
    .sequence-links a:last-child { text-align: right !important; }
    @media (max-width: 540px) {
      .site-footer {
        align-items: flex-start !important;
        flex-direction: column !important;
        margin-bottom: 72px !important;
      }
      .learning-heading { align-items: flex-start !important; }
    }
  `;
  document.head.appendChild(style);
})();
