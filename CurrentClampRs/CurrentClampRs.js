/*
 * Series Resistance in Current Clamp — Version 1.0
 * Created 27 October 2026, "vibe coded" by P. Jesper Sjöström
 * with assistance from OpenAI Codex / ChatGPT.
 *
 * P. Jesper Sjöström directed the scientific and teaching design, supplied
 * the requirements, and reviewed iterative revisions. OpenAI Codex generated
 * the implementation and assisted with debugging, numerical checks, and
 * interface refinement.
 *
 * The membrane signal is generated independently, then passed through a
 * first-order electrode model. The electrode approaches Vm + Iinj*Rs with
 * time constant Rs*Cp. This exposes the resistive offset and bandwidth loss
 * separately. The spike generator uses the Hodgkin-Huxley (1952) equations.
 */

const DEFAULTS = {
  fontSize: 18,
  rs: 25,
  cp: 5,
  bridge: 100,
  neutral: 0,
  rm: 100,
  cm: 100,
  rest: -65,
  step: 100,
  stepDuration: 40,
  epspG: 1,
  epspRise: 1,
  epspTau: 10,
  spikeCurrent: 0.7,
  spikeDuration: 12
};

const CONTROL_PAIRS = [
  ['rsNumber', 'rsRange', 'rs'],
  ['cpNumber', 'cpRange', 'cp'],
  ['bridgeNumber', 'bridgeRange', 'bridge'],
  ['neutralNumber', 'neutralRange', 'neutral'],
  ['rmNumber', 'rmRange', 'rm'],
  ['cmNumber', 'cmRange', 'cm'],
  ['restNumber', 'restRange', 'rest'],
  ['stepNumber', 'stepRange', 'step'],
  ['stepDurationNumber', 'stepDurationRange', 'stepDuration'],
  ['epspGNumber', 'epspGRange', 'epspG'],
  ['epspRiseNumber', 'epspRiseRange', 'epspRise'],
  ['epspTauNumber', 'epspTauRange', 'epspTau'],
  ['spikeCurrentNumber', 'spikeCurrentRange', 'spikeCurrent'],
  ['spikeDurationNumber', 'spikeDurationRange', 'spikeDuration']
];

let latest = null;
let pendingFrame = null;
let currentView = 'passive';
const VIEW_ORDER = ['passive', 'spike', 'epsp', 'all'];

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Blob-based export avoids Plotly's legacy data-URL download path in Safari.
async function downloadPlotPNG(plot) {
  const filenames = {
    stepPlot: 'CurrentClampRs_passive_step.png',
    spikePlot: 'CurrentClampRs_action_potential.png',
    epspPlot: 'CurrentClampRs_EPSP.png'
  };
  try {
    const dataURL = await Plotly.toImage(plot, {
      format: 'png',
      width: plot._fullLayout.width,
      height: plot._fullLayout.height,
      scale: 2
    });
    const bytes = Uint8Array.from(atob(dataURL.split(',')[1]), character => character.charCodeAt(0));
    saveBlob(new Blob([bytes], { type: 'image/png' }), filenames[plot.id] || 'CurrentClampRs_plot.png');
  } catch (error) {
    console.error('PNG export failed:', error);
    window.alert('The PNG could not be generated. Please try again.');
  }
}

const plotConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['toImage', 'lasso2d', 'select2d'],
  modeBarButtonsToAdd: [{ name: 'Download plot as PNG', icon: Plotly.Icons.camera, click: downloadPlotPNG }]
};

function byId(id) { return document.getElementById(id); }
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function finiteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bindPair(numberId, rangeId, key) {
  const number = byId(numberId);
  const range = byId(rangeId);
  const sync = (source, target) => {
    let value = finiteNumber(source.value, DEFAULTS[key]);
    value = clamp(value, Number(source.min), Number(source.max));
    source.value = value;
    target.value = value;
    scheduleUpdate();
  };
  number.addEventListener('change', () => sync(number, range));
  range.addEventListener('input', () => sync(range, number));
}

function readParameters() {
  return {
    fontSize: finiteNumber(byId('fontSize').value, DEFAULTS.fontSize),
    rs: finiteNumber(byId('rsNumber').value, DEFAULTS.rs),
    cp: finiteNumber(byId('cpNumber').value, DEFAULTS.cp),
    bridge: finiteNumber(byId('bridgeNumber').value, DEFAULTS.bridge),
    neutral: finiteNumber(byId('neutralNumber').value, DEFAULTS.neutral),
    rm: finiteNumber(byId('rmNumber').value, DEFAULTS.rm),
    cm: finiteNumber(byId('cmNumber').value, DEFAULTS.cm),
    rest: finiteNumber(byId('restNumber').value, DEFAULTS.rest),
    step: finiteNumber(byId('stepNumber').value, DEFAULTS.step),
    stepDuration: finiteNumber(byId('stepDurationNumber').value, DEFAULTS.stepDuration),
    epspG: finiteNumber(byId('epspGNumber').value, DEFAULTS.epspG),
    epspRise: finiteNumber(byId('epspRiseNumber').value, DEFAULTS.epspRise),
    epspTau: finiteNumber(byId('epspTauNumber').value, DEFAULTS.epspTau),
    spikeCurrent: finiteNumber(byId('spikeCurrentNumber').value, DEFAULTS.spikeCurrent),
    spikeDuration: finiteNumber(byId('spikeDurationNumber').value, DEFAULTS.spikeDuration)
  };
}

function effectiveCp(p) {
  return Math.max(0.02, p.cp * (1 - p.neutral / 100));
}

function electrodeTau(p) {
  return p.rs * effectiveCp(p) / 1000;
}

function filterElectrode(vm, currentPA, dt, p) {
  const tau = electrodeTau(p);
  const alpha = tau > 0 ? Math.exp(-dt / tau) : 0;
  const raw = new Array(vm.length);
  const corrected = new Array(vm.length);
  raw[0] = vm[0] + currentPA[0] * p.rs / 1000;
  corrected[0] = raw[0] - currentPA[0] * p.rs * p.bridge / 100000;
  for (let i = 1; i < vm.length; i += 1) {
    const target = vm[i] + currentPA[i] * p.rs / 1000;
    raw[i] = target + (raw[i - 1] - target) * alpha;
    corrected[i] = raw[i] - currentPA[i] * p.rs * p.bridge / 100000;
  }
  return { raw, corrected };
}

function simulatePassiveStep(p) {
  const dt = 0.02;
  const duration = 80;
  const start = 10;
  const stop = start + p.stepDuration;
  const n = Math.round(duration / dt) + 1;
  const time = new Array(n);
  const vm = new Array(n);
  const current = new Array(n);
  const tauM = p.rm * p.cm / 1000;
  vm[0] = p.rest;
  current[0] = 0;
  time[0] = 0;
  const decay = Math.exp(-dt / tauM);
  for (let i = 1; i < n; i += 1) {
    const t = i * dt;
    const iCmd = t >= start && t < stop ? p.step : 0;
    const target = p.rest + iCmd * p.rm / 1000;
    time[i] = t;
    current[i] = iCmd;
    vm[i] = target + (vm[i - 1] - target) * decay;
  }
  const electrode = filterElectrode(vm, current, dt, p);
  return { time, vm, current, ...electrode, start, stop, tauM };
}

function doubleExponential(t, rise, decay) {
  if (t < 0) return 0;
  if (Math.abs(decay - rise) < 1e-6) {
    return (t / rise) * Math.exp(1 - t / rise);
  }
  const peakTime = Math.log(decay / rise) / (1 / rise - 1 / decay);
  const norm = Math.exp(-peakTime / decay) - Math.exp(-peakTime / rise);
  return (Math.exp(-t / decay) - Math.exp(-t / rise)) / norm;
}

function simulateEPSP(p) {
  const dt = 0.02;
  const duration = 80;
  const start = 10;
  const rise = p.epspRise;
  const n = Math.round(duration / dt) + 1;
  const time = new Array(n);
  const vm = new Array(n);
  const current = new Array(n).fill(0);
  const synCurrent = new Array(n).fill(0);
  const g = new Array(n);
  const gLeak = 1000 / p.rm;
  vm[0] = p.rest;
  time[0] = 0;
  g[0] = 0;
  for (let i = 1; i < n; i += 1) {
    const t = i * dt;
    const gSyn = p.epspG * doubleExponential(t - start, rise, p.epspTau);
    const previous = vm[i - 1];
    // Outward-positive convention: an excitatory current at negative Vm is negative.
    const iSyn = gSyn * (previous - 0);
    const currentTotal = -gLeak * (previous - p.rest) - iSyn;
    time[i] = t;
    g[i] = gSyn;
    synCurrent[i] = iSyn;
    vm[i] = previous + dt * currentTotal / p.cm;
  }
  const electrode = filterElectrode(vm, current, dt, p);
  return { time, vm, current, synCurrent, g, ...electrode, start };
}

function vtrap(x, y) {
  const z = x / y;
  return Math.abs(z) < 1e-6 ? y * (1 - z / 2) : x / (Math.exp(z) - 1);
}

function hhRates(v) {
  return {
    am: 0.1 * vtrap(-(v + 40), 10),
    bm: 4 * Math.exp(-(v + 65) / 18),
    ah: 0.07 * Math.exp(-(v + 65) / 20),
    bh: 1 / (1 + Math.exp(-(v + 35) / 10)),
    an: 0.01 * vtrap(-(v + 55), 10),
    bn: 0.125 * Math.exp(-(v + 65) / 80)
  };
}

function simulateSpike(p) {
  const dt = 0.005;
  const duration = 30;
  const start = 5;
  const stop = start + p.spikeDuration;
  const nSteps = Math.round(duration / dt) + 1;
  const time = new Array(nSteps);
  const vm = new Array(nSteps);
  const current = new Array(nSteps);
  // Total maximum Na and K conductances retain the original HH scaling.
  // The shared membrane controls supply the passive leak resistance, total
  // capacitance, and resting voltage, just as they do in the other protocols.
  const gNa = 12000;
  const gK = 3600;
  const gL = 1000 / p.rm;
  const eNa = 50;
  const eK = -77;
  const capacitance = p.cm;
  let v = p.rest;
  const initial = hhRates(v);
  let m = initial.am / (initial.am + initial.bm);
  let h = initial.ah / (initial.ah + initial.bh);
  let n = initial.an / (initial.an + initial.bn);
  // Choose E_L so the selected resting Vm is an equilibrium. This prevents a
  // change in Rm from silently adding a holding current. Rm is therefore the
  // passive leak resistance; voltage-gated channels can still contribute to
  // the HH cell's measured small-signal input resistance near rest.
  const iNaRest = gNa * m * m * m * h * (v - eNa);
  const iKRest = gK * n * n * n * n * (v - eK);
  const eL = v + (iNaRest + iKRest) / gL;
  time[0] = 0;
  vm[0] = v;
  current[0] = 0;
  for (let i = 1; i < nSteps; i += 1) {
    const t = i * dt;
    const iCmd = t >= start && t < stop ? p.spikeCurrent * 1000 : 0;
    const rates = hhRates(v);
    m += dt * (rates.am * (1 - m) - rates.bm * m);
    h += dt * (rates.ah * (1 - h) - rates.bh * h);
    n += dt * (rates.an * (1 - n) - rates.bn * n);
    const iNa = gNa * m * m * m * h * (v - eNa);
    const iK = gK * n * n * n * n * (v - eK);
    const iLeak = gL * (v - eL);
    v += dt * (iCmd - iNa - iK - iLeak) / capacitance;
    time[i] = t;
    vm[i] = v;
    current[i] = iCmd;
  }
  const electrode = filterElectrode(vm, current, dt, p);
  return { time, vm, current, ...electrode, start, stop, dt };
}

function indexOfMax(values) {
  let index = 0;
  for (let i = 1; i < values.length; i += 1) if (values[i] > values[index]) index = i;
  return index;
}

function peakAboveRest(values, rest) {
  return values[indexOfMax(values)] - rest;
}

function halfWidth(time, values, rest) {
  const peakIndex = indexOfMax(values);
  const half = rest + (values[peakIndex] - rest) / 2;
  let left = peakIndex;
  let right = peakIndex;
  while (left > 0 && values[left] >= half) left -= 1;
  while (right < values.length - 1 && values[right] >= half) right += 1;
  return time[right] - time[left];
}

function maxSlope(values, dt) {
  let maximum = -Infinity;
  for (let i = 1; i < values.length; i += 1) maximum = Math.max(maximum, (values[i] - values[i - 1]) / dt);
  return maximum;
}

function maxSlopeBetween(values, dt, firstIndex, lastIndex) {
  let maximum = -Infinity;
  const start = Math.max(1, firstIndex);
  const stop = Math.min(values.length - 1, lastIndex);
  for (let i = start; i <= stop; i += 1) maximum = Math.max(maximum, (values[i] - values[i - 1]) / dt);
  return maximum;
}

function thresholdIndex(values, dt, criterion = 20) {
  for (let i = 1; i < values.length; i += 1) {
    if ((values[i] - values[i - 1]) / dt >= criterion) return i;
  }
  return indexOfMax(values);
}

function metric(label, value) {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}

function baseLayout(title, p, options = {}) {
  const compact = currentView === 'all';
  const compactAxisFont = Math.max(10, p.fontSize - 4);
  const compactTitleFont = Math.max(11, p.fontSize - 3);
  return {
    title: { text: `<b>${title}</b>`, x: 0.02, xanchor: 'left', y: 0.97, font: { size: p.fontSize + 2 } },
    margin: { l: compact ? 62 : 72, r: compact ? 112 : 150, t: compact ? 54 : 62, b: compact ? 47 : 52, pad: 0 },
    autosize: true,
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    font: { family: 'Arial, Helvetica, sans-serif', size: p.fontSize, color: '#24323a' },
    hovermode: 'x unified',
    legend: { orientation: 'v', x: 1.02, xanchor: 'left', y: 0.98, yanchor: 'top', bgcolor: 'rgba(255,255,255,0)', font: { size: Math.max(10, p.fontSize - (compact ? 5 : 3)) } },
    xaxis: { title: { text: 'Time (ms)', standoff: 5 }, anchor: 'y2', automargin: true, gridcolor: '#e3e7ea', zeroline: false },
    yaxis: {
      title: { text: 'V<sub>m</sub> (mV)', standoff: compact ? 2 : 5, font: { size: compact ? compactTitleFont : p.fontSize } },
      tickfont: { size: compact ? compactAxisFont : p.fontSize },
      domain: compact ? [0.40, 1] : [0.33, 1], automargin: true, gridcolor: '#e3e7ea', zeroline: false
    },
    yaxis2: {
      title: { text: options.currentTitle || 'I (nA)', standoff: compact ? 2 : 5, font: { size: compact ? compactTitleFont : p.fontSize } },
      tickfont: { size: compact ? compactAxisFont : p.fontSize },
      nticks: compact ? 3 : 0,
      domain: compact ? [0, 0.17] : [0, 0.20], anchor: 'x', automargin: true, gridcolor: '#edf0f2', zeroline: true, zerolinecolor: '#69757c', zerolinewidth: 1
    },
    shapes: options.shapes || [],
    annotations: options.annotations || [],
    uirevision: options.uirevision || title
  };
}

function voltageTraces(data, names = {}) {
  return [
    { x: data.time, y: data.vm, type: 'scatter', mode: 'lines', name: names.ideal || 'Membrane V<sub>m</sub>', line: { color: '#222', width: 2.2 }, hovertemplate: '%{y:.2f} mV<extra></extra>' },
    { x: data.time, y: data.raw, type: 'scatter', mode: 'lines', name: names.raw || 'Recorded voltage', line: { color: '#2476aa', width: 2.4 }, hovertemplate: '%{y:.2f} mV<extra></extra>' },
    { x: data.time, y: data.corrected, type: 'scatter', mode: 'lines', name: names.corrected || 'Bridge balance', line: { color: '#c56a2d', width: 2, dash: 'dash' }, hovertemplate: '%{y:.2f} mV<extra></extra>' }
  ];
}

function drawPlots(p, step, epsp, spike) {
  const stepCurrent = { x: step.time, y: step.current.map(value => value / 1000), type: 'scatter', mode: 'lines', name: 'Injected current', yaxis: 'y2', showlegend: false, fill: 'tozeroy', fillcolor: 'rgba(63,111,145,.12)', line: { color: '#263238', width: 2, shape: 'hv' }, hovertemplate: '%{y:.3f} nA<extra>Injected current</extra>' };
  const epspCurrent = { x: epsp.time, y: epsp.synCurrent.map(value => value / 1000), type: 'scatter', mode: 'lines', name: 'Synaptic current', yaxis: 'y2', showlegend: false, fill: 'tozeroy', fillcolor: 'rgba(63,111,145,.12)', line: { color: '#263238', width: 2 }, hovertemplate: '%{y:.4f} nA<extra>Synaptic current</extra>' };
  const spikeCurrent = { x: spike.time, y: spike.current.map(value => value / 1000), type: 'scatter', mode: 'lines', name: 'Injected current', yaxis: 'y2', showlegend: false, fill: 'tozeroy', fillcolor: 'rgba(63,111,145,.12)', line: { color: '#263238', width: 2, shape: 'hv' }, hovertemplate: '%{y:.3f} nA<extra>Injected current</extra>' };

  return Promise.all([
    Plotly.react('stepPlot', [...voltageTraces(step), stepCurrent], baseLayout('1. Passive step', p, { currentTitle: 'I<sub>inj</sub> (nA)', uirevision: 'step' }), plotConfig),
    Plotly.react('epspPlot', [...voltageTraces(epsp).slice(0, 2), epspCurrent], baseLayout('3. EPSP', p, { currentTitle: 'I<sub>syn</sub> (nA)', uirevision: 'epsp' }), plotConfig),
    Plotly.react('spikePlot', [...voltageTraces(spike), spikeCurrent], baseLayout('2. Action potential', p, { currentTitle: 'I<sub>inj</sub> (nA)', uirevision: 'spike' }), plotConfig)
  ]);
}

function updateReadouts(p, step, epsp, spike) {
  const tauM = p.rm * p.cm / 1000;
  const tauE = electrodeTau(p);

  const stepEndIndex = Math.max(0, Math.round((step.stop - 1) / 0.02));
  const rawStepError = step.raw[stepEndIndex] - step.vm[stepEndIndex];
  const correctedStepError = step.corrected[stepEndIndex] - step.vm[stepEndIndex];
  byId('stepMetrics').innerHTML =
    metric('Membrane τ<sub>m</sub>', `${tauM.toFixed(2)} ms`) +
    metric('Raw voltage offset', `${rawStepError.toFixed(2)} mV`) +
    metric('After bridge balance', `${correctedStepError.toFixed(2)} mV`);

  const idealEPSP = peakAboveRest(epsp.vm, p.rest);
  const recordedEPSP = peakAboveRest(epsp.raw, p.rest);
  const idealEPSPIndex = indexOfMax(epsp.vm);
  const recordedEPSPIndex = indexOfMax(epsp.raw);
  const epspError = idealEPSP === 0 ? 0 : 100 * (recordedEPSP - idealEPSP) / idealEPSP;
  const epspDelay = epsp.time[recordedEPSPIndex] - epsp.time[idealEPSPIndex];
  byId('epspMetrics').innerHTML =
    metric('True EPSP peak', `${idealEPSP.toFixed(2)} mV`) +
    metric('Peak error', `${epspError.toFixed(2)}%`) +
    metric('Peak delay', `${epspDelay.toFixed(3)} ms`);

  const thresholdAt = thresholdIndex(spike.vm, spike.dt);
  const thresholdShift = spike.raw[thresholdAt] - spike.vm[thresholdAt];
  const idealPeak = Math.max(...spike.vm);
  const correctedPeak = Math.max(...spike.corrected);
  const peakError = correctedPeak - idealPeak;
  const idealWidth = halfWidth(spike.time, spike.vm, -65);
  const correctedWidth = halfWidth(spike.time, spike.corrected, -65);
  const widthError = idealWidth === 0 ? 0 : 100 * (correctedWidth - idealWidth) / idealWidth;
  const spikePeakIndex = indexOfMax(spike.vm);
  const slopeWindowStart = Math.round((spike.start + 0.5) / spike.dt);
  const idealSlope = maxSlopeBetween(spike.vm, spike.dt, slopeWindowStart, spikePeakIndex);
  const correctedSlope = maxSlopeBetween(spike.corrected, spike.dt, slopeWindowStart, spikePeakIndex);
  const slopeLoss = 100 * (correctedSlope / idealSlope - 1);
  byId('spikeMetrics').innerHTML =
    metric('Raw threshold displacement', `${thresholdShift.toFixed(2)} mV`) +
    metric('Corrected peak error', `${peakError.toFixed(2)} mV`) +
    metric('Half-width error', `${widthError.toFixed(1)}%`) +
    metric('Maximum dV/dt error', `${slopeLoss.toFixed(1)}%`);

  const summaries = {
    passive: [
      ['τ<sub>m</sub>', `${tauM.toFixed(2)} ms`],
      ['τ<sub>electrode</sub>', `${tauE.toFixed(3)} ms`],
      ['Step I·R<sub>s</sub>', `${(p.step * p.rs / 1000).toFixed(2)} mV`],
      ['After bridge balance', `${correctedStepError.toFixed(2)} mV`]
    ],
    spike: [
      ['τ<sub>electrode</sub>', `${tauE.toFixed(3)} ms`],
      ['Spike I·R<sub>s</sub>', `${(p.spikeCurrent * p.rs).toFixed(2)} mV`],
      ['Threshold displacement', `${thresholdShift.toFixed(2)} mV`],
      ['Maximum dV/dt error', `${slopeLoss.toFixed(1)}%`]
    ],
    epsp: [
      ['τ<sub>electrode</sub>', `${tauE.toFixed(3)} ms`],
      ['True EPSP peak', `${idealEPSP.toFixed(2)} mV`],
      ['EPSP peak error', `${epspError.toFixed(2)}%`],
      ['EPSP peak delay', `${epspDelay.toFixed(3)} ms`]
    ],
    all: [
      ['τ<sub>m</sub>', `${tauM.toFixed(2)} ms`],
      ['τ<sub>electrode</sub>', `${tauE.toFixed(3)} ms`],
      ['Step I·R<sub>s</sub>', `${(p.step * p.rs / 1000).toFixed(2)} mV`],
      ['Spike I·R<sub>s</sub>', `${(p.spikeCurrent * p.rs).toFixed(2)} mV`]
    ]
  };
  summaries[currentView].forEach(([label, value], index) => {
    byId(`summaryLabel${index + 1}`).innerHTML = label;
    byId(`summaryValue${index + 1}`).textContent = value;
  });
}

function setView(view, shouldUpdate = true) {
  currentView = view;
  document.body.dataset.view = view;
  const compareAll = view === 'all';

  byId('plotGrid').classList.toggle('single-visible', !compareAll);
  byId('stepCard').hidden = !(view === 'passive' || compareAll);
  byId('epspCard').hidden = !(view === 'epsp' || compareAll);
  byId('spikeCard').hidden = !(view === 'spike' || compareAll);
  byId('takeawayCard').hidden = !compareAll;

  byId('passiveControls').hidden = false;
  byId('passiveStepControls').hidden = !(view === 'passive' || compareAll);
  byId('epspControls').hidden = !(view === 'epsp' || compareAll);
  byId('spikeControls').hidden = !(view === 'spike' || compareAll);

  byId('viewSelect').value = view;

  if (shouldUpdate) scheduleUpdate();
  queuePlotResize();
}

function stepView(offset) {
  const currentIndex = VIEW_ORDER.indexOf(currentView);
  const nextIndex = (currentIndex + offset + VIEW_ORDER.length) % VIEW_ORDER.length;
  setView(VIEW_ORDER[nextIndex]);
}

function update() {
  const p = readParameters();
  byId('fontSizeValue').textContent = `${p.fontSize} px`;
  const step = simulatePassiveStep(p);
  const epsp = simulateEPSP(p);
  const spike = simulateSpike(p);
  latest = { p, step, epsp, spike };
  const rendered = drawPlots(p, step, epsp, spike);
  updateReadouts(p, step, epsp, spike);
  rendered.then(queuePlotResize);
}

function resizeVisiblePlots() {
  for (const id of ['stepPlot', 'epspPlot', 'spikePlot']) {
    const plot = byId(id);
    if (plot && plot.offsetParent !== null && plot._fullLayout) Plotly.Plots.resize(plot);
  }
}

function queuePlotResize() {
  requestAnimationFrame(() => {
    resizeVisiblePlots();
    setTimeout(resizeVisiblePlots, 80);
  });
}

function scheduleUpdate() {
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    update();
  });
}

function reset() {
  byId('fontSize').value = DEFAULTS.fontSize;
  for (const [numberId, rangeId, key] of CONTROL_PAIRS) {
    byId(numberId).value = DEFAULTS[key];
    byId(rangeId).value = DEFAULTS[key];
  }
  setView('passive', false);
  update();
}

function csvValue(value) {
  return Number.isFinite(value) ? Number(value).toFixed(6) : '';
}

function downloadData() {
  if (!latest) return;
  const { step, epsp, spike } = latest;
  const rows = [['protocol', 'time_ms', 'membrane_mV', 'electrode_mV', 'bridge_balanced_mV', 'injected_current_pA']];
  for (const [name, data] of [['subthreshold_step', step], ['epsp', epsp], ['action_potential', spike]]) {
    for (let i = 0; i < data.time.length; i += 1) {
      rows.push([name, csvValue(data.time[i]), csvValue(data.vm[i]), csvValue(data.raw[i]), csvValue(data.corrected[i]), csvValue(data.current[i])]);
    }
  }
  const blob = new Blob([rows.map(row => row.join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'current_clamp_series_resistance.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

for (const [numberId, rangeId, key] of CONTROL_PAIRS) bindPair(numberId, rangeId, key);
byId('fontSize').addEventListener('input', scheduleUpdate);
byId('resetButton').addEventListener('click', reset);
byId('downloadButton').addEventListener('click', downloadData);
byId('viewSelect').addEventListener('change', event => setView(event.target.value));
byId('previousViewButton').addEventListener('click', () => stepView(-1));
byId('nextViewButton').addEventListener('click', () => stepView(1));
window.addEventListener('resize', queuePlotResize);
if ('ResizeObserver' in window) {
  let previousWidth = 0;
  const observer = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - previousWidth) > 1) {
      previousWidth = width;
      queuePlotResize();
    }
  });
  observer.observe(byId('plotGrid'));
}

setView('passive', false);
update();
