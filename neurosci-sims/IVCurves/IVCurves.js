/*
 * Channel Currents & I–V Curves — user interface, Version 0.6.
 * Created 17 October 2026, entirely "vibe coded" by OpenAI Codex
 * (GPT-6-based coding assistant), under P. Jesper Sjöström's guidance.
 * Model assumptions and the Hodgkin–Huxley reference are in model.js.
 * Plotly is a separately distributed third-party plotting library.
 *
 * Contribution clarification, 17 October 2026: P. Jesper Sjöström directed
 * the scientific and teaching design, supplied requirements, and reviewed
 * iterative revisions. OpenAI Codex generated the implementation and assisted
 * with debugging and checks. This is separate from the student implementations.
 */
"use strict";
const $ = (id) => document.getElementById(id);
const colours = { A: "#167b87", B: "#c56a16" };
const channelDefaults = {
  GABA: { g: 10, e: -70 },
  Kir: { g: 10, e: -90 },
  HCN: { g: 1, e: -30 },
  Na: { g: 120, e: 50 },
  K: { g: 36, e: -77 },
  AMPA: { g: 10, e: 0 },
  NMDA: { g: 80, e: 0 },
  CPAMPA: { g: 10, e: 0 },
  nAChR: { g: 10, e: 0 },
};
const channelNames = {
  GABA: "GABAₐ",
  Kir: "Kir2.1",
  HCN: "HCN1",
  Na: "HH Na⁺",
  K: "HH K⁺",
  AMPA: "AMPAR",
  NMDA: "NMDAR",
  CPAMPA: "CP-AMPAR",
  nAChR: "nAChR",
};
// Source tooltips follow the selected channel; full citations are in model.js.
const channelSources = {
  HCN: "Altomare et al. (2001), J Gen Physiol 117:519–532, Table 2. Ten-state mouse HCN1 model; room-temperature kinetics, no adjustable cAMP.",
  GABA: "Destexhe et al. (1998), section 1.4.3: reduced GABAₐ kinetics. Effective anion reversal potential; no desensitisation.",
  Kir: "Ishihara & Ehara (2004), two-mode steady-state fit; parameters confirmed by Ishihara & Yan (2007). Fixed 5 µM spermine, no Mg²⁺ block or block kinetics.",
  CPAMPA:
    "AMPAR kinetics: Destexhe et al. (1994/1998). Polyamine block: Washburn et al. (1997), J Neurosci 17:9393–9406. Illustrative block parameters.",
  nAChR:
    "Muscle-type teaching adaptation: Land et al. (1981), PNAS 78:7200–7204, Tables 2/3B. Fixed voltage-independent kinetics.",
  Na: "Hodgkin & Huxley (1952), J Physiol 117:500–544. Squid-axon Na⁺ kinetics.",
  K: "Hodgkin & Huxley (1952), J Physiol 117:500–544. Squid-axon K⁺ kinetics.",
  AMPA: "Destexhe et al. (1994), Neural Comput 6:14–18; rates: Destexhe et al. (1998). Ca²⁺-impermeable AMPAR preset.",
  NMDA: "Destexhe et al. (1994/1998), kinetics; Jahr & Stevens (1990), J Neurosci 10:3178–3182, Mg²⁺ block.",
};
const protocolSpecs = [
  ["hold", "Holding V (mV)", -80, -120, 50, 1],
  ["min", "Start (mV)", -80, -120, 100, 1],
  ["max", "End (mV)", 60, -120, 100, 1],
  ["increment", "Step (mV)", 10, 1, 40, 1],
  ["duration", "Step dur. (ms)", 20, 0.5, 5000, 0.5],
];
let experiments = [],
  parameters,
  selected = -20,
  pending = false;
function control(parent, id, label, value, min, max, step) {
  const row = document.createElement("div");
  row.innerHTML = `<label for="${id}">${label}</label><input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"><input id="${id}Range" type="range" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${value}">`;
  $(parent).appendChild(row);
  $(id).addEventListener("input", () => {
    if ($(id).validity.valid && $(id).value !== "") $(id + "Range").value = $(id).value;
    schedule();
  });
  $(id + "Range").addEventListener("input", () => {
    $(id).value = $(id + "Range").value;
    schedule();
  });
}
protocolSpecs.forEach(([id, label, val, min, max, step]) =>
  control("protocolControls", id, label, val, min, max, step),
);
document.querySelector('label[for="hold"]').innerHTML = "V<sub>hold</sub> (mV)";
$("hold").parentElement.after($("measurementControl"));
control("agonistControls", "glutamate", "Glutamate (mM)", 1, 0, 5, 0.1);
control("agonistControls", "pulse", "Pulse dur. (ms)", 2, 0.1, 100, 0.1);
$("pulse").parentElement.title =
  "Duration of glutamate exposure. Longer pulses recruit more receptors in this model. Desensitisation is not included.";
control("gabaControls", "gaba", "GABA (mM)", 1, 0, 5, 0.1);
control("gabaControls", "gabaPulse", "Pulse dur. (ms)", 2, 0.1, 100, 0.1);
control("achControls", "ach", "ACh (mM)", 0.1, 0, 5, 0.01);
control("achControls", "achPulse", "Pulse dur. (ms)", 2, 0.1, 100, 0.1);
for (const slot of ["A", "B"]) {
  const d = channelDefaults[$("channel" + slot).value];
  control("controls" + slot, "g" + slot, "Max g (mS/cm²)", d.g, 0, 200, 0.1);
  control("controls" + slot, "e" + slot, "E<sub>rev</sub> (mV)", d.e, -120, 100, 1);
  control("mgControls" + slot, "mg" + slot, "External Mg²⁺ (mM)", 1, 0, 5, 0.1);
  control("paControls" + slot, "pa" + slot, "Internal polyamine (µM)", 50, 0, 200, 1);
  $("channel" + slot).addEventListener("change", () => {
    const d = channelDefaults[$("channel" + slot).value];
    set("g" + slot, d.g);
    set("e" + slot, d.e);
    schedule();
  });
}
function set(id, value) {
  $(id).value = value;
  if ($(id + "Range")) $(id + "Range").value = value;
}
function schedule() {
  if (!pending) {
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      generate();
    });
  }
}
function generate() {
  const slots = $("compare").checked ? ["A", "B"] : ["A"];
  $("panelB").hidden = !$("compare").checked;
  for (const slot of ["A", "B"]) {
    const type = $("channel" + slot).value;
    $("channel" + slot).title = channelSources[type];
    $("heading" + slot).title = channelSources[type];
    $("g" + slot).parentElement.title = HHModel.isReceptor(type)
      ? "Illustrative conductance density, chosen for visual comparison; not a measured synaptic density."
      : type === "Kir"
        ? "Unblocked conductance density is an illustrative amplitude scale. The rectification parameters come from a published fit."
        : type === "HCN"
          ? "Illustrative maximum conductance density; HCN1 gating uses published parameters."
          : "Classical HH maximum conductance density.";
    $("e" + slot).parentElement.title =
      type === "GABA"
        ? "Effective GABAₐ reversal potential. Chloride and bicarbonate currents are not calculated separately."
        : type === "Kir"
          ? "Potassium reversal potential. Try Start below this value to see inward K⁺ current."
          : type === "HCN"
            ? "Effective mixed Na⁺/K⁺ reversal potential. −30 mV is a teaching default, not calculated from ion concentrations."
            : "Current reverses at this voltage.";
  }
  const types = slots.map((s) => $("channel" + s).value);
  const glutamatergic = types.some((t) => ["AMPA", "CPAMPA", "NMDA"].includes(t));
  $("hcnProtocol").hidden = !types.includes("HCN");
  const nicotinic = types.includes("nAChR");
  const gabaergic = types.includes("GABA");
  const receptors = glutamatergic || nicotinic || gabaergic;
  $("gabaPanel").hidden = !gabaergic;
  $("agonistPanel").hidden = !glutamatergic;
  $("achPanel").hidden = !nicotinic;
  for (const slot of ["A", "B"]) {
    $("mgControls" + slot).hidden = $("channel" + slot).value !== "NMDA";
    $("paControls" + slot).hidden = $("channel" + slot).value !== "CPAMPA";
    $("kirHint" + slot).hidden = $("channel" + slot).value !== "Kir";
  }
  const ids = [
    ...protocolSpecs.map((s) => s[0]),
    ...slots.flatMap((s) => ["g" + s, "e" + s]),
    ...(glutamatergic ? ["glutamate", "pulse"] : []),
    ...(nicotinic ? ["ach", "achPulse"] : []),
    ...(gabaergic ? ["gaba", "gabaPulse"] : []),
    ...slots.filter((s) => $("channel" + s).value === "NMDA").map((s) => "mg" + s),
    ...slots.filter((s) => $("channel" + s).value === "CPAMPA").map((s) => "pa" + s),
  ];
  if (ids.some((id) => !$(id).validity.valid || $(id).value === "")) {
    $("status").textContent =
      "Enter valid values within the displayed control limits. Graphs retain the last valid experiment.";
    return;
  }
  const p = Object.fromEntries(protocolSpecs.map((s) => [s[0], Number($(s[0]).value)]));
  p.measure = $("measure").value;
  p.receptors = receptors;
  p.glutamatergic = glutamatergic;
  p.nicotinic = nicotinic;
  p.gabaergic = gabaergic;
  p.gaba = gabaergic ? Number($("gaba").value) : 0;
  p.gabaPulse = gabaergic ? Number($("gabaPulse").value) : 0;
  p.ach = nicotinic ? Number($("ach").value) : 0;
  p.achPulse = nicotinic ? Number($("achPulse").value) : 0;
  p.glutamate = glutamatergic ? Number($("glutamate").value) : 0;
  p.pulse = glutamatergic ? Number($("pulse").value) : 0;
  if (p.pulse > p.duration || p.achPulse > p.duration || p.gabaPulse > p.duration) {
    $("status").textContent =
      "Agonist pulse duration must not exceed the voltage-step duration. Graphs retain the last valid experiment.";
    return;
  }
  if (p.min > p.max) {
    $("status").textContent = "The first test voltage must not exceed the upper limit.";
    return;
  }
  parameters = p;
  const vs = HHModel.voltages(p);
  if (!vs.includes(selected))
    selected = vs.reduce(
      (a, b) => (Math.abs(b - selected) < Math.abs(a - selected) ? b : a),
      vs[0],
    );
  experiments = slots.map((slot) => {
    const c = {
      slot,
      channel: $("channel" + slot).value,
      g: Number($("g" + slot).value),
      e: Number($("e" + slot).value),
      mg: Number($("mg" + slot).value),
      pa: Number($("pa" + slot).value),
    };
    return { ...c, sweeps: vs.map((v) => HHModel.sweep(p, c, v)) };
  });
  $("status").textContent = "";
  render();
}
function axis(title) {
  const size = Number($("font").value);
  return {
    title: { text: title, font: { size } },
    tickfont: { size },
    showgrid: true,
    gridcolor: "#e2e8e8",
    zeroline: true,
    zerolinecolor: "#899",
    automargin: true,
  };
}
function layout(title, height) {
  const size = Number($("font").value);
  return {
    title: { text: title, font: { size: size + 2 }, y: 0.98 },
    height,
    margin: { l: 85, r: 25, t: 85, b: 75 },
    paper_bgcolor: "white",
    plot_bgcolor: "white",
    legend: { orientation: "h", y: 1.02, yanchor: "bottom", font: { size: 14 } },
    hovermode: "closest",
  };
}
function save(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// Blob downloads avoid the data-URL camera-export issue in Safari.
async function png(plot) {
  try {
    const url = await Plotly.toImage(plot, {
      format: "png",
      width: plot._fullLayout.width,
      height: plot._fullLayout.height,
      scale: 2,
    });
    const bytes = Uint8Array.from(atob(url.split(",")[1]), (c) => c.charCodeAt(0));
    save(new Blob([bytes], { type: "image/png" }), "IVCurves_" + plot.id + ".png");
  } catch (e) {
    $("status").textContent = "PNG export failed. Please try again.";
  }
}
const config = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["toImage"],
  modeBarButtonsToAdd: [{ name: "Download plot as PNG", icon: Plotly.Icons.camera, click: png }],
};
function render() {
  if (!experiments.length) return;
  $("fontValue").textContent = $("font").value + " px";
  const protocol = [],
    currents = [],
    iv = [];
  for (const s of experiments[0].sweeps)
    protocol.push({
      x: s.time,
      y: s.voltage,
      mode: "lines",
      line: { color: s.v === selected ? "#283b40" : "#c5cece", width: s.v === selected ? 2.5 : 1 },
      name: s.v + " mV",
      showlegend: false,
    });
  for (const e of experiments) {
    const name = e.slot + ": " + channelNames[e.channel],
      colour = colours[e.slot];
    for (const s of e.sweeps) {
      currents.push({
        x: s.time,
        y: s.values,
        meta: { voltage: s.v },
        mode: "lines",
        name: name + " · " + s.v + " mV",
        legendgroup: e.slot,
        showlegend: s.v === selected,
        opacity: s.v === selected ? 1 : 0.3,
        line: { color: colour, width: s.v === selected ? 2.5 : 1 },
        hovertemplate: "%{x:.3f} ms<br>%{y:.3f} µA/cm²<extra>" + name + " · " + s.v + " mV</extra>",
      });
      currents.push({
        x: [s.time[s.index]],
        y: [s.measured],
        mode: "markers",
        marker: { color: colour, size: s.v === selected ? 10 : 5 },
        showlegend: false,
        hoverinfo: "skip",
      });
    }
    iv.push({
      x: e.sweeps.map((s) => s.v),
      y: e.sweeps.map((s) => s.measured),
      mode: "lines+markers",
      name,
      marker: { color: colour, size: e.sweeps.map((s) => (s.v === selected ? 12 : 6)) },
      line: { color: colour },
      hovertemplate: "%{x} mV<br>%{y:.3f} µA/cm²<extra>" + name + "</extra>",
    });
  }
  const v = layout(parameters.receptors ? "Voltage & agonist protocol" : "Voltage protocol", 235);
  if (parameters.receptors) {
    const pulses = [];
    if (parameters.glutamatergic)
      pulses.push({
        name: "Glu",
        level: parameters.glutamate,
        duration: parameters.pulse,
        color: "#9a4eaf",
        dash: "dot",
      });
    if (parameters.nicotinic)
      pulses.push({
        name: "ACh",
        level: parameters.ach,
        duration: parameters.achPulse,
        color: "#3b7d32",
        dash: "dash",
      });
    if (parameters.gabaergic)
      pulses.push({
        name: "GABA",
        level: parameters.gaba,
        duration: parameters.gabaPulse,
        color: "#9b5728",
        dash: "dashdot",
      });
    for (const pulse of pulses)
      protocol.push({
        x: [0, 2, 2, 2 + pulse.duration, 2 + pulse.duration, 7 + parameters.duration],
        y: [0, 0, pulse.level, pulse.level, 0, 0],
        yaxis: "y2",
        mode: "lines",
        name: pulse.name,
        showlegend: false,
        line: { color: pulse.color, width: 2, dash: pulse.dash },
        hovertemplate: "%{x:.2f} ms<br>" + pulse.name + ": %{y} mM<extra></extra>",
      });
    v.yaxis2 = {
      ...axis(pulses.map((p) => p.name).join(" / ") + " (mM)"),
      overlaying: "y",
      side: "right",
      showgrid: false,
      zeroline: false,
      range: [0, Math.max(0.1, ...pulses.map((p) => p.level)) * 1.2],
    };
    v.margin.r = 80;
  }
  v.xaxis = axis("Time (ms)");
  v.yaxis = axis("V (mV)");
  v.margin.t = 45;
  v.margin.b = 60;
  const c = layout("Population currents", 500);
  c.xaxis = axis("Time (ms)");
  c.yaxis = axis("Current (µA/cm²)");
  const i = layout(parameters.measure === "peak" ? "I–V: peak current" : "I–V: end of step", 500);
  i.xaxis = axis("Test voltage (mV)");
  i.yaxis = axis("Current (µA/cm²)");
  Plotly.react("voltagePlot", protocol, v, config);
  Plotly.react("currentPlot", currents, c, config);
  Plotly.react("ivPlot", iv, i, config);
}
$("compare").addEventListener("change", schedule);
$("measure").addEventListener("change", schedule);
$("font").addEventListener("input", render);
$("useHcnProtocol").addEventListener("click", () => {
  set("hold", -35);
  set("min", -120);
  set("max", -40);
  set("increment", 10);
  set("duration", 1000);
  $("measure").value = "end";
  selected = -100;
  generate();
});
$("reset").addEventListener("click", () => {
  protocolSpecs.forEach((s) => set(s[0], s[2]));
  for (const [slot, type] of [
    ["A", "AMPA"],
    ["B", "NMDA"],
  ]) {
    $("channel" + slot).value = type;
    set("g" + slot, channelDefaults[type].g);
    set("e" + slot, channelDefaults[type].e);
  }
  set("glutamate", 1);
  set("pulse", 2);
  set("gaba", 1);
  set("gabaPulse", 2);
  set("ach", 0.1);
  set("achPulse", 2);
  set("paA", 50);
  set("paB", 50);
  set("mgA", 1);
  set("mgB", 1);
  $("compare").checked = true;
  $("measure").value = "peak";
  selected = -20;
  generate();
});
// Each sweep has a time, command-voltage, and current column. I–V columns are
// independent shorter series, padded with blanks after their last coordinate.
$("download").addEventListener("click", () => {
  const columns = [];
  for (const e of experiments) {
    for (const s of e.sweeps) {
      const stem = e.slot + "_" + e.channel + "_" + s.v + "mV";
      columns.push(
        [stem + "_time_ms", s.time],
        [stem + "_command_mV", s.voltage],
        [stem + "_current_uA_per_cm2", s.values],
      );
      if (parameters.glutamatergic) columns.push([stem + "_glutamate_mM", s.glutamate]);
      if (parameters.gabaergic) columns.push([stem + "_GABA_mM", s.gaba]);
      if (parameters.nicotinic) columns.push([stem + "_acetylcholine_mM", s.acetylcholine]);
    }
    columns.push(
      [e.slot + "_IV_voltage_mV", e.sweeps.map((s) => s.v)],
      [e.slot + "_IV_" + parameters.measure + "_uA_per_cm2", e.sweeps.map((s) => s.measured)],
    );
  }
  const length = Math.max(...columns.map((c) => c[1].length));
  const rows = [columns.map((c) => c[0]).join(",")];
  for (let n = 0; n < length; n++) rows.push(columns.map((c) => c[1][n] ?? "").join(","));
  save(
    new Blob([rows.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }),
    "IVCurves_" + parameters.measure + ".csv",
  );
});
generate();
$("ivPlot").on("plotly_click", (event) => {
  selected = event.points[0].x;
  render();
});

$("currentPlot").on("plotly_click", (event) => {
  const voltage = event.points[0].data.meta?.voltage;
  if (Number.isFinite(voltage)) {
    selected = voltage;
    render();
  }
});
