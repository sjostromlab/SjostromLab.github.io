/*
 * CV Analysis Simulation — Version 0.9
 * 16 October 2026
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
 * This teaching version generates Gaussian response samples from specified
 * means and SDevs; it is not a full port of the paper's release-site model.
 */

"use strict";
const $ = (id) => document.getElementById(id);
// Mean and SDev defaults: baseline first, then post-induction.
const defaults = { A: [2, 0.2, 4, 0.2], B: [2, 0.2, 4, 0.4] };
const labels = [
  "Baseline response (mV)",
  "Baseline SDev (mV)",
  "Post-induction response (mV)",
  "Post-induction SDev (mV)",
];
const colors = { A: "#a86812", B: "#2869b0" };
let experiments = [],
  pending = false;
for (const group of ["A", "B"]) {
  labels.forEach((label, i) => {
    const row = document.createElement("div");
    row.title =
      "One response every 10 seconds, with a 5-minute induction gap between baseline and post-induction responses.";
    row.innerHTML = `<label for="${group}${i}">${label}</label><input id="${group}${i}" type="number" min="${i % 2 ? 0.01 : 0.1}" max="20" step="${i % 2 ? 0.01 : 0.1}" value="${defaults[group][i]}"><input id="${group}${i}Range" type="range" aria-label="${group}: ${label}" min="${i % 2 ? 0.01 : 0.1}" max="${i % 2 ? 3 : 10}" step="${i % 2 ? 0.01 : 0.1}" value="${defaults[group][i]}">`;
    $("controls" + group).appendChild(row);
    const number = $(group + i),
      slider = $(group + i + "Range");
    slider.addEventListener("input", () => {
      number.value = slider.value;
      schedule();
    });
    number.addEventListener("input", () => {
      if (number.validity.valid && number.value !== "") {
        slider.max = Math.max(Number(slider.max), Number(number.value));
        slider.value = number.value;
        schedule();
      }
    });
    number.addEventListener("change", () => {
      if (!number.validity.valid || number.value === "") {
        $("status").textContent =
          `Please enter a value from ${i % 2 ? 0.01 : 0.1} to 20 mV in steps of ${i % 2 ? 0.01 : 0.1} mV.`;
      }
    });
  });
}
// Seeded randomness lets parameter changes reuse the same underlying samples.
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
// Sample SDev uses n - 1; all responses in each period enter the analysis.
function stats(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1));
  return { mean, sd, cv: sd / mean, n: values.length };
}
// Responses are spaced 10 seconds apart, with 30 missing samples during induction.
function makeExperiment(group, seed) {
  const parameters = labels.map((_, i) => Number($(group + i).value));
  const random = rng((seed + (group === "B" ? 104729 : 0)) >>> 0),
    [m1, s1, m2, s2] = parameters;
  const baselineCount = Number($("baselineCount").value),
    postCount = Number($("postCount").value);
  const time = [],
    response = [];
  for (let i = 0; i < baselineCount + 30 + postCount; i++) {
    time.push(i / 6);
    response.push(
      i < baselineCount
        ? m1 + s1 * normal(random)
        : i < baselineCount + 30
          ? null
          : m2 + s2 * normal(random),
    );
  }
  const before = stats(response.slice(0, baselineCount)),
    after = stats(response.slice(baselineCount + 30));
  return {
    group,
    baselineCount,
    postCount,
    parameters,
    time,
    response,
    before,
    after,
    x: after.mean / before.mean,
    y: (before.cv / after.cv) ** 2,
    theoryX: m2 / m1,
    theoryY: (s1 / m1 / (s2 / m2)) ** 2,
  };
}
// Batch slider events and optionally draw a fresh seed for the next experiment.
function schedule() {
  if (!pending) {
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (!$("reuseSeed").checked) $("seed").value = crypto.getRandomValues(new Uint32Array(1))[0];
      generate();
    });
  }
}
function generate() {
  if (!$("seed").validity.valid || $("seed").value === "") {
    $("status").textContent = "Enter a whole-number seed from 0 to 4294967295.";
    return;
  }
  if (["baselineCount", "postCount"].some((id) => !$(id).validity.valid || $(id).value === "")) {
    $("status").textContent = "Enter whole-number counts: baseline 3–100; post-induction 3–400.";
    return;
  }
  const groups = $("compare").checked ? ["A", "B"] : ["A"];
  if (groups.some((g) => labels.some((_, i) => !$(g + i).validity.valid || $(g + i).value === "")))
    return;
  experiments = groups.map((g) => makeExperiment(g, Number($("seed").value)));
  render();
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// Export through a Blob so the camera download also works in Safari.
function downloadPNG(plot) {
  return Plotly.toImage(plot, {
    format: "png",
    width: plot._fullLayout.width,
    height: plot._fullLayout.height,
    scale: 2,
  })
    .then((url) => {
      const binary = atob(url.split(",")[1]),
        bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      saveBlob(
        new Blob([bytes], { type: "image/png" }),
        "CVAnalysis_" + (plot.id === "timePlot" ? "time_course" : "normalized") + ".png",
      );
    })
    .catch(() => {
      $("status").textContent = "PNG export failed. Please try again.";
    });
}
const config = {
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
function base(title, size) {
  return {
    title: { text: "<b>" + title + "</b>", font: { size }, y: 0.97, yanchor: "top" },
    paper_bgcolor: "#c7c7c7",
    plot_bgcolor: "white",
    margin: { l: 90, r: 35, t: 130, b: 85 },
    height: 600,
    legend: {
      orientation: "h",
      font: { size: Math.max(14, size - 3) },
      y: 1.02,
      yanchor: "bottom",
    },
    hovermode: "closest",
  };
}
function render() {
  const size = Number($("fontSize").value);
  $("fontValue").textContent = size + " px";
  $("comparison").hidden = !$("compare").checked;
  const traces = experiments.map((e) => ({
    x: e.time,
    y: e.response,
    type: "scatter",
    mode: "markers",
    name: "Experiment " + e.group,
    marker: { color: colors[e.group], size: 5 },
    hovertemplate: "%{x:.2f} min<br>%{y:.3f} mV<extra>" + e.group + "</extra>",
  }));
  const baselineEnd = experiments[0].baselineCount / 6,
    postStart = baselineEnd + 5,
    endTime = postStart + experiments[0].postCount / 6;
  const timeLayout = base("Plasticity time course", size);
  timeLayout.xaxis = { ...axis("Time (min)", size), range: [0, endTime] };
  timeLayout.yaxis = {
    ...axis("EPSP amplitude (mV)", size),
    range: [
      0,
      Math.max(0.1, ...experiments.flatMap((e) => e.response.filter((v) => v !== null))) * 1.08,
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
  const points = [];
  let limit = 1.4;
  for (const e of experiments) {
    if (Number.isFinite(e.x) && Number.isFinite(e.y)) {
      points.push({
        x: [1, e.x],
        y: [1, e.y],
        mode: "lines+markers",
        name: "Observed " + e.group,
        line: { color: colors[e.group], width: 2 },
        marker: { size: 10 },
        hovertemplate:
          "Mean normalized: %{x:.3f}<br>1/CV² normalized: %{y:.3f}<extra>Observed " +
          e.group +
          "</extra>",
      });
      limit = Math.max(limit, e.x * 1.15, e.y * 1.15);
    }
    if ($("theory").checked) {
      points.push({
        x: [e.theoryX],
        y: [e.theoryY],
        mode: "markers",
        name: "Theoretical " + e.group,
        marker: { size: 14, symbol: "diamond-open", color: colors[e.group], line: { width: 2 } },
        hovertemplate:
          "Mean normalized: %{x:.3f}<br>1/CV² normalized: %{y:.3f}<extra>Theoretical " +
          e.group +
          "</extra>",
      });
      limit = Math.max(limit, e.theoryX * 1.15, e.theoryY * 1.15);
    }
  }
  const cvLayout = base("CV analysis", size);
  cvLayout.xaxis = { ...axis("Mean (normalized)", size), range: [0, limit], constrain: "domain" };
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
  ].map(([x0, y0, x1, y1], i) => ({
    type: "line",
    x0,
    y0,
    x1,
    y1,
    line: { color: i ? "#444" : "#888", dash: "dot", width: i ? 2 : 1 },
    layer: "below",
  }));
  Plotly.react("timePlot", traces, timeLayout, config);
  Plotly.react("cvPlot", points, cvLayout, config);
  const f = (v) => (Number.isFinite(v) ? v.toFixed(3) : "Undefined");
  $("results").hidden = !$("calculations").checked;
  $("results").style.setProperty("--calculation-size", size + "px");
  $("results").innerHTML =
    "<h2>Sample calculations</h2><p>CV = SDev / mean; normalized mean = mean(after) / mean(before); normalized 1/CV² = [CV(before) / CV(after)]².</p>" +
    experiments
      .map(
        (e) =>
          `<h2>Experiment ${e.group}</h2><table><tr><th>Window</th><th>n</th><th>Mean (mV)</th><th>SDev (mV)</th><th>CV</th></tr>${[
            ["Baseline", e.before],
            ["Post-induction", e.after],
          ]
            .map(
              ([label, s]) =>
                `<tr><td>${label}</td><td>${s.n}</td><td>${f(s.mean)}</td><td>${f(s.sd)}</td><td>${f(s.cv)}</td></tr>`,
            )
            .join(
              "",
            )}</table><p>Normalized mean: <b>${f(e.x)}</b> · Normalized 1/CV²: <b>${f(e.y)}</b></p>`,
      )
      .join("");
  $("status").textContent = experiments.some((e) => e.before.mean <= 0 || e.after.mean <= 0)
    ? "A sampled mean is zero or negative. CV interpretation is unreliable; increase the mean or reduce variability."
    : "";
}
for (const id of ["baselineCount", "postCount"]) {
  $(id).addEventListener("input", () => {
    if ($(id).validity.valid && $(id).value !== "") $(id + "Range").value = $(id).value;
    schedule();
  });
  $(id + "Range").addEventListener("input", () => {
    $(id).value = $(id + "Range").value;
    schedule();
  });
}
$("compare").addEventListener("change", generate);
$("seed").addEventListener("input", schedule);
for (const id of ["fontSize", "theory", "calculations"])
  $(id).addEventListener(id === "fontSize" ? "input" : "change", render);
$("newSeed").addEventListener("click", () => {
  $("seed").value = crypto.getRandomValues(new Uint32Array(1))[0];
  generate();
});
$("reset").addEventListener("click", () => {
  for (const g of ["A", "B"])
    defaults[g].forEach((v, i) => {
      $(g + i).value = v;
      $(g + i + "Range").max = i % 2 ? 3 : 10;
      $(g + i + "Range").value = v;
    });
  $("seed").value = 311;
  $("reuseSeed").checked = true;
  $("compare").checked = false;
  $("theory").checked = false;
  $("calculations").checked = false;
  $("baselineCount").value = 60;
  $("postCount").value = 200;
  $("baselineCountRange").value = 60;
  $("postCountRange").value = 200;
  generate();
});
// CV columns contain the baseline (1, 1) and endpoint in their first two rows.
$("download").addEventListener("click", () => {
  const headers = [
    "time",
    ...experiments.map((e) => "EPSP_" + e.group),
    ...experiments.flatMap((e) => ["CV_mean_" + e.group, "CV_inverse_squared_" + e.group]),
  ];
  const rows = [headers.join(",")];
  for (let i = 0; i < experiments[0].time.length; i++) {
    const coordinates = experiments.flatMap((e) =>
      i === 0 ? [1, 1] : i === 1 ? [e.x, e.y] : ["", ""],
    );
    rows.push(
      [
        experiments[0].time[i],
        ...experiments.map((e) => (e.response[i] === null ? "" : e.response[i])),
        ...coordinates,
      ].join(","),
    );
  }
  saveBlob(
    new Blob([rows.join("\r\n") + "\r\n"], { type: "text/plain;charset=utf-8" }),
    "CVAnalysis_seed" + $("seed").value + ".txt",
  );
});
generate();
