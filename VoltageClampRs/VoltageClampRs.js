/*
 * Series Resistance in Voltage Clamp — Version 0.9
 * Created 27 October 2026, "vibe coded" by P. Jesper Sjöström
 * with assistance from OpenAI Codex / ChatGPT.
 *
 * P. Jesper Sjöström directed the scientific and teaching design, supplied
 * the requirements, and reviewed the physiological interpretation. OpenAI
 * Codex generated the implementation and assisted with numerical checks and
 * interface design.
 *
 * The model is a single isopotential membrane controlled through a series
 * resistance. Positive current is outward, so Vm = Vcommand - I*Rs at steady
 * state. The optional compensation is an idealized reduction of effective Rs.
 */

"use strict";

const DEFAULTS = {
  fontSize: 18,
  rs: 25,
  compensation: 0,
  rm: 100,
  cm: 100,
  rest: -70,
  stepHold: -70,
  stepVoltage: 0,
  stepDuration: 20,
  synHold: -70,
  synReversal: 0,
  synG: 1,
  synRise: 0.5,
  synDecay: 8,
  ivSynG: 1,
  ivSynReversal: 0,
  ivModel: "ohmic"
};

const CONTROL_PAIRS = [
  ["rsNumber", "rsRange", "rs"],
  ["compNumber", "compRange", "compensation"],
  ["rmNumber", "rmRange", "rm"],
  ["cmNumber", "cmRange", "cm"],
  ["restNumber", "restRange", "rest"],
  ["stepHoldNumber", "stepHoldRange", "stepHold"],
  ["stepVoltageNumber", "stepVoltageRange", "stepVoltage"],
  ["stepDurationNumber", "stepDurationRange", "stepDuration"],
  ["synHoldNumber", "synHoldRange", "synHold"],
  ["synReversalNumber", "synReversalRange", "synReversal"],
  ["synGNumber", "synGRange", "synG"],
  ["synRiseNumber", "synRiseRange", "synRise"],
  ["synDecayNumber", "synDecayRange", "synDecay"],
  ["ivSynGNumber", "ivSynGRange", "ivSynG"],
  ["ivSynReversalNumber", "ivSynReversalRange", "ivSynReversal"]
];

const VIEW_ORDER = ["step", "synapse", "iv", "all"];
let currentView = "step";
let latest = null;
let pendingFrame = null;

function byId(id) { return document.getElementById(id); }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function finiteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function enforceSynapticTimeConstants(changedKey) {
  let rise = finiteNumber(byId("synRiseNumber").value, DEFAULTS.synRise);
  let decay = finiteNumber(byId("synDecayNumber").value, DEFAULTS.synDecay);
  if (decay > rise) return;
  if (changedKey === "synRise") {
    decay = Math.min(Number(byId("synDecayNumber").max), Math.ceil(rise + 0.001));
    byId("synDecayNumber").value = decay;
    byId("synDecayRange").value = decay;
  } else {
    rise = Math.max(Number(byId("synRiseNumber").min), decay - 0.1);
    byId("synRiseNumber").value = rise;
    byId("synRiseRange").value = rise;
  }
}

function bindPair(numberId, rangeId, key) {
  const number = byId(numberId);
  const range = byId(rangeId);
  const sync = (source, target) => {
    let value = finiteNumber(source.value, DEFAULTS[key]);
    value = clamp(value, Number(source.min), Number(source.max));
    source.value = value;
    target.value = value;
    if (key === "synRise" || key === "synDecay") enforceSynapticTimeConstants(key);
    scheduleUpdate();
  };
  number.addEventListener("change", () => sync(number, range));
  range.addEventListener("input", () => sync(range, number));
}

function readParameters() {
  return {
    fontSize: finiteNumber(byId("fontSize").value, DEFAULTS.fontSize),
    rs: finiteNumber(byId("rsNumber").value, DEFAULTS.rs),
    compensation: finiteNumber(byId("compNumber").value, DEFAULTS.compensation),
    rm: finiteNumber(byId("rmNumber").value, DEFAULTS.rm),
    cm: finiteNumber(byId("cmNumber").value, DEFAULTS.cm),
    rest: finiteNumber(byId("restNumber").value, DEFAULTS.rest),
    stepHold: finiteNumber(byId("stepHoldNumber").value, DEFAULTS.stepHold),
    stepVoltage: finiteNumber(byId("stepVoltageNumber").value, DEFAULTS.stepVoltage),
    stepDuration: finiteNumber(byId("stepDurationNumber").value, DEFAULTS.stepDuration),
    synHold: finiteNumber(byId("synHoldNumber").value, DEFAULTS.synHold),
    synReversal: finiteNumber(byId("synReversalNumber").value, DEFAULTS.synReversal),
    synG: finiteNumber(byId("synGNumber").value, DEFAULTS.synG),
    synRise: finiteNumber(byId("synRiseNumber").value, DEFAULTS.synRise),
    synDecay: finiteNumber(byId("synDecayNumber").value, DEFAULTS.synDecay),
    ivSynG: finiteNumber(byId("ivSynGNumber").value, DEFAULTS.ivSynG),
    ivSynReversal: finiteNumber(byId("ivSynReversalNumber").value, DEFAULTS.ivSynReversal),
    ivModel: byId("ivModel").value
  };
}

function effectiveRs(p) {
  return Math.max(0.01, p.rs * (1 - p.compensation / 100));
}

function passiveSteadyVoltage(command, p) {
  const rs = effectiveRs(p);
  return (command / rs + p.rest / p.rm) / (1 / rs + 1 / p.rm);
}

function clampTimeConstant(p) {
  return p.cm / (1000 / effectiveRs(p) + 1000 / p.rm);
}

function simulateVoltageStep(p) {
  const dt = 0.01;
  const start = 10;
  const stop = start + p.stepDuration;
  const duration = Math.max(60, stop + 10);
  const count = Math.round(duration / dt) + 1;
  const time = new Array(count);
  const command = new Array(count);
  const vm = new Array(count);
  const current = new Array(count);
  const idealSteadyCurrent = new Array(count);
  const rs = effectiveRs(p);
  const gSeries = 1000 / rs;
  const gLeak = 1000 / p.rm;
  const totalConductance = gSeries + gLeak;
  const tau = p.cm / totalConductance;
  let voltage = passiveSteadyVoltage(p.stepHold, p);

  for (let index = 0; index < count; index += 1) {
    const t = index * dt;
    const vCommand = t >= start && t < stop ? p.stepVoltage : p.stepHold;
    const iClamp = (vCommand - voltage) * 1000 / rs;
    time[index] = t;
    command[index] = vCommand;
    vm[index] = voltage;
    current[index] = iClamp;
    idealSteadyCurrent[index] = (vCommand - p.rest) * 1000 / p.rm;
    const target = (gSeries * vCommand + gLeak * p.rest) / totalConductance;
    voltage = target + (voltage - target) * Math.exp(-dt / tau);
  }
  return { time, command, vm, current, idealSteadyCurrent, dt, start, stop };
}

function doubleExponential(t, rise, decay) {
  if (t < 0) return 0;
  if (Math.abs(decay - rise) < 1e-8) return (t / rise) * Math.exp(1 - t / rise);
  const peakTime = Math.log(decay / rise) / (1 / rise - 1 / decay);
  const normalization = Math.exp(-peakTime / decay) - Math.exp(-peakTime / rise);
  return (Math.exp(-t / decay) - Math.exp(-t / rise)) / normalization;
}

function simulateSynapse(p) {
  const dt = 0.01;
  const duration = 80;
  const eventTime = 15;
  const count = Math.round(duration / dt) + 1;
  const time = new Array(count);
  const command = new Array(count).fill(p.synHold);
  const vm = new Array(count);
  const conductance = new Array(count);
  const idealCurrent = new Array(count);
  const recordedCurrent = new Array(count);
  const rs = effectiveRs(p);
  const gSeries = 1000 / rs;
  const gLeak = 1000 / p.rm;
  let voltage = passiveSteadyVoltage(p.synHold, p);
  const baselineCurrent = (p.synHold - voltage) * 1000 / rs;

  for (let index = 0; index < count; index += 1) {
    const t = index * dt;
    const gSyn = p.synG * doubleExponential(t - eventTime, p.synRise, p.synDecay);
    const iClamp = (p.synHold - voltage) * 1000 / rs;
    time[index] = t;
    vm[index] = voltage;
    conductance[index] = gSyn;
    idealCurrent[index] = gSyn * (p.synHold - p.synReversal);
    recordedCurrent[index] = iClamp - baselineCurrent;
    const totalConductance = gSeries + gLeak + gSyn;
    const target = (gSeries * p.synHold + gLeak * p.rest + gSyn * p.synReversal) / totalConductance;
    const tau = p.cm / totalConductance;
    voltage = target + (voltage - target) * Math.exp(-dt / tau);
  }
  return { time, command, vm, conductance, idealCurrent, recordedCurrent, dt, eventTime };
}

function rectificationFactor(voltage, model) {
  if (model === "ohmic") return 1;
  return 0.12 + 0.88 / (1 + Math.exp((voltage - 5) / 12));
}

function leakCurrent(voltage, p) {
  return (voltage - p.rest) * 1000 / p.rm;
}

function synapticIVCurrent(voltage, p) {
  return p.ivSynG * rectificationFactor(voltage, p.ivModel) * (voltage - p.ivSynReversal);
}

function steadyMembraneCurrent(voltage, p, synapseOpen) {
  return leakCurrent(voltage, p) + (synapseOpen ? synapticIVCurrent(voltage, p) : 0);
}

function solveSteadyVoltage(command, p, synapseOpen) {
  const rs = effectiveRs(p);
  const equation = voltage => voltage - command + steadyMembraneCurrent(voltage, p, synapseOpen) * rs / 1000;
  const roots = [];
  let left = -250;
  let leftValue = equation(left);
  for (let right = -249; right <= 200; right += 1) {
    const rightValue = equation(right);
    if (leftValue === 0 || leftValue * rightValue < 0) {
      let low = left;
      let high = right;
      let lowValue = leftValue;
      for (let iteration = 0; iteration < 60; iteration += 1) {
        const middle = (low + high) / 2;
        const middleValue = equation(middle);
        if (lowValue * middleValue <= 0) {
          high = middle;
        } else {
          low = middle;
          lowValue = middleValue;
        }
      }
      roots.push((low + high) / 2);
    }
    left = right;
    leftValue = rightValue;
  }
  if (roots.length) return roots.reduce((best, root) => Math.abs(root - command) < Math.abs(best - command) ? root : best);

  // A damped fixed-point fallback protects unusual user-selected combinations.
  let voltage = command;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const target = command - steadyMembraneCurrent(voltage, p, synapseOpen) * rs / 1000;
    voltage = clamp(0.7 * voltage + 0.3 * target, -250, 200);
  }
  return voltage;
}

function simulateIV(p) {
  const command = [];
  const idealHoldingCurrent = [];
  const measuredHoldingCurrent = [];
  const baselineVoltage = [];
  const idealSynapticCurrent = [];
  const measuredSynapticCurrent = [];
  const responseVoltage = [];
  const totalResponseCurrent = [];
  const rs = effectiveRs(p);
  for (let voltage = -100; voltage <= 50; voltage += 10) {
    const baselineVm = solveSteadyVoltage(voltage, p, false);
    const holdingCurrent = leakCurrent(baselineVm, p);
    const responseVm = solveSteadyVoltage(voltage, p, true);
    const responseCurrent = steadyMembraneCurrent(responseVm, p, true);
    command.push(voltage);
    idealHoldingCurrent.push(leakCurrent(voltage, p));
    measuredHoldingCurrent.push(holdingCurrent);
    baselineVoltage.push(voltage - holdingCurrent * rs / 1000);
    idealSynapticCurrent.push(synapticIVCurrent(voltage, p));
    measuredSynapticCurrent.push(responseCurrent - holdingCurrent);
    responseVoltage.push(voltage - responseCurrent * rs / 1000);
    totalResponseCurrent.push(responseCurrent);
  }
  return {
    command,
    idealHoldingCurrent,
    measuredHoldingCurrent,
    baselineVoltage,
    idealSynapticCurrent,
    measuredSynapticCurrent,
    responseVoltage,
    totalResponseCurrent
  };
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function downloadPlotPNG(plot) {
  const filenames = {
    stepPlot: "VoltageClampRs_voltage_step.png",
    synapsePlot: "VoltageClampRs_synaptic_current.png",
    ivHoldingPlot: "VoltageClampRs_holding_current_IV.png",
    ivSynapticPlot: "VoltageClampRs_synaptic_current_IV.png"
  };
  try {
    const dataURL = await Plotly.toImage(plot, {
      format: "png",
      width: plot._fullLayout.width,
      height: plot._fullLayout.height,
      scale: 2
    });
    const bytes = Uint8Array.from(atob(dataURL.split(",")[1]), character => character.charCodeAt(0));
    saveBlob(new Blob([bytes], { type: "image/png" }), filenames[plot.id] || "VoltageClampRs_plot.png");
  } catch (error) {
    console.error("PNG export failed:", error);
    window.alert("The PNG could not be generated. Please try again.");
  }
}

const plotConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d"],
  modeBarButtonsToAdd: [{ name: "Download plot as PNG", icon: Plotly.Icons.camera, click: downloadPlotPNG }]
};

function metric(label, value) {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}

function timeLayout(title, p, currentTitle) {
  const compact = currentView === "all";
  const compactAxisFont = Math.max(10, p.fontSize - 4);
  const compactTitleFont = Math.max(11, p.fontSize - 3);
  return {
    title: { text: `<b>${title}</b>`, x: 0.02, xanchor: "left", y: 0.97, font: { size: p.fontSize + 2 } },
    margin: { l: compact ? 62 : 72, r: compact ? 112 : 150, t: compact ? 54 : 62, b: compact ? 47 : 52 },
    autosize: true,
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { family: "Arial, Helvetica, sans-serif", size: p.fontSize, color: "#2f2930" },
    hovermode: "x unified",
    legend: { orientation: "v", x: 1.02, xanchor: "left", y: 0.98, yanchor: "top", bgcolor: "rgba(255,255,255,0)", font: { size: Math.max(10, p.fontSize - (compact ? 5 : 3)) } },
    xaxis: { title: { text: "Time (ms)", standoff: 5 }, anchor: "y2", automargin: true, gridcolor: "#eee7eb", zeroline: false },
    yaxis: {
      title: { text: "Voltage (mV)", standoff: compact ? 2 : 5, font: { size: compact ? compactTitleFont : p.fontSize } },
      tickfont: { size: compact ? compactAxisFont : p.fontSize }, nticks: compact ? 4 : 0,
      domain: compact ? [0.40, 1] : [0.33, 1], automargin: true, gridcolor: "#eee7eb", zeroline: false
    },
    yaxis2: {
      title: { text: currentTitle, standoff: compact ? 2 : 5, font: { size: compact ? compactTitleFont : p.fontSize } },
      tickfont: { size: compact ? compactAxisFont : p.fontSize }, nticks: compact ? 3 : 0,
      domain: compact ? [0, 0.17] : [0, 0.20], anchor: "x", automargin: true, gridcolor: "#f2edf0", zeroline: true, zerolinecolor: "#756b71", zerolinewidth: 1
    }
  };
}

function drawVoltageStep(p, data) {
  const traces = [
    { x: data.time, y: data.command, type: "scatter", mode: "lines", name: "V<sub>command</sub>", line: { color: "#222", width: 2, dash: "dash", shape: "hv" }, hovertemplate: "%{y:.2f} mV<extra>Command</extra>" },
    { x: data.time, y: data.vm, type: "scatter", mode: "lines", name: "Actual V<sub>m</sub>", line: { color: "#965579", width: 3 }, hovertemplate: "%{y:.2f} mV<extra>Actual Vm</extra>" },
    { x: data.time, y: data.current.map(value => value / 1000), type: "scatter", mode: "lines", name: "Clamp current", yaxis: "y2", fill: "tozeroy", fillcolor: "rgba(138,79,114,.13)", line: { color: "#965579", width: 2 }, hovertemplate: "%{y:.3f} nA<extra>Clamp current</extra>" },
    { x: data.time, y: data.idealSteadyCurrent.map(value => value / 1000), type: "scatter", mode: "lines", name: "Ideal steady current", yaxis: "y2", line: { color: "#222", width: 2, dash: "dot", shape: "hv" }, hovertemplate: "%{y:.3f} nA<extra>Ideal steady current</extra>" }
  ];
  return Plotly.react("stepPlot", traces, timeLayout("1. Voltage step", p, "Current (nA)"), plotConfig);
}

function drawSynapse(p, data) {
  const traces = [
    { x: data.time, y: data.command, type: "scatter", mode: "lines", name: "V<sub>hold</sub>", line: { color: "#222", width: 2, dash: "dash" }, hovertemplate: "%{y:.2f} mV<extra>Vhold</extra>" },
    { x: data.time, y: data.vm, type: "scatter", mode: "lines", name: "Actual V<sub>m</sub>", line: { color: "#965579", width: 3 }, hovertemplate: "%{y:.2f} mV<extra>Actual Vm</extra>" },
    { x: data.time, y: data.recordedCurrent.map(value => value / 1000), type: "scatter", mode: "lines", name: "Recorded current", yaxis: "y2", fill: "tozeroy", fillcolor: "rgba(138,79,114,.13)", line: { color: "#965579", width: 2 }, hovertemplate: "%{y:.4f} nA<extra>Recorded</extra>" },
    { x: data.time, y: data.idealCurrent.map(value => value / 1000), type: "scatter", mode: "lines", name: "Ideal current", yaxis: "y2", line: { color: "#222", width: 2, dash: "dot" }, hovertemplate: "%{y:.4f} nA<extra>Ideal</extra>" }
  ];
  return Plotly.react("synapsePlot", traces, timeLayout("2. Synaptic current", p, "I<sub>syn</sub> (nA)"), plotConfig);
}

function drawIV(p, data) {
  const compact = currentView === "all";
  const compactAxisFont = Math.max(9, p.fontSize - 6);
  const compactTitleFont = Math.max(10, p.fontSize - 5);
  const markerSize = compact ? 5 : 7;
  const holdingTraces = [
    {
      x: data.command, y: data.idealHoldingCurrent, type: "scatter", mode: "lines", name: "Ideal",
      line: { color: "#222", width: 3 },
      hovertemplate: "Vcommand=%{x:.1f} mV<br>Ihold=%{y:.1f} pA<extra>Ideal holding</extra>"
    },
    {
      x: data.command, y: data.measuredHoldingCurrent, type: "scatter", mode: "lines+markers", name: "vs V<sub>command</sub>",
      line: { color: "#965579", width: 2 }, marker: { color: "#965579", size: markerSize },
      hovertemplate: "Vcommand=%{x:.1f} mV<br>Ihold=%{y:.1f} pA<extra>Nominal holding</extra>"
    },
    {
      x: data.baselineVoltage, y: data.measuredHoldingCurrent, type: "scatter", mode: "lines+markers", name: "vs V<sub>baseline</sub>",
      line: { color: "#23877e", width: 2, dash: "dash" }, marker: { color: "#23877e", size: markerSize },
      hovertemplate: "Vbaseline=%{x:.1f} mV<br>Ihold=%{y:.1f} pA<extra>Corrected holding</extra>"
    }
  ];
  const synapticTraces = [
    {
      x: data.command, y: data.idealSynapticCurrent, type: "scatter", mode: "lines", name: "Ideal",
      line: { color: "#222", width: 3 },
      hovertemplate: "Vcommand=%{x:.1f} mV<br>Isyn=%{y:.1f} pA<extra>Ideal synaptic</extra>"
    },
    {
      x: data.command, y: data.measuredSynapticCurrent, type: "scatter", mode: "lines+markers", name: "vs V<sub>command</sub>",
      line: { color: "#965579", width: 2 }, marker: { color: "#965579", size: markerSize },
      hovertemplate: "Vcommand=%{x:.1f} mV<br>Baseline-subtracted Isyn=%{y:.1f} pA<extra>Nominal synaptic</extra>"
    },
    {
      x: data.responseVoltage, y: data.measuredSynapticCurrent, type: "scatter", mode: "lines+markers", name: "vs V<sub>response</sub>",
      line: { color: "#23877e", width: 2, dash: "dash" }, marker: { color: "#23877e", size: markerSize },
      hovertemplate: "Vresponse=%{x:.1f} mV<br>Baseline-subtracted Isyn=%{y:.1f} pA<extra>Corrected synaptic</extra>"
    }
  ];

  const panelLayout = (title, yTitle) => ({
    title: { text: `<b>${title}</b>`, x: 0.5, xanchor: "center", y: 0.98, font: { size: compact ? compactTitleFont : p.fontSize } },
    margin: { l: compact ? 50 : 66, r: compact ? 8 : 16, t: compact ? 38 : 48, b: compact ? 42 : 50 },
    autosize: true, paper_bgcolor: "#fff", plot_bgcolor: "#fff",
    font: { family: "Arial, Helvetica, sans-serif", size: p.fontSize, color: "#2f2930" },
    hovermode: "closest",
    legend: {
      orientation: "v", x: 0.98, xanchor: "right", y: 0.03, yanchor: "bottom",
      bgcolor: "rgba(255,255,255,.82)", bordercolor: "rgba(102,59,86,.28)", borderwidth: 1,
      font: { size: Math.max(8, p.fontSize - (compact ? 7 : 5)) }
    },
    xaxis: {
      title: { text: "Voltage (mV)", standoff: compact ? 1 : 4, font: { size: compact ? compactTitleFont : p.fontSize } },
      tickfont: { size: compact ? compactAxisFont : p.fontSize }, automargin: true, gridcolor: "#eee7eb", zeroline: true, zerolinecolor: "#756b71"
    },
    yaxis: {
      title: { text: yTitle, standoff: compact ? 1 : 5, font: { size: compact ? compactTitleFont : p.fontSize } },
      tickfont: { size: compact ? compactAxisFont : p.fontSize }, automargin: true, gridcolor: "#eee7eb", zeroline: true, zerolinecolor: "#756b71", nticks: compact ? 4 : 0
    }
  });

  return Promise.all([
    Plotly.react("ivHoldingPlot", holdingTraces, panelLayout("Holding current", "I<sub>hold</sub> (pA)"), plotConfig),
    Plotly.react("ivSynapticPlot", synapticTraces, panelLayout("Synaptic current", "I<sub>syn</sub> (pA)"), plotConfig)
  ]);
}

function indexOfLargestMagnitude(values) {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (Math.abs(values[candidate]) > Math.abs(values[index])) index = candidate;
  }
  return index;
}

function nearestIndex(values, target) {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (Math.abs(values[candidate] - target) < Math.abs(values[index] - target)) index = candidate;
  }
  return index;
}

function updateReadouts(p, step, synapse, iv) {
  const rs = effectiveRs(p);
  const tau = clampTimeConstant(p);
  const onsetIndex = Math.min(step.current.length - 1, Math.round(step.start / step.dt));
  const steadyError = p.stepVoltage - passiveSteadyVoltage(p.stepVoltage, p);
  const onsetCurrent = step.current[onsetIndex];
  byId("stepMetrics").innerHTML =
    metric("Effective R<sub>s</sub>", `${rs.toFixed(2)} MΩ`) +
    metric("Clamp τ", `${tau.toFixed(3)} ms`) +
    metric("Steady voltage error", `${steadyError.toFixed(2)} mV`) +
    metric("Initial current", `${(onsetCurrent / 1000).toFixed(2)} nA`);

  const idealPeakIndex = indexOfLargestMagnitude(synapse.idealCurrent);
  const recordedPeakIndex = indexOfLargestMagnitude(synapse.recordedCurrent);
  const idealPeak = synapse.idealCurrent[idealPeakIndex];
  const recordedPeak = synapse.recordedCurrent[recordedPeakIndex];
  const synapseError = idealPeak === 0 ? 0 : 100 * (Math.abs(recordedPeak) - Math.abs(idealPeak)) / Math.abs(idealPeak);
  const maxVmError = Math.max(...synapse.vm.map(value => Math.abs(value - p.synHold)));
  byId("synapseMetrics").innerHTML =
    metric("Ideal peak", `${idealPeak.toFixed(1)} pA`) +
    metric("Recorded peak", `${recordedPeak.toFixed(1)} pA`) +
    metric("Peak-current error", `${synapseError.toFixed(1)}%`) +
    metric("Maximum clamp error", `${maxVmError.toFixed(2)} mV`);

  const plusThirtyIndex = nearestIndex(iv.command, 30);
  const holdingThirty = iv.measuredHoldingCurrent[plusThirtyIndex];
  const baselineVmThirty = iv.baselineVoltage[plusThirtyIndex];
  const synapticThirty = iv.measuredSynapticCurrent[plusThirtyIndex];
  const responseVmThirty = iv.responseVoltage[plusThirtyIndex];
  const idealSynapticThirty = iv.idealSynapticCurrent[plusThirtyIndex];
  const synapticErrorThirty = idealSynapticThirty === 0 ? 0 :
    100 * (synapticThirty - idealSynapticThirty) / Math.abs(idealSynapticThirty);
  const responseVoltageErrorThirty = iv.command[plusThirtyIndex] - responseVmThirty;
  byId("ivMetrics").innerHTML =
    metric("I<sub>hold</sub> at +30", `${holdingThirty.toFixed(1)} pA`) +
    metric("Baseline V<sub>m</sub>", `${baselineVmThirty.toFixed(2)} mV`) +
    metric("Synaptic current", `${synapticThirty.toFixed(1)} pA`) +
    metric("Response V<sub>m</sub>", `${responseVmThirty.toFixed(2)} mV`);

  const summaries = {
    step: [["Effective R<sub>s</sub>", `${rs.toFixed(2)} MΩ`], ["Clamp τ", `${tau.toFixed(3)} ms`], ["Steady voltage error", `${steadyError.toFixed(2)} mV`], ["Initial current", `${(onsetCurrent / 1000).toFixed(2)} nA`]],
    synapse: [["Effective R<sub>s</sub>", `${rs.toFixed(2)} MΩ`], ["Ideal peak", `${idealPeak.toFixed(1)} pA`], ["Recorded peak", `${recordedPeak.toFixed(1)} pA`], ["Maximum clamp error", `${maxVmError.toFixed(2)} mV`]],
    iv: [["Effective R<sub>s</sub>", `${rs.toFixed(2)} MΩ`], ["I<sub>hold</sub> at +30", `${holdingThirty.toFixed(1)} pA`], ["Response V<sub>m</sub>", `${responseVmThirty.toFixed(2)} mV`], ["I<sub>syn</sub> error", `${synapticErrorThirty.toFixed(1)}%`]],
    all: [["Effective R<sub>s</sub>", `${rs.toFixed(2)} MΩ`], ["Clamp τ", `${tau.toFixed(3)} ms`], ["Synaptic peak error", `${synapseError.toFixed(1)}%`], ["I–V voltage error at +30", `${responseVoltageErrorThirty.toFixed(2)} mV`]]
  };
  summaries[currentView].forEach(([label, value], index) => {
    byId(`summaryLabel${index + 1}`).innerHTML = label;
    byId(`summaryValue${index + 1}`).textContent = value;
  });
}

function setView(view, shouldUpdate = true) {
  currentView = view;
  document.body.dataset.view = view;
  const compareAll = view === "all";
  byId("plotGrid").classList.toggle("single-visible", !compareAll);
  byId("stepCard").hidden = !(view === "step" || compareAll);
  byId("synapseCard").hidden = !(view === "synapse" || compareAll);
  byId("ivCard").hidden = !(view === "iv" || compareAll);
  byId("takeawayCard").hidden = !compareAll;
  byId("stepControls").hidden = !(view === "step" || compareAll);
  byId("synapseControls").hidden = !(view === "synapse" || compareAll);
  byId("ivControls").hidden = !(view === "iv" || compareAll);
  byId("viewSelect").value = view;
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
  byId("fontSizeValue").textContent = `${p.fontSize} px`;
  const step = simulateVoltageStep(p);
  const synapse = simulateSynapse(p);
  const iv = simulateIV(p);
  latest = { p, step, synapse, iv };
  const rendered = Promise.all([drawVoltageStep(p, step), drawSynapse(p, synapse), drawIV(p, iv)]);
  updateReadouts(p, step, synapse, iv);
  rendered.then(queuePlotResize);
}

function resizeVisiblePlots() {
  for (const id of ["stepPlot", "synapsePlot", "ivHoldingPlot", "ivSynapticPlot"]) {
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
  byId("fontSize").value = DEFAULTS.fontSize;
  for (const [numberId, rangeId, key] of CONTROL_PAIRS) {
    byId(numberId).value = DEFAULTS[key];
    byId(rangeId).value = DEFAULTS[key];
  }
  byId("ivModel").value = DEFAULTS.ivModel;
  setView("step", false);
  update();
}

function csvValue(value) {
  return Number.isFinite(value) ? Number(value).toFixed(6) : "";
}

function downloadData() {
  if (!latest) return;
  const { p, step, synapse, iv } = latest;
  const rows = [[
    "protocol", "x", "command_mV", "actual_vm_mV", "ideal_current_pA", "recorded_current_pA",
    "corrected_voltage_mV", "conductance_nS", "holding_current_pA", "synaptic_current_pA"
  ]];
  for (let index = 0; index < step.time.length; index += 1) {
    rows.push(["voltage_step", csvValue(step.time[index]), csvValue(step.command[index]), csvValue(step.vm[index]), csvValue(step.idealSteadyCurrent[index]), csvValue(step.current[index]), "", "", "", ""]);
  }
  for (let index = 0; index < synapse.time.length; index += 1) {
    rows.push(["synaptic_current", csvValue(synapse.time[index]), csvValue(synapse.command[index]), csvValue(synapse.vm[index]), csvValue(synapse.idealCurrent[index]), csvValue(synapse.recordedCurrent[index]), "", csvValue(synapse.conductance[index]), "", ""]);
  }
  for (let index = 0; index < iv.command.length; index += 1) {
    rows.push([
      "iv_relation", csvValue(iv.command[index]), csvValue(iv.command[index]), csvValue(iv.responseVoltage[index]),
      csvValue(iv.idealSynapticCurrent[index]), csvValue(iv.measuredSynapticCurrent[index]), csvValue(iv.responseVoltage[index]),
      csvValue(p.ivSynG * rectificationFactor(iv.responseVoltage[index], p.ivModel)),
      csvValue(iv.measuredHoldingCurrent[index]), csvValue(iv.measuredSynapticCurrent[index])
    ]);
  }
  saveBlob(new Blob([rows.map(row => row.join(",")).join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }), "voltage_clamp_series_resistance.csv");
}

for (const [numberId, rangeId, key] of CONTROL_PAIRS) bindPair(numberId, rangeId, key);
byId("fontSize").addEventListener("input", scheduleUpdate);
byId("ivModel").addEventListener("change", scheduleUpdate);
byId("resetButton").addEventListener("click", reset);
byId("downloadButton").addEventListener("click", downloadData);
byId("viewSelect").addEventListener("change", event => setView(event.target.value));
byId("previousViewButton").addEventListener("click", () => stepView(-1));
byId("nextViewButton").addEventListener("click", () => stepView(1));
window.addEventListener("resize", queuePlotResize);
if ("ResizeObserver" in window) {
  let previousWidth = 0;
  const observer = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - previousWidth) > 1) {
      previousWidth = width;
      queuePlotResize();
    }
  });
  observer.observe(byId("plotGrid"));
}

setView("step", false);
update();
