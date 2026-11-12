/*
 * CV Analysis Simulation — Version 0.9
 * 16 October 2026; binomial mode added 19 October 2026
 *
 * This JavaScript implementation was entirely "vibe coded" by OpenAI Codex
 * (GPT-6-based coding assistant), under the guidance of P. Jesper Sjöström
 * for teaching PHGY 311. It is based on his Igor Pro exam-generation code,
 * with additional reference to the CV-analysis work and Igor code below.
 *
 * Brock JA, Thomazeau A, Watanabe A, Li SSY, and Sjöström PJ (2020).
 * A Practical Guide to Using CV Analysis for Determining the Locus of
 * Synaptic Plasticity. Frontiers in Synaptic Neuroscience 12:11.
 * https://doi.org/10.3389/fnsyn.2020.00011
 * Igor simulation repository linked in the paper:
 * https://github.com/pj-sjostrom/Sim_CV_analysis
 *
 * The original teaching mode generates Gaussian response samples from
 * specified means and SDevs. The later binomial mode uses the standard n, p,
 * and q relationships also taught in the Quantal Release simulation, but is
 * independently implemented here for paired before-and-after CV analysis.
 *
 * Contribution clarification, 17 October 2026: P. Jesper Sjöström directed
 * the scientific and teaching design, supplied requirements, and reviewed
 * iterative revisions. OpenAI Codex generated the implementation and assisted
 * with debugging and checks. This is separate from the student implementations.
 */

"use strict";

const $ = (id) => document.getElementById(id);
const groups = ["A", "B"];
const periods = ["baseline", "post"];
const colors = { A: "#a86812", B: "#2869b0" };

const gaussianDefaults = {
  A: { baseline: { mean: 2, sd: 0.2 }, post: { mean: 4, sd: 0.2 } },
  B: { baseline: { mean: 2, sd: 0.2 }, post: { mean: 4, sd: 0.4 } },
};

// A changes p; B changes q. Both produce about twofold potentiation.
const binomialDefaults = {
  A: { baseline: { n: 30, p: 0.33, q: 0.2 }, post: { n: 30, p: 0.67, q: 0.2 } },
  B: { baseline: { n: 30, p: 0.33, q: 0.2 }, post: { n: 30, p: 0.33, q: 0.4 } },
};

const parameterSpecs = {
  gaussian: [
    { key: "mean", label: "Response (mV)", min: 0.1, numberMax: 20, rangeMax: 10, step: 0.1 },
    { key: "sd", label: "SDev (mV)", min: 0.01, numberMax: 20, rangeMax: 3, step: 0.01 },
  ],
  binomial: [
    { key: "n", label: "n sites", min: 1, numberMax: 100, rangeMax: 100, step: 1 },
    { key: "p", label: "p release", min: 0, numberMax: 1, rangeMax: 1, step: 0.01 },
    { key: "q", label: "q (mV)", min: 0.01, numberMax: 20, rangeMax: 2, step: 0.01 },
  ],
};

let experiments = [];
let pending = false;

function controlId(group, mode, period, key) {
  return `${group}_${mode}_${period}_${key}`;
}

function defaultsFor(group, mode, period) {
  return mode === "gaussian" ? gaussianDefaults[group][period] : binomialDefaults[group][period];
}

// Build both sets of controls once. Switching modes only changes which set is visible.
function buildControls() {
  for (const group of groups) {
    const container = $("controls" + group);
    for (const mode of ["gaussian", "binomial"]) {
      const modeControls = document.createElement("div");
      modeControls.className = "mode-controls";
      modeControls.dataset.mode = mode;

      const grid = document.createElement("div");
      grid.className = "period-grid";
      for (const period of periods) {
        const card = document.createElement("div");
        card.className = "period-card";
        card.innerHTML = `<h2>${period === "baseline" ? "Baseline" : "Post-induction"}</h2>`;

        for (const spec of parameterSpecs[mode]) {
          const id = controlId(group, mode, period, spec.key);
          const value = defaultsFor(group, mode, period)[spec.key];
          const row = document.createElement("div");
          row.className = "parameter-control";
          row.title =
            "One response every 10 seconds, with a 5-minute induction gap between baseline and post-induction responses.";
          row.innerHTML =
            `<label for="${id}">${spec.label}</label>` +
            `<input id="${id}" type="number" min="${spec.min}" max="${spec.numberMax}" step="${spec.step}" value="${value}">` +
            `<input id="${id}Range" type="range" aria-label="${group}: ${period} ${spec.label}" min="${spec.min}" max="${spec.rangeMax}" step="${spec.step}" value="${value}">`;
          card.appendChild(row);
          bindNumberAndRange(id, spec.rangeMax);
        }
        grid.appendChild(card);
      }
      modeControls.appendChild(grid);
      container.appendChild(modeControls);
    }
  }
}

function bindNumberAndRange(id, originalRangeMax) {
  const bind = () => {
    const number = $(id);
    const range = $(id + "Range");
    range.addEventListener("input", () => {
      number.value = range.value;
      schedule();
    });
    number.addEventListener("input", () => {
      if (number.validity.valid && number.value !== "") {
        range.max = Math.max(originalRangeMax, Number(number.value));
        range.value = number.value;
        schedule();
      }
    });
  };
  // The row is inserted immediately after this function returns.
  requestAnimationFrame(bind);
}

function bindExistingNumberAndRange(id, originalRangeMax) {
  const number = $(id);
  const range = $(id + "Range");
  range.addEventListener("input", () => {
    number.value = range.value;
    schedule();
  });
  number.addEventListener("input", () => {
    if (number.validity.valid && number.value !== "") {
      range.max = Math.max(originalRangeMax, Number(number.value));
      range.value = number.value;
    }
    schedule();
  });
}

// Seeded randomness allows parameter changes to reuse the same random experiment.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random) {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

function binomial(random, n, p) {
  let successes = 0;
  for (let i = 0; i < n; i++) if (random() < p) successes++;
  return successes;
}

// Sample variance uses n - 1; every response in each period enters the analysis.
function rawStats(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return { mean, variance, sd: Math.sqrt(variance), n: values.length };
}

function analyzedStats(raw, noiseSD, correctNoise) {
  const variance = correctNoise ? raw.variance - noiseSD ** 2 : raw.variance;
  const sd = variance >= 0 ? Math.sqrt(variance) : NaN;
  return { ...raw, analysisVariance: variance, analysisSD: sd, cv: sd / raw.mean };
}

function readParameters(group, mode, period) {
  const parameters = {};
  for (const spec of parameterSpecs[mode]) {
    parameters[spec.key] = Number($(controlId(group, mode, period, spec.key)).value);
  }
  return parameters;
}

function expectedStats(parameters, mode, noiseSD, correctNoise) {
  if (mode === "gaussian") {
    return {
      mean: parameters.mean,
      releaseSD: parameters.sd,
      measuredSD: parameters.sd,
      analysisSD: parameters.sd,
      cv: parameters.sd / parameters.mean,
    };
  }
  const mean = parameters.n * parameters.p * parameters.q;
  const releaseVariance = parameters.n * parameters.p * (1 - parameters.p) * parameters.q ** 2;
  const measuredVariance = releaseVariance + noiseSD ** 2;
  const analysisVariance = correctNoise ? releaseVariance : measuredVariance;
  const analysisSD = Math.sqrt(analysisVariance);
  return {
    mean,
    releaseSD: Math.sqrt(releaseVariance),
    measuredSD: Math.sqrt(measuredVariance),
    analysisSD,
    cv: analysisSD / mean,
  };
}

// Responses are 10 seconds apart, with 30 missing samples during induction.
function makeExperiment(group, seed) {
  const mode = $("inputMode").value;
  const baselineParameters = readParameters(group, mode, "baseline");
  const postParameters = readParameters(group, mode, "post");
  const noiseSD = mode === "binomial" ? Number($("noise").value) : 0;
  const correctNoise = mode === "binomial" && $("correctNoise").checked;
  const random = rng((seed + (group === "B" ? 104729 : 0)) >>> 0);
  const baselineCount = Number($("baselineCount").value);
  const postCount = Number($("postCount").value);
  const time = [];
  const response = [];

  const drawResponse = (parameters) => {
    if (mode === "gaussian") return parameters.mean + parameters.sd * normal(random);
    return binomial(random, parameters.n, parameters.p) * parameters.q + noiseSD * normal(random);
  };

  for (let i = 0; i < baselineCount + 30 + postCount; i++) {
    time.push(i / 6);
    response.push(
      i < baselineCount
        ? drawResponse(baselineParameters)
        : i < baselineCount + 30
          ? null
          : drawResponse(postParameters),
    );
  }

  const rawBefore = rawStats(response.slice(0, baselineCount));
  const rawAfter = rawStats(response.slice(baselineCount + 30));
  const before = analyzedStats(rawBefore, noiseSD, correctNoise);
  const after = analyzedStats(rawAfter, noiseSD, correctNoise);
  const expectedBefore = expectedStats(baselineParameters, mode, noiseSD, correctNoise);
  const expectedAfter = expectedStats(postParameters, mode, noiseSD, correctNoise);

  return {
    group,
    mode,
    baselineCount,
    postCount,
    baselineParameters,
    postParameters,
    noiseSD,
    correctNoise,
    time,
    response,
    before,
    after,
    expectedBefore,
    expectedAfter,
    x: after.mean / before.mean,
    y: (before.cv / after.cv) ** 2,
    theoryX: expectedAfter.mean / expectedBefore.mean,
    theoryY: (expectedBefore.cv / expectedAfter.cv) ** 2,
  };
}

function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    if (!$("reuseSeed").checked) {
      $("seed").value = crypto.getRandomValues(new Uint32Array(1))[0];
    }
    generate();
  });
}

function activeInputsAreValid(activeGroups) {
  const mode = $("inputMode").value;
  const commonIds = ["baselineCount", "postCount"];
  if (mode === "binomial") commonIds.push("noise");
  if (commonIds.some((id) => !$(id).validity.valid || $(id).value === "")) return false;
  return activeGroups.every((group) =>
    periods.every((period) =>
      parameterSpecs[mode].every((spec) => {
        const input = $(controlId(group, mode, period, spec.key));
        return input.validity.valid && input.value !== "";
      }),
    ),
  );
}

function generate() {
  const activeGroups = $("compare").checked ? groups : ["A"];
  if (!activeInputsAreValid(activeGroups)) {
    $("status").textContent = "Please enter values within the displayed limits.";
    return;
  }
  experiments = activeGroups.map((group) => makeExperiment(group, Number($("seed").value)));
  render();
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

// Export through a Blob so the camera button works in Safari as well as Chrome.
function downloadPNG(plot) {
  return Plotly.toImage(plot, {
    format: "png",
    width: plot._fullLayout.width,
    height: plot._fullLayout.height,
    scale: 2,
  })
    .then((url) => {
      const binary = atob(url.split(",")[1]);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      saveBlob(
        new Blob([bytes], { type: "image/png" }),
        "CVAnalysis_" + (plot.id === "timePlot" ? "time_course" : "normalized") + ".png",
      );
    })
    .catch(() => {
      $("status").textContent = "PNG export failed. Please try again.";
    });
}

const plotConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["toImage"],
  modeBarButtonsToAdd: [
    { name: "Download plot as a png", icon: Plotly.Icons.camera, click: downloadPNG },
  ],
};

function axis(text, size) {
  return {
    title: { text, font: { size } },
    tickfont: { size },
    showgrid: true,
    gridcolor: "#e0e0e0",
    zeroline: false,
    automargin: true,
  };
}

function baseLayout(title, size) {
  return {
    title: { text: "<b>" + title + "</b>", font: { size }, y: 0.98, yanchor: "top" },
    paper_bgcolor: "#c7c7c7",
    plot_bgcolor: "white",
    margin: { l: 90, r: 35, t: 95, b: 72 },
    height: 600,
    legend: {
      orientation: "h",
      font: { size: Math.max(14, size - 3) },
      y: 1.01,
      yanchor: "bottom",
    },
    hovermode: "closest",
  };
}

function finitePositive(value) {
  return Number.isFinite(value) && value >= 0;
}

function render() {
  const size = Number($("fontSize").value);
  $("fontValue").textContent = size + " px";
  $("comparison").hidden = !$("compare").checked;

  const timeTraces = experiments.map((experiment) => ({
    x: experiment.time,
    y: experiment.response,
    type: "scatter",
    mode: "markers",
    name: "Experiment " + experiment.group,
    marker: { color: colors[experiment.group], size: 5 },
    hovertemplate:
      "%{x:.2f} min<br>%{y:.3f} mV<extra>" + experiment.group + "</extra>",
  }));

  const baselineEnd = experiments[0].baselineCount / 6;
  const postStart = baselineEnd + 5;
  const endTime = postStart + experiments[0].postCount / 6;
  const timeLayout = baseLayout("Plasticity time course", size);
  timeLayout.xaxis = { ...axis("Time (min)", size), range: [0, endTime] };
  timeLayout.xaxis.title.standoff = 6;
  timeLayout.yaxis = {
    ...axis("EPSP amplitude (mV)", size),
    range: [
      0,
      Math.max(0.1, ...experiments.flatMap((experiment) => experiment.response.filter(Number.isFinite))) *
        1.08,
    ],
  };
  timeLayout.shapes = [
    {
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: baselineEnd,
      x1: postStart,
      y0: 0,
      y1: 1,
      fillcolor: "#aaa",
      opacity: 0.35,
      line: { width: 0 },
      layer: "below",
    },
  ];
  timeLayout.annotations = [
    {
      x: (baselineEnd + postStart) / 2,
      y: 0.98,
      xref: "x",
      yref: "paper",
      text: "Induction",
      showarrow: false,
      yanchor: "top",
      font: { size: Math.max(12, size - 4) },
    },
  ];

  const cvTraces = [];
  let limit = 1.4;
  for (const experiment of experiments) {
    if (finitePositive(experiment.x) && finitePositive(experiment.y)) {
      cvTraces.push({
        x: [1, experiment.x],
        y: [1, experiment.y],
        mode: "lines+markers",
        name: "Observed " + experiment.group,
        line: { color: colors[experiment.group], width: 2 },
        marker: { size: 10 },
        hovertemplate:
          "Mean normalized: %{x:.3f}<br>1/CV² normalized: %{y:.3f}<extra>Observed " +
          experiment.group +
          "</extra>",
      });
      limit = Math.max(limit, experiment.x * 1.15, experiment.y * 1.15);
    }
    if (
      $("theory").checked &&
      finitePositive(experiment.theoryX) &&
      finitePositive(experiment.theoryY)
    ) {
      cvTraces.push({
        x: [experiment.theoryX],
        y: [experiment.theoryY],
        mode: "markers",
        name: "Theoretical " + experiment.group,
        marker: {
          size: 14,
          symbol: "diamond-open",
          color: colors[experiment.group],
          line: { width: 2 },
        },
        hovertemplate:
          "Mean normalized: %{x:.3f}<br>1/CV² normalized: %{y:.3f}<extra>Theoretical " +
          experiment.group +
          "</extra>",
      });
      limit = Math.max(limit, experiment.theoryX * 1.15, experiment.theoryY * 1.15);
    }
  }

  const cvLayout = baseLayout("CV analysis", size);
  cvLayout.xaxis = { ...axis("Mean (normalized)", size), range: [0, limit], constrain: "domain" };
  cvLayout.xaxis.title.standoff = 6;
  cvLayout.yaxis = {
    ...axis("1/CV² (normalized)", size),
    range: [0, limit],
    scaleanchor: "x",
    scaleratio: 1,
    constrain: "domain",
  };
  cvLayout.shapes = [
    [0, 0, limit, limit],
    [0, 1, limit, 1],
    [1, 0, 1, limit],
  ].map(([x0, y0, x1, y1], index) => ({
    type: "line",
    x0,
    y0,
    x1,
    y1,
    line: { color: index ? "#444" : "#888", dash: "dot", width: index ? 2 : 1 },
    layer: "below",
  }));

  Plotly.react("timePlot", timeTraces, timeLayout, plotConfig);
  Plotly.react("cvPlot", cvTraces, cvLayout, plotConfig);
  renderCalculations(size);
  renderStatus();
}

function format(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "Undefined";
}

function parameterSummary(parameters, mode) {
  if (mode === "gaussian") {
    return `Entered mean ${format(parameters.mean)} mV; entered SDev ${format(parameters.sd)} mV`;
  }
  return `n = ${parameters.n}; p = ${parameters.p.toFixed(2)}; q = ${parameters.q.toFixed(2)} mV`;
}

function calculationRows(experiment) {
  return [
    ["Baseline", experiment.baselineParameters, experiment.expectedBefore, experiment.before],
    ["Post-induction", experiment.postParameters, experiment.expectedAfter, experiment.after],
  ]
    .map(([label, parameters, expected, sample]) => {
      if (experiment.mode === "gaussian") {
        return `<tr><td>${label}</td><td>${sample.n}</td><td>${parameterSummary(parameters, experiment.mode)}</td><td>${format(sample.mean)}</td><td>${format(sample.analysisSD)}</td><td>${format(sample.cv)}</td></tr>`;
      }
      return `<tr><td>${label}</td><td>${sample.n}</td><td>${parameterSummary(parameters, experiment.mode)}</td><td>${format(expected.mean)}</td><td>${format(expected.releaseSD)}</td><td>${format(expected.measuredSD)}</td><td>${format(sample.mean)}</td><td>${format(sample.sd)}</td><td>${format(sample.analysisSD)}</td><td>${format(sample.cv)}</td></tr>`;
    })
    .join("");
}

function renderCalculations(size) {
  const results = $("results");
  results.hidden = !$("calculations").checked;
  results.style.setProperty("--calculation-size", size + "px");
  if (results.hidden) return;

  const mode = $("inputMode").value;
  const formula =
    "CV = SDev / mean; normalized mean = mean(after) / mean(before); normalized 1/CV² = [CV(before) / CV(after)]².";
  results.innerHTML =
    `<h2>Sample calculations</h2><p>${formula}</p>` +
    experiments
      .map((experiment) => {
        const headings =
          mode === "gaussian"
            ? "<tr><th>Period</th><th>n</th><th>Entered values</th><th>Sample mean (mV)</th><th>Sample SDev (mV)</th><th>CV</th></tr>"
            : "<tr><th>Period</th><th>n</th><th>Entered values</th><th>Expected mean</th><th>Release SDev</th><th>Expected measured SDev</th><th>Sample mean</th><th>Raw sample SDev</th><th>SDev used for CV</th><th>CV</th></tr>";
        const correctionNote =
          mode === "binomial"
            ? `<p>Background noise SDev: <b>${format(experiment.noiseSD)} mV</b>. CV uses ${experiment.correctNoise ? "sample variance minus known noise variance" : "raw sample variance"}.</p>`
            : "";
        return (
          `<h2>Experiment ${experiment.group}</h2>${correctionNote}<table>${headings}${calculationRows(experiment)}</table>` +
          `<p>Normalized mean: <b>${format(experiment.x)}</b> · Normalized 1/CV²: <b>${format(experiment.y)}</b></p>`
        );
      })
      .join("");
}

function renderStatus() {
  const messages = [];
  if (experiments.some((experiment) => experiment.before.mean <= 0 || experiment.after.mean <= 0)) {
    messages.push("A sampled mean is zero or negative, so CV interpretation is unreliable.");
  }
  if (
    experiments.some(
      (experiment) =>
        experiment.correctNoise &&
        (experiment.before.analysisVariance <= 0 || experiment.after.analysisVariance <= 0),
    )
  ) {
    messages.push(
      "For at least one period, sample variance does not exceed the known noise variance; corrected CV is undefined.",
    );
  }
  $("status").textContent = messages.join(" ");
}

function updateModeUI() {
  const mode = $("inputMode").value;
  document.querySelectorAll(".mode-controls").forEach((controls) => {
    controls.hidden = controls.dataset.mode !== mode;
  });
  $("noiseSection").hidden = mode !== "binomial";
}

function setPairedValue(id, value, originalRangeMax) {
  $(id).value = value;
  $(id + "Range").max = Math.max(originalRangeMax, Number(value));
  $(id + "Range").value = value;
}

function resetControls() {
  for (const group of groups) {
    for (const mode of ["gaussian", "binomial"]) {
      for (const period of periods) {
        for (const spec of parameterSpecs[mode]) {
          setPairedValue(
            controlId(group, mode, period, spec.key),
            defaultsFor(group, mode, period)[spec.key],
            spec.rangeMax,
          );
        }
      }
    }
  }
  $("inputMode").value = "gaussian";
  $("noise").value = 0;
  $("noiseRange").value = 0;
  $("correctNoise").checked = true;
  $("seed").value = 311;
  $("reuseSeed").checked = true;
  $("compare").checked = false;
  $("theory").checked = false;
  $("calculations").checked = false;
  $("baselineCount").value = 60;
  $("postCount").value = 200;
  $("baselineCountRange").value = 60;
  $("postCountRange").value = 200;
  updateModeUI();
  generate();
}

function metadataRows() {
  const mode = $("inputMode").value;
  const rows = [
    "",
    `Simulation mode,${mode === "gaussian" ? "Mean and SDev" : "Binomial n p q"}`,
    `Random seed,${$("seed").value}`,
    `Baseline responses,${$("baselineCount").value}`,
    `Post-induction responses,${$("postCount").value}`,
  ];
  if (mode === "binomial") {
    rows.push(`Background noise SDev (mV),${$("noise").value}`);
    rows.push(`Correct CV for background noise,${$("correctNoise").checked ? "yes" : "no"}`);
  }
  for (const experiment of experiments) {
    for (const period of periods) {
      const parameters =
        period === "baseline" ? experiment.baselineParameters : experiment.postParameters;
      for (const spec of parameterSpecs[mode]) {
        rows.push(`Experiment ${experiment.group} ${period} ${spec.key},${parameters[spec.key]}`);
      }
    }
  }
  return rows;
}

function downloadData() {
  const headers = [
    "time",
    ...experiments.map((experiment) => "EPSP_" + experiment.group),
    ...experiments.flatMap((experiment) => [
      "CV_mean_" + experiment.group,
      "CV_inverse_squared_" + experiment.group,
    ]),
  ];
  const rows = [headers.join(",")];
  for (let i = 0; i < experiments[0].time.length; i++) {
    const coordinates = experiments.flatMap((experiment) =>
      i === 0 ? [1, 1] : i === 1 ? [experiment.x, experiment.y] : ["", ""],
    );
    rows.push(
      [
        experiments[0].time[i],
        ...experiments.map((experiment) =>
          experiment.response[i] === null ? "" : experiment.response[i],
        ),
        ...coordinates,
      ].join(","),
    );
  }
  rows.push(...metadataRows());
  saveBlob(
    new Blob([rows.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }),
    "CVAnalysis_seed" + $("seed").value + ".csv",
  );
}

buildControls();

bindExistingNumberAndRange("baselineCount", 100);
bindExistingNumberAndRange("postCount", 400);
bindExistingNumberAndRange("noise", 3);

$("inputMode").addEventListener("change", () => {
  updateModeUI();
  schedule();
});
$("correctNoise").addEventListener("change", schedule);
$("compare").addEventListener("change", generate);
$("fontSize").addEventListener("input", render);
$("theory").addEventListener("change", render);
$("calculations").addEventListener("change", render);
$("newSeed").addEventListener("click", () => {
  $("seed").value = crypto.getRandomValues(new Uint32Array(1))[0];
  generate();
});
$("reset").addEventListener("click", resetControls);
$("download").addEventListener("click", downloadData);

updateModeUI();
requestAnimationFrame(generate);
