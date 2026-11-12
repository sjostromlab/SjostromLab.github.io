/*
 * Population Coding and Decoding — deterministic encoding, stochastic
 * Poisson trials, and population-vector / maximum-likelihood decoding.
 * Created 21 October 2026, entirely "vibe coded" by OpenAI Codex
 * (GPT-6-based coding assistant), under P. Jesper Sjöström's guidance.
 *
 * P. Jesper Sjöström directed the scientific and teaching design and reviewed
 * the implementation. The model is conceptually based on Georgopoulos,
 * Schwartz & Kettner (1986) and Seung & Sompolinsky (1993). Plotly is a
 * separately distributed third-party plotting library.
 */
"use strict";

const $ = (id) => document.getElementById(id);
const defaults = {
  stimulus: 70,
  neurons: 12,
  baseline: 5,
  amplitude: 40,
  width: 50,
  duration: 500,
  trialCount: 300,
  font: 18,
  responseMode: "stochastic",
};
const colours = { regular: "#aaa3c5", selected: "#6253a3", stimulus: "#d17720", vector: "#16817a" };
const baselinePeriod = 250;
let selectedNeuron = 0;
let selectedTrial = 0;
let state = null;
let pending = false;
let pendingRandomization = false;
let trialSeed = 311;

function radians(degrees) { return (degrees * Math.PI) / 180; }
function degrees(angle) { return ((angle * 180) / Math.PI + 360) % 360; }
function circularError(estimate, target) { return ((estimate - target + 540) % 360) - 180; }

// Mulberry32 provides repeatable teaching trials without an external library.
function randomGenerator(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(mean, random) {
  if (mean <= 0) return 0;
  const limit = Math.exp(-mean);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

// Convert half-width at half-maximum into the concentration of a von Mises curve.
function concentration(halfWidth) {
  return Math.log(2) / (1 - Math.cos(radians(halfWidth)));
}

function tuningRate(direction, preferred, parameters) {
  const kappa = concentration(parameters.width);
  return parameters.baseline + parameters.amplitude *
    Math.exp(kappa * (Math.cos(radians(direction - preferred)) - 1));
}

function readParameters() {
  return {
    stimulus: Number($("stimulus").value),
    neurons: Math.round(Number($("neurons").value)),
    baseline: Number($("baseline").value),
    amplitude: Number($("amplitude").value),
    width: Number($("width").value),
    duration: Number($("duration").value),
    trialCount: Math.round(Number($("trialCount").value)),
    font: Number($("font").value),
    responseMode: $("responseMode").value,
  };
}

function decodePopulationVector(preferred, weights) {
  const x = weights.reduce((sum, weight, i) => sum + weight * Math.cos(radians(preferred[i])), 0);
  const y = weights.reduce((sum, weight, i) => sum + weight * Math.sin(radians(preferred[i])), 0);
  return { angle: degrees(Math.atan2(y, x)), length: Math.hypot(x, y) };
}

function likelihoodDecoder(counts, likelihoods) {
  let bestDirection = 0;
  let bestLikelihood = -Infinity;
  for (let direction = 0; direction < likelihoods.length; direction += 1) {
    const expected = likelihoods[direction];
    let logLikelihood = 0;
    for (let i = 0; i < counts.length; i += 1) {
      const lambda = expected[i];
      logLikelihood += counts[i] * Math.log(lambda) - lambda;
    }
    if (logLikelihood > bestLikelihood) {
      bestLikelihood = logLikelihood;
      bestDirection = direction;
    }
  }
  return bestDirection;
}

function circularBias(errors) {
  const x = errors.reduce((sum, error) => sum + Math.cos(radians(error)), 0);
  const y = errors.reduce((sum, error) => sum + Math.sin(radians(error)), 0);
  const bias = degrees(Math.atan2(y, x));
  return bias > 180 ? bias - 360 : bias;
}

function meanAbsoluteError(errors) {
  return errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length;
}

function spikeTimesForNeuron(stimulusCount, neuron, parameters, seed, trialIndex) {
  const mixedSeed = (
    seed ^ Math.imul(trialIndex + 1, 0x9e3779b1) ^ Math.imul(neuron + 1, 0x85ebca6b)
  ) >>> 0;
  // Separate streams keep the three periods statistically independent. They
  // also prevent a changed stimulus spike count from shifting post-stimulus
  // spike times simply by consuming more values from one shared stream.
  const beforeRandom = randomGenerator((mixedSeed ^ 0x243f6a88) >>> 0);
  const stimulusRandom = randomGenerator((mixedSeed ^ 0x85a308d3) >>> 0);
  const afterRandom = randomGenerator((mixedSeed ^ 0x13198a2e) >>> 0);
  const spikes = [];
  const baselineMean = parameters.baseline * baselinePeriod / 1000;
  const beforeCount = poisson(baselineMean, beforeRandom);
  const afterCount = poisson(baselineMean, afterRandom);
  for (let i = 0; i < beforeCount; i += 1)
    spikes.push({ neuron, time: -baselinePeriod + beforeRandom() * baselinePeriod, phase: "baseline_before" });
  for (let i = 0; i < Math.round(stimulusCount); i += 1)
    spikes.push({ neuron, time: stimulusRandom() * parameters.duration, phase: "stimulus" });
  for (let i = 0; i < afterCount; i += 1)
    spikes.push({ neuron, time: parameters.duration + afterRandom() * baselinePeriod, phase: "baseline_after" });
  return spikes.sort((a, b) => a.time - b.time);
}

function spikeTimesForTrial(trial, parameters, trialIndex) {
  return trial.counts.flatMap((count, neuron) =>
    spikeTimesForNeuron(count, neuron, parameters, trialSeed, trialIndex),
  );
}

function psthForNeuron(state, neuron) {
  const start = -baselinePeriod;
  const end = state.parameters.duration + baselinePeriod;
  const binWidth = 25;
  const binCount = Math.ceil((end - start) / binWidth);
  const counts = Array(binCount).fill(0);
  state.trials.forEach((trial, trialIndex) => {
    const spikes = spikeTimesForNeuron(
      trial.counts[neuron], neuron, state.parameters, trialSeed, trialIndex,
    );
    for (const spike of spikes) {
      const bin = Math.min(binCount - 1, Math.floor((spike.time - start) / binWidth));
      if (bin >= 0) counts[bin] += 1;
    }
  });
  return {
    x: counts.map((_, i) => start + (i + 0.5) * binWidth),
    rate: counts.map((count) => count / state.trials.length / (binWidth / 1000)),
    binWidth,
  };
}

function calculate(parameters) {
  const preferred = Array.from({ length: parameters.neurons }, (_, i) => (360 * i) / parameters.neurons);
  const rates = preferred.map((angle) => tuningRate(parameters.stimulus, angle, parameters));
  const durationSeconds = parameters.duration / 1000;
  const directions = Array.from({ length: 361 }, (_, i) => i);
  const curves = preferred.map((angle) => directions.map((direction) => tuningRate(direction, angle, parameters)));
  const likelihoods = Array.from({ length: 360 }, (_, direction) =>
    preferred.map((angle) => tuningRate(direction, angle, parameters) * durationSeconds),
  );
  const stochastic = parameters.responseMode !== "deterministic";
  const many = parameters.responseMode === "many";
  const random = randomGenerator(trialSeed);
  const repeats = many ? parameters.trialCount : 1;
  const trials = [];

  for (let trial = 0; trial < repeats; trial += 1) {
    const counts = stochastic
      ? rates.map((rate) => poisson(rate * durationSeconds, random))
      : rates.map((rate) => rate * durationSeconds);
    const vector = decodePopulationVector(preferred, stochastic ? counts : rates);
    const mlDecoded = likelihoodDecoder(counts, likelihoods);
    trials.push({
      counts,
      observedRates: counts.map((count) => count / durationSeconds),
      decoded: vector.angle,
      vectorLength: vector.length,
      mlDecoded,
      pvError: circularError(vector.angle, parameters.stimulus),
      mlError: circularError(mlDecoded, parameters.stimulus),
    });
  }
  const example = trials[0];
  const pvErrors = trials.map((trial) => trial.pvError);
  const mlErrors = trials.map((trial) => trial.mlError);
  return {
    parameters, preferred, rates, directions, curves, likelihoods, stochastic, many, trials,
    counts: example.counts,
    observedRates: example.observedRates,
    weights: stochastic ? example.counts : rates,
    decoded: example.decoded,
    mlDecoded: example.mlDecoded,
    vectorLength: example.vectorLength,
    pvErrors,
    mlErrors,
    pvMae: meanAbsoluteError(pvErrors),
    mlMae: meanAbsoluteError(mlErrors),
    pvBias: circularBias(pvErrors),
    mlBias: circularBias(mlErrors),
  };
}

function axisTitle(text, standoff = 4) {
  return { text, standoff };
}

function graphLayout(title, parameters, extra = {}) {
  return {
    title: { text: `<b>${title}</b>`, font: { size: parameters.font + 4 } },
    font: { family: "Arial, sans-serif", size: parameters.font, color: "#303648" },
    margin: { l: 65, r: 20, t: 60, b: 56 },
    paper_bgcolor: "white",
    plot_bgcolor: "white",
    hovermode: "closest",
    ...extra,
  };
}

function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Blob-based PNG export works around Safari's problems with Plotly data URLs.
async function downloadPng(plot) {
  try {
    const url = await Plotly.toImage(plot, {
      format: "png",
      width: plot._fullLayout.width,
      height: plot._fullLayout.height,
      scale: 2,
    });
    const bytes = Uint8Array.from(atob(url.split(",")[1]), (character) => character.charCodeAt(0));
    save(new Blob([bytes], { type: "image/png" }), `PopulationCoding_${plot.id}.png`);
  } catch (error) {
    $("status").textContent = "PNG export failed. Please try again.";
  }
}

const plotConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["toImage", "lasso2d", "select2d"],
  modeBarButtonsToAdd: [{ name: "Download plot as PNG", icon: Plotly.Icons.camera, click: downloadPng }],
};

function render() {
  const p = state.parameters;
  selectedTrial = Math.min(selectedTrial, state.trials.length - 1);
  const example = state.trials[selectedTrial];
  const exampleCounts = example.counts;
  const exampleRates = example.observedRates;
  const exampleWeights = state.stochastic ? exampleCounts : state.rates;
  const exampleSpikes = state.stochastic ? spikeTimesForTrial(example, p, selectedTrial) : [];
  selectedNeuron = Math.min(selectedNeuron, p.neurons - 1);
  $("neuronLabel").textContent = `Neuron ${selectedNeuron + 1} of ${p.neurons}`;
  $("fontValue").textContent = `${p.font} px`;
  $("presented").textContent = `${p.stimulus.toFixed(1)}°`;
  $("decoded").textContent = `${example.decoded.toFixed(1)}°`;
  const error = example.pvError;
  $("error").textContent = `${(Math.abs(error) < 0.05 ? 0 : error).toFixed(1)}°`;
  $("mlDecoded").textContent = `${example.mlDecoded.toFixed(1)}°`;
  const mlError = example.mlError;
  $("mlError").textContent = `${(Math.abs(mlError) < 0.05 ? 0 : mlError).toFixed(1)}°`;
  $("spikeRow").hidden = !state.stochastic;
  $("totalSpikes").textContent = Math.round(exampleCounts.reduce((sum, count) => sum + count, 0));
  $("trialControls").hidden = !state.stochastic;
  $("newTrial").disabled = !state.stochastic;
  $("manyControls").hidden = !state.many;
  $("timingControls").classList.toggle("many-active", state.many);
  $("newTrial").textContent = "Rerun";
  $("estimateHeading").textContent = state.many ? "Example-trial estimates" : "Decoder estimates";
  $("accuracySummary").hidden = !state.many;
  $("accuracyPlot").hidden = !state.many;
  $("accuracyPlot").parentElement.classList.toggle("with-accuracy", state.many);
  $("rasterPanel").hidden = !state.stochastic;
  $("rasterPanel").classList.toggle("with-psth", state.many);
  $("trialPlotNav").hidden = !state.many;
  $("trialLabel").textContent = `Trial ${selectedTrial + 1} of ${state.trials.length}`;
  $("previousTrial").disabled = selectedTrial === 0;
  $("nextTrial").disabled = selectedTrial === state.trials.length - 1;
  if (state.many) {
    $("pvMae").textContent = `${state.pvMae.toFixed(1)}°`;
    $("mlMae").textContent = `${state.mlMae.toFixed(1)}°`;
    $("pvBias").textContent = `${state.pvBias.toFixed(1)}°`;
    $("mlBias").textContent = `${state.mlBias.toFixed(1)}°`;
  }

  const tuningTraces = state.curves.map((curve, i) => ({
    x: state.directions,
    y: curve,
    mode: "lines",
    name: `Neuron ${i + 1}: ${state.preferred[i].toFixed(0)}°`,
    line: { color: i === selectedNeuron ? colours.selected : colours.regular, width: i === selectedNeuron ? 4 : 1.4 },
    opacity: i === selectedNeuron ? 1 : 0.65,
    hovertemplate: `Neuron ${i + 1}<br>Preferred: ${state.preferred[i].toFixed(1)}°<br>Direction: %{x:.0f}°<br>Rate: %{y:.2f} Hz<extra></extra>`,
  }));
  const tuningLayout = graphLayout("Directional tuning curves", p, {
    showlegend: false,
    xaxis: { title: axisTitle("Stimulus direction (°)"), range: [0, 360], dtick: 60, gridcolor: "#e3e2e9" },
    yaxis: { title: axisTitle("Expected firing rate (Hz)"), rangemode: "tozero", gridcolor: "#e3e2e9" },
    shapes: [{ type: "line", x0: p.stimulus, x1: p.stimulus, y0: 0, y1: 1, yref: "paper", line: { color: colours.stimulus, width: 3, dash: "dash" } }],
    annotations: [{ x: p.stimulus, y: 1, yref: "paper", text: "Stimulus", showarrow: false, yanchor: "bottom", font: { color: colours.stimulus } }],
  });
  tuningLayout.title.x = 0.025;
  tuningLayout.title.xanchor = "left";
  Plotly.react("tuningPlot", tuningTraces, tuningLayout, plotConfig);

  if (state.stochastic) {
    const ordinarySpikes = exampleSpikes.filter((spike) => spike.neuron !== selectedNeuron);
    const highlightedSpikes = exampleSpikes.filter((spike) => spike.neuron === selectedNeuron);
    const makeRasterTrace = (spikes, name, colour, size, lineWidth) => ({
      x: spikes.map((spike) => spike.time),
      y: spikes.map((spike) => spike.neuron + 1),
      type: "scattergl",
      mode: "markers",
      name,
      marker: {
        color: colour,
        size,
        symbol: "line-ns-open",
        line: { color: colour, width: lineWidth },
      },
      customdata: spikes.map((spike) => [spike.neuron + 1, state.preferred[spike.neuron], spike.phase]),
      hovertemplate: "Neuron %{customdata[0]}<br>Preferred: %{customdata[1]:.1f}°<br>Period: %{customdata[2]}<br>Spike time: %{x:.1f} ms<extra></extra>",
      yaxis: "y",
    });
    const rasterTraces = [
      makeRasterTrace(ordinarySpikes, "Other neurons", colours.selected, 6, 1),
      makeRasterTrace(highlightedSpikes, `Neuron ${selectedNeuron + 1}`, "#111111", 9, 2),
    ];
    const rasterLayout = {
      xaxis: { title: axisTitle("Time relative to stimulus onset (ms)"), range: [-baselinePeriod, p.duration + baselinePeriod], gridcolor: "#e3e2e9" },
      yaxis: {
        title: axisTitle("Neuron", 10),
        range: [0.4, p.neurons + 0.6],
        dtick: Math.max(1, Math.ceil(p.neurons / 12)),
        tickfont: { size: Math.max(9, p.font - 6) },
        gridcolor: "#e3e2e9",
      },
      showlegend: false,
      shapes: [
        { type: "rect", x0: 0, x1: p.duration, y0: 0, y1: 1, yref: "paper", fillcolor: "rgba(209,119,32,.045)", line: { width: 0 }, layer: "below" },
        { type: "line", x0: 0, x1: 0, y0: 0, y1: 1, yref: "paper", line: { color: colours.stimulus, dash: "dash" } },
        { type: "line", x0: p.duration, x1: p.duration, y0: 0, y1: 1, yref: "paper", line: { color: colours.stimulus, dash: "dash" } },
      ],
      annotations: [{ x: p.duration / 2, y: 1, yref: "paper", text: "Stimulus", showarrow: false, yanchor: "bottom", font: { color: colours.stimulus } }],
    };
    if (state.many) {
      const psth = state.psths[selectedNeuron];
      rasterTraces.push(
        {
          x: psth.x, y: psth.rate, type: "bar", xaxis: "x2", yaxis: "y2", name: "Across-trial PSTH",
          marker: { color: "rgba(98,83,163,.55)" }, width: psth.binWidth * 0.9,
          hovertemplate: "Time: %{x:.1f} ms<br>Rate: %{y:.2f} Hz<extra></extra>",
        },
        {
          x: [-baselinePeriod, 0, 0, p.duration, p.duration, p.duration + baselinePeriod],
          y: [p.baseline, p.baseline, state.rates[selectedNeuron], state.rates[selectedNeuron], p.baseline, p.baseline],
          type: "scatter", mode: "lines", xaxis: "x2", yaxis: "y2", name: "Expected rate",
          line: { color: "rgba(209,119,32,.45)", width: 1, dash: "dot", shape: "hv" },
          hovertemplate: "Expected rate: %{y:.2f} Hz<extra></extra>",
        },
      );
      rasterLayout.yaxis.domain = [0.38, 1];
      rasterLayout.xaxis.title = "";
      rasterLayout.xaxis.showticklabels = false;
      rasterLayout.xaxis2 = {
        title: axisTitle("Time (ms)"),
        range: [-baselinePeriod, p.duration + baselinePeriod],
        matches: "x",
        anchor: "y2",
        gridcolor: "#e3e2e9",
      };
      rasterLayout.yaxis2 = {
        title: axisTitle("PSTH (Hz)", 10),
        domain: [0, 0.23],
        range: [0, state.psthAxisMax],
        tickfont: { size: Math.max(10, p.font - 4) },
        gridcolor: "#e3e2e9",
      };
      rasterLayout.annotations.push({
        x: 0,
        y: 0.245,
        xref: "paper",
        yref: "paper",
        text: `<b>Neuron ${selectedNeuron + 1}</b>`,
        showarrow: false,
        xanchor: "left",
        yanchor: "bottom",
      });
      rasterLayout.margin = { l: 66, r: 20, t: 60, b: 56 };
    }
    const rasterGraphLayout = graphLayout(
      "Spiking activity",
      p,
      rasterLayout,
    );
    if (state.many) {
      rasterGraphLayout.title.x = 0.025;
      rasterGraphLayout.title.xanchor = "left";
    }
    Plotly.react("rasterPlot", rasterTraces, rasterGraphLayout, plotConfig);
  }

  const responseTraces = [{
      x: state.preferred,
      y: state.stochastic ? exampleRates : state.rates,
      type: "bar",
      name: state.stochastic ? "Observed rate" : "Expected rate",
      marker: {
        color: state.preferred.map((_, i) => i === selectedNeuron ? colours.selected : colours.regular),
        line: { color: "#6253a3", width: state.preferred.map((_, i) => i === selectedNeuron ? 3 : 0) },
      },
      customdata: state.preferred.map((angle, i) => [i + 1, angle, exampleCounts[i]]),
      hovertemplate: state.stochastic
        ? "Neuron %{customdata[0]}<br>Preferred: %{customdata[1]:.1f}°<br>Observed: %{customdata[2]} spikes<br>Observed rate: %{y:.2f} Hz<extra></extra>"
        : "Neuron %{customdata[0]}<br>Preferred: %{customdata[1]:.1f}°<br>Expected rate: %{y:.2f} Hz<extra></extra>",
    }];
  if (state.stochastic) responseTraces.push({
    x: state.preferred,
    y: state.rates,
    type: "scatter",
    mode: "lines+markers",
    name: "Expected rate",
    line: { color: colours.stimulus, width: 2 },
    marker: { color: colours.stimulus, size: 7 },
    hovertemplate: "Expected rate: %{y:.2f} Hz<extra></extra>",
  });
  Plotly.react("responsePlot", responseTraces, graphLayout(
    state.stochastic ? "Example population response" : "Expected population response",
    p,
    {
    xaxis: { title: axisTitle("Preferred direction (°)"), range: [-10, 370], dtick: 60, gridcolor: "#e3e2e9" },
    yaxis: { title: axisTitle(state.stochastic ? "Observed rate (Hz)" : "Expected rate (Hz)"), rangemode: "tozero", gridcolor: "#e3e2e9" },
    showlegend: state.stochastic,
    legend: { orientation: "v", x: 0.98, xanchor: "right", y: 0.98, yanchor: "top", bgcolor: "rgba(255,255,255,0.82)" },
  }), plotConfig);

  const maxWeight = Math.max(...exampleWeights, 1);
  Plotly.react("vectorPlot", [
    {
      type: "scatterpolar", mode: "markers", theta: state.preferred, r: exampleWeights,
      marker: { size: 11, color: state.preferred.map((_, i) => i === selectedNeuron ? colours.selected : colours.regular) },
      customdata: state.preferred.map((angle, i) => [i + 1, angle, state.rates[i]]),
      hovertemplate: "Neuron %{customdata[0]}<br>Preferred: %{customdata[1]:.1f}°<br>Rate: %{customdata[2]:.2f} Hz<br>Weight: %{r:.2f} Hz<extra></extra>",
      name: "Neurons",
    },
    {
      type: "scatterpolar", mode: "lines+markers", theta: [example.decoded, example.decoded], r: [0, maxWeight],
      line: { color: colours.vector, width: 5 }, marker: { color: colours.vector, size: [0, 13] },
      hovertemplate: `Population vector: ${example.decoded.toFixed(1)}°<extra></extra>`, name: "Population vector",
    },
    {
      type: "scatterpolar", mode: "lines+markers", theta: [example.mlDecoded, example.mlDecoded], r: [0, maxWeight * 0.9],
      line: { color: "#b34d87", width: 4, dash: "dot" }, marker: { color: "#b34d87", size: [0, 12] },
      hovertemplate: `Maximum likelihood: ${example.mlDecoded.toFixed(1)}°<extra></extra>`, name: "Maximum likelihood",
    },
    {
      type: "scatterpolar", mode: "lines", theta: [p.stimulus, p.stimulus], r: [0, maxWeight],
      line: { color: colours.stimulus, width: 3, dash: "dash" },
      hovertemplate: `Stimulus: ${p.stimulus.toFixed(1)}°<extra></extra>`, name: "Stimulus",
    },
  ], graphLayout(state.many ? "Decoder estimates — example trial" : "Decoder estimates", p, {
    margin: { l: 40, r: 40, t: 65, b: 35 },
    polar: {
      radialaxis: {
        title: state.stochastic ? "Observed spikes" : "Expected rate (Hz)",
        range: [0, maxWeight * 1.08], gridcolor: "#dedce8",
      },
      angularaxis: { direction: "counterclockwise", rotation: 0, dtick: 45, gridcolor: "#dedce8" },
    },
    legend: {
      orientation: "h", x: 0.5, xanchor: "center", y: -0.11,
      bgcolor: "rgba(255,255,255,0.72)",
    },
  }), plotConfig);

  if (state.many) {
    Plotly.react("accuracyPlot", [
      {
        x: state.pvErrors, type: "histogram", name: "Population vector", opacity: 0.62,
        marker: { color: colours.vector }, xbins: { start: -180, end: 180, size: 10 }, histnorm: "probability",
        hovertemplate: "PV error: %{x}°<br>Fraction: %{y:.3f}<extra></extra>",
      },
      {
        x: state.mlErrors, type: "histogram", name: "Maximum likelihood", opacity: 0.62,
        marker: { color: "#b34d87" }, xbins: { start: -180, end: 180, size: 10 }, histnorm: "probability",
        hovertemplate: "ML error: %{x}°<br>Fraction: %{y:.3f}<extra></extra>",
      },
    ], graphLayout(`Decoding errors — ${p.trialCount} trials`, p, {
      barmode: "overlay",
      xaxis: { title: axisTitle("Signed circular error (°)"), range: [-180, 180], dtick: 45, gridcolor: "#e3e2e9" },
      yaxis: { title: axisTitle("Fraction of trials"), rangemode: "tozero", gridcolor: "#e3e2e9" },
      legend: { orientation: "v", x: 0.98, xanchor: "right", y: 0.98, yanchor: "top", bgcolor: "rgba(255,255,255,0.82)" },
    }), plotConfig);
  }

  attachPlotClicks();
  // Plotly can retain the former full-width size when the accuracy panel first
  // appears. Resize after the CSS grid has completed its two-column layout.
  requestAnimationFrame(() => {
    for (const id of [
      "tuningPlot",
      "responsePlot",
      "vectorPlot",
      ...(state.stochastic ? ["rasterPlot"] : []),
      ...(state.many ? ["accuracyPlot"] : []),
    ]) {
      Plotly.Plots.resize($(id));
    }
  });
}

function attachPlotClicks() {
  $("tuningPlot").removeAllListeners("plotly_click");
  $("responsePlot").removeAllListeners("plotly_click");
  $("rasterPlot").removeAllListeners("plotly_click");
  $("tuningPlot").on("plotly_click", (event) => { selectedNeuron = event.points[0].curveNumber; render(); });
  $("responsePlot").on("plotly_click", (event) => {
    selectedNeuron = event.points[0].pointNumber;
    render();
  });
  if (state.stochastic) $("rasterPlot").on("plotly_click", (event) => {
    const point = event.points[0];
    // PSTH and expected-rate traces are informative rather than selectable.
    if (!point.customdata) return;
    selectedNeuron = point.customdata[0] - 1;
    render();
  });
}

function update() {
  $("status").textContent = "";
  const p = readParameters();
  if (![p.stimulus, p.neurons, p.baseline, p.amplitude, p.width, p.duration, p.trialCount, p.font].every(Number.isFinite)) return;
  state = calculate(p);
  if (state.many) {
    state.psths = state.preferred.map((_, neuron) => psthForNeuron(state, neuron));
    const observedMaximum = Math.max(
      0,
      ...state.psths.flatMap((psth) => psth.rate),
    );
    const expectedMaximum = Math.max(p.baseline, ...state.rates);
    state.psthAxisMax = Math.max(1, observedMaximum, expectedMaximum) * 1.08;
  }
  render();
}

function schedule(randomizeTrial = false) {
  if (randomizeTrial) pendingRandomization = true;
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    if (pendingRandomization) {
      trialSeed = (trialSeed + 0x9e3779b9) >>> 0;
      selectedTrial = 0;
      pendingRandomization = false;
    }
    update();
  });
}

function connectControl(id) {
  const number = $(id);
  const range = $(id + "Range");
  number.addEventListener("input", () => {
    if (number.validity.valid && number.value !== "") range.value = number.value;
    schedule(true);
  });
  range.addEventListener("input", () => { number.value = range.value; schedule(true); });
}

function reset() {
  for (const [id, value] of Object.entries(defaults)) {
    if ($(id).type === "checkbox") $(id).checked = value;
    else $(id).value = value;
    if ($(id + "Range")) $(id + "Range").value = value;
  }
  selectedNeuron = 0;
  selectedTrial = 0;
  trialSeed = 311;
  update();
}

function newTrial() {
  trialSeed = (trialSeed + 0x9e3779b9) >>> 0;
  selectedTrial = 0;
  update();
}

function changeSelectedTrial(change) {
  selectedTrial = Math.max(0, Math.min(state.trials.length - 1, selectedTrial + change));
  render();
}

function changeSelectedNeuron(change) {
  const count = state.parameters.neurons;
  selectedNeuron = (selectedNeuron + change + count) % count;
  render();
}

function downloadData() {
  if (!state) return;
  const p = state.parameters;
  const lines = [
    "Population Coding and Decoding - deterministic encoding",
    `stimulus_direction_deg,${p.stimulus}`,
    `selected_example_trial,${selectedTrial + 1}`,
    `population_vector_direction_deg,${state.trials[selectedTrial].decoded.toFixed(6)}`,
    `population_vector_error_deg,${state.trials[selectedTrial].pvError.toFixed(6)}`,
    `maximum_likelihood_direction_deg,${state.trials[selectedTrial].mlDecoded.toFixed(6)}`,
    `maximum_likelihood_error_deg,${state.trials[selectedTrial].mlError.toFixed(6)}`,
    `number_of_neurons,${p.neurons}`,
    `baseline_rate_Hz,${p.baseline}`,
    `tuning_amplitude_Hz,${p.amplitude}`,
    `tuning_half_width_deg,${p.width}`,
    `response_mode,${p.responseMode}`,
    `observation_time_ms,${p.duration}`,
    `number_of_trials,${state.many ? p.trialCount : 1}`,
    "",
    "neuron,preferred_direction_deg,expected_rate_Hz,observed_spike_count,observed_rate_Hz,decoder_weight",
    ...state.preferred.map((angle, i) => {
      const trial = state.trials[selectedTrial];
      const count = state.stochastic ? trial.counts[i] : "";
      const observedRate = state.stochastic ? trial.observedRates[i].toFixed(6) : "";
      const weight = state.stochastic ? trial.counts[i] : state.rates[i];
      return `${i + 1},${angle.toFixed(6)},${state.rates[i].toFixed(6)},${count},${observedRate},${weight.toFixed(6)}`;
    }),
    "",
    ["direction_deg", ...state.preferred.map((_, i) => `neuron_${i + 1}_rate_Hz`)].join(","),
    ...state.directions.map((direction, j) => [direction, ...state.curves.map((curve) => curve[j].toFixed(6))].join(",")),
  ];
  if (state.many) {
    lines.push(
      "",
      "trial,population_vector_deg,pv_error_deg,maximum_likelihood_deg,ml_error_deg,total_spikes",
      ...state.trials.map((trial, i) =>
        `${i + 1},${trial.decoded.toFixed(6)},${trial.pvError.toFixed(6)},${trial.mlDecoded.toFixed(6)},${trial.mlError.toFixed(6)},${Math.round(trial.counts.reduce((sum, count) => sum + count, 0))}`
      ),
    );
  }
  if (state.stochastic) {
    const selectedSpikes = spikeTimesForTrial(state.trials[selectedTrial], p, selectedTrial);
    lines.push(
      "",
      "example_trial_neuron,preferred_direction_deg,spike_time_ms,period",
      ...selectedSpikes.map((spike) =>
        `${spike.neuron + 1},${state.preferred[spike.neuron].toFixed(6)},${spike.time.toFixed(6)},${spike.phase}`
      ),
    );
  }
  save(
    new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }),
    "PopulationCoding_data.csv",
  );
}

for (const id of ["stimulus", "neurons", "baseline", "amplitude", "width", "duration", "trialCount"]) connectControl(id);
$("font").addEventListener("input", schedule);
$("responseMode").addEventListener("change", update);
$("reset").addEventListener("click", reset);
$("newTrial").addEventListener("click", newTrial);
$("previousTrial").addEventListener("click", () => changeSelectedTrial(-1));
$("nextTrial").addEventListener("click", () => changeSelectedTrial(1));
$("previousNeuron").addEventListener("click", () => changeSelectedNeuron(-1));
$("nextNeuron").addEventListener("click", () => changeSelectedNeuron(1));
$("download").addEventListener("click", downloadData);
reset();
