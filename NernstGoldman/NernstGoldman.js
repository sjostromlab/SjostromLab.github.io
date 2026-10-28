/*
 * Nernst and Goldman Potentials — Version 0.9.
 * Created 21 October 2026, entirely "vibe coded" by OpenAI Codex
 * (GPT-6-based coding assistant), under P. Jesper Sjöström's guidance.
 *
 * P. Jesper Sjöström directed the scientific and teaching design and reviewed
 * the implementation. The model uses the Nernst equation, Goldman's
 * constant-field voltage equation, and the corresponding constant-field
 * current equation. It is conceptually based on Goldman (1943) and Hodgkin &
 * Katz (1949). Plotly is a separately distributed third-party plotting library.
 */
"use strict";

const $ = (id) => document.getElementById(id);
const R = 8.314462618;
const F = 96485.33212;
const colours = {
  K: "#6f4b9b",
  Na: "#d06b24",
  Cl: "#23856f",
  Ca: "#bb477d",
  membrane: "#365f91",
  total: "#222a31",
  zero: "#7f8c94",
};
const ionDefinitions = {
  K: { label: "K⁺", symbol: "K", z: 1, inside: 140, outside: 4 },
  Na: { label: "Na⁺", symbol: "Na", z: 1, inside: 15, outside: 145 },
  Cl: { label: "Cl⁻", symbol: "Cl", z: -1, inside: 10, outside: 120 },
  Ca: { label: "Ca²⁺", symbol: "Ca", z: 2, inside: 0.0001, outside: 1.8 },
};
const defaults = {
  mode: "nernst",
  temperature: 37,
  font: 18,
  ion: "K",
  testVoltage: -65,
};
const goldmanPresets = {
  rest: {
    kIn: 140, kOut: 4, kP: 1,
    naIn: 15, naOut: 145, naP: 0.04,
    clIn: 10, clOut: 120, clP: 0.45,
  },
  highK: {
    kIn: 140, kOut: 20, kP: 1,
    naIn: 15, naOut: 145, naP: 0.04,
    clIn: 10, clOut: 120, clP: 0.45,
  },
  highNaP: {
    kIn: 140, kOut: 4, kP: 1,
    naIn: 15, naOut: 145, naP: 0.5,
    clIn: 10, clOut: 120, clP: 0.45,
  },
  highClP: {
    kIn: 140, kOut: 4, kP: 1,
    naIn: 15, naOut: 145, naP: 0.04,
    clIn: 10, clOut: 120, clP: 2,
  },
  equalCations: {
    kIn: 140, kOut: 4, kP: 1,
    naIn: 15, naOut: 145, naP: 1,
    clIn: 10, clOut: 120, clP: 0,
  },
};
const goldmanIds = ["kIn", "kOut", "kP", "naIn", "naOut", "naP", "clIn", "clOut", "clP"];
let state = null;
let pending = false;

function thermalVoltage(temperatureC) {
  return (R * (temperatureC + 273.15) / F) * 1000;
}

function nernstPotential(z, inside, outside, temperatureC) {
  return (thermalVoltage(temperatureC) / z) * Math.log(outside / inside);
}

function goldmanPotential(parameters) {
  const numerator = parameters.kP * parameters.kOut +
    parameters.naP * parameters.naOut + parameters.clP * parameters.clIn;
  const denominator = parameters.kP * parameters.kIn +
    parameters.naP * parameters.naIn + parameters.clP * parameters.clOut;
  return thermalVoltage(parameters.temperature) * Math.log(numerator / denominator);
}

// Relative GHK current. Absolute permeability and membrane area are omitted,
// so the simulation preserves current direction and ratios rather than amperes.
function constantFieldCurrent(z, inside, outside, permeability, voltageMv, temperatureC) {
  if (permeability === 0) return 0;
  const vt = thermalVoltage(temperatureC);
  const exponent = z * voltageMv / vt;
  if (Math.abs(exponent) < 1e-8)
    return permeability * z * vt * (inside - outside);
  return permeability * z * z * voltageMv *
    (inside - outside * Math.exp(-exponent)) /
    (1 - Math.exp(-exponent));
}

function positiveValue(id) {
  const value = Number($(id).value);
  return Number.isFinite(value) && value > 0 ? value : 1e-6;
}

function nonnegativeValue(id) {
  const value = Number($(id).value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function readParameters() {
  return {
    mode: $("mode").value,
    temperature: Number($("temperature").value),
    font: Number($("font").value),
    ion: $("ion").value,
    singleInside: positiveValue("singleInside"),
    singleOutside: positiveValue("singleOutside"),
    testVoltage: Number($("testVoltage").value),
    kIn: positiveValue("kIn"), kOut: positiveValue("kOut"), kP: nonnegativeValue("kP"),
    naIn: positiveValue("naIn"), naOut: positiveValue("naOut"), naP: nonnegativeValue("naP"),
    clIn: positiveValue("clIn"), clOut: positiveValue("clOut"), clP: nonnegativeValue("clP"),
  };
}

function calculate(parameters) {
  const ion = ionDefinitions[parameters.ion];
  const singlePotential = nernstPotential(
    ion.z, parameters.singleInside, parameters.singleOutside, parameters.temperature,
  );
  const potentials = {
    K: nernstPotential(1, parameters.kIn, parameters.kOut, parameters.temperature),
    Na: nernstPotential(1, parameters.naIn, parameters.naOut, parameters.temperature),
    Cl: nernstPotential(-1, parameters.clIn, parameters.clOut, parameters.temperature),
  };
  const permeabilitySum = parameters.kP + parameters.naP + parameters.clP;
  const mixedPotential = permeabilitySum > 0 ? goldmanPotential(parameters) : NaN;
  const voltages = Array.from({ length: 331 }, (_, i) => i - 180);
  const rawCurrents = { K: [], Na: [], Cl: [], total: [] };
  for (const voltage of voltages) {
    const k = constantFieldCurrent(1, parameters.kIn, parameters.kOut, parameters.kP, voltage, parameters.temperature);
    const na = constantFieldCurrent(1, parameters.naIn, parameters.naOut, parameters.naP, voltage, parameters.temperature);
    const cl = constantFieldCurrent(-1, parameters.clIn, parameters.clOut, parameters.clP, voltage, parameters.temperature);
    rawCurrents.K.push(k);
    rawCurrents.Na.push(na);
    rawCurrents.Cl.push(cl);
    rawCurrents.total.push(k + na + cl);
  }
  const currentScale = Math.max(
    1e-12,
    ...rawCurrents.K.map(Math.abs),
    ...rawCurrents.Na.map(Math.abs),
    ...rawCurrents.Cl.map(Math.abs),
    ...rawCurrents.total.map(Math.abs),
  );
  const currents = Object.fromEntries(
    Object.entries(rawCurrents).map(([key, values]) => [key, values.map((value) => value / currentScale)]),
  );
  return { parameters, ion, singlePotential, potentials, mixedPotential, voltages, rawCurrents, currents, currentScale };
}

function displayNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  const cleaned = Math.abs(value) < 0.05 ? 0 : value;
  return cleaned.toFixed(digits).replace("-", "−");
}

function concentrationText(value) {
  if (value < 0.001) return value.toExponential(2);
  if (value < 1) return Number(value.toPrecision(3)).toString();
  return Number(value.toPrecision(4)).toString();
}

function axisTitle(text, standoff = 4) {
  return { text, standoff };
}

function graphLayout(title, parameters, extra = {}) {
  return {
    title: { text: `<b>${title}</b>`, x: 0.5, xanchor: "center", y: 0.97 },
    font: { family: "Arial, sans-serif", size: parameters.font, color: "#293746" },
    margin: { l: 82, r: 25, t: 65, b: 68 },
    paper_bgcolor: "white",
    plot_bgcolor: "white",
    hoverlabel: { font: { size: Math.max(12, parameters.font - 2) } },
    ...extra,
  };
}

function save(blob, name) {
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Blob-based PNG export avoids Plotly data-URL download problems in Safari.
async function downloadPng(plot) {
  try {
    const url = await Plotly.toImage(plot, {
      format: "png",
      width: plot._fullLayout.width,
      height: plot._fullLayout.height,
      scale: 2,
    });
    const bytes = Uint8Array.from(atob(url.split(",")[1]), (character) => character.charCodeAt(0));
    save(new Blob([bytes], { type: "image/png" }), `NernstGoldman_${plot.id}.png`);
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

function currentDirection(value) {
  if (Math.abs(value) < 1e-7) return "zero";
  return value > 0 ? "outward" : "inward";
}

function renderNernst() {
  const p = state.parameters;
  const ion = state.ion;
  const equilibrium = state.singlePotential;
  const driving = p.testVoltage - equilibrium;
  const conventional = currentDirection(driving);
  const ionMovement = conventional === "zero" ? "no net movement" :
    (ion.z > 0 ? conventional : conventional === "outward" ? "inward" : "outward");

  $("readoutHeading").textContent = "Nernst result";
  $("primaryLabel").innerHTML = `E<sub>${ion.symbol}</sub>`;
  $("primaryValue").textContent = `${displayNumber(equilibrium)} mV`;
  $("secondaryLabel").textContent = "Driving force";
  $("secondaryValue").textContent = `${displayNumber(driving)} mV`;
  $("tertiaryLabel").textContent = "Conventional current";
  $("tertiaryValue").textContent = conventional === "zero" ? "Zero" : conventional[0].toUpperCase() + conventional.slice(1);
  $("movementText").innerHTML = conventional === "zero"
    ? `${ion.label} is at electrochemical equilibrium; I<sub>${ion.symbol}</sub> = 0.`
    : `${ion.label} movement is ${ionMovement}; conventional I<sub>${ion.symbol}</sub> is ${conventional}.`;
  $("conceptTitle").textContent = "One ion, one equilibrium potential";
  $("conceptText").innerHTML = `At E<sub>${ion.symbol}</sub>, the electrical and concentration forces on ${ion.label} balance.`;

  Plotly.react("potentialPlot", [
    {
      x: [equilibrium], y: [1], type: "scatter", mode: "markers+text",
      marker: { size: 18, color: colours[p.ion], line: { color: "white", width: 2 } },
      text: [`E<sub>${ion.symbol}</sub> = ${displayNumber(equilibrium)} mV`], textposition: "top center",
      hovertemplate: `${ion.label} equilibrium potential<br>%{x:.2f} mV<extra></extra>`,
      name: `E${ion.symbol}`,
    },
    {
      x: [p.testVoltage], y: [0], type: "scatter", mode: "markers+text",
      marker: { size: 18, color: colours.membrane, symbol: "diamond", line: { color: "white", width: 2 } },
      text: [`Test V<sub>m</sub> = ${displayNumber(p.testVoltage)} mV`], textposition: "top center",
      hovertemplate: "Test membrane voltage<br>%{x:.2f} mV<extra></extra>",
      name: "Test Vm",
    },
  ], graphLayout("Equilibrium potential", p, {
    showlegend: false,
    xaxis: { title: axisTitle("Voltage (mV)"), range: [-180, 150], zeroline: true, zerolinecolor: colours.zero, gridcolor: "#e1e7eb" },
    yaxis: { range: [-0.6, 1.6], tickvals: [0, 1], ticktext: ["Test V<sub>m</sub>", `E<sub>${ion.symbol}</sub>`], gridcolor: "#e1e7eb" },
  }), plotConfig);

  const voltages = state.voltages;
  const drivingForces = voltages.map((voltage) => voltage - equilibrium);
  Plotly.react("currentPlot", [
    {
      x: voltages, y: drivingForces, type: "scatter", mode: "lines",
      line: { color: colours[p.ion], width: 4 },
      hovertemplate: "V<sub>m</sub>: %{x:.1f} mV<br>Driving force: %{y:.1f} mV<extra></extra>",
      name: `${ion.label} driving force`,
    },
    {
      x: [p.testVoltage], y: [driving], type: "scatter", mode: "markers",
      marker: { color: colours.membrane, size: 14, line: { color: "white", width: 2 } },
      hovertemplate: "Test voltage<br>V<sub>m</sub>: %{x:.1f} mV<br>Driving force: %{y:.1f} mV<extra></extra>",
      name: "Test voltage",
    },
  ], graphLayout("Driving force and current direction", p, {
    xaxis: { title: axisTitle("Membrane voltage (mV)"), range: [-180, 150], gridcolor: "#e1e7eb" },
    yaxis: { title: axisTitle("V<sub>m</sub> − E<sub>ion</sub> (mV)"), zeroline: true, zerolinewidth: 2, zerolinecolor: colours.zero, gridcolor: "#e1e7eb" },
    legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.16, bgcolor: "rgba(255,255,255,.75)" },
  }), plotConfig);
}

function renderGoldman() {
  const p = state.parameters;
  const vm = state.mixedPotential;
  const values = [state.potentials.K, state.potentials.Na, state.potentials.Cl, vm];
  const labels = ["E<sub>K</sub>", "E<sub>Na</sub>", "E<sub>Cl</sub>", "V<sub>GHK</sub>"];
  const markerColours = [colours.K, colours.Na, colours.Cl, colours.membrane];
  const nearest = ["K", "Na", "Cl"].reduce((best, ion) =>
    Math.abs(state.potentials[ion] - vm) < Math.abs(state.potentials[best] - vm) ? ion : best, "K");
  const currentAtVm = {
    K: constantFieldCurrent(1, p.kIn, p.kOut, p.kP, vm, p.temperature),
    Na: constantFieldCurrent(1, p.naIn, p.naOut, p.naP, vm, p.temperature),
    Cl: constantFieldCurrent(-1, p.clIn, p.clOut, p.clP, vm, p.temperature),
  };
  const totalAtVm = currentAtVm.K + currentAtVm.Na + currentAtVm.Cl;
  const directions = ["K", "Na", "Cl"]
    .filter((ion) => p[ion.toLowerCase() + "P"] > 0)
    .map((ion) => `I<sub>${ion}</sub>: ${currentDirection(currentAtVm[ion])}`)
    .join("; ");

  $("readoutHeading").textContent = "Goldman result";
  $("primaryLabel").innerHTML = "V<sub>GHK</sub>";
  $("primaryValue").textContent = `${displayNumber(vm)} mV`;
  $("secondaryLabel").textContent = "Nearest equilibrium";
  $("secondaryValue").innerHTML = `E<sub>${nearest}</sub>`;
  $("tertiaryLabel").textContent = "Total relative current";
  $("tertiaryValue").textContent = Math.abs(totalAtVm) < state.currentScale * 1e-9 ? "≈ 0" : displayNumber(totalAtVm / state.currentScale, 3);
  $("movementText").innerHTML = `Conventional currents at V<sub>GHK</sub>: ${directions}. Their relative currents sum to zero.`;
  $("conceptTitle").textContent = "Several ions, one zero-current voltage";
  $("conceptText").innerHTML = "V<sub>GHK</sub> is set jointly by concentration gradients and relative permeabilities.";

  Plotly.react("potentialPlot", [{
    x: values,
    y: [3, 2, 1, 0],
    type: "scatter",
    mode: "markers+text",
    marker: { size: [16, 16, 16, 21], color: markerColours, symbol: ["circle", "circle", "circle", "diamond"], line: { color: "white", width: 2 } },
    text: values.map((value, i) => `${labels[i]} = ${displayNumber(value)} mV`),
    textposition: "top center",
    hovertemplate: "%{text}<extra></extra>",
  }], graphLayout("Ion and membrane potentials", p, {
    showlegend: false,
    xaxis: { title: axisTitle("Voltage (mV)"), range: [-180, 150], zeroline: true, zerolinecolor: colours.zero, gridcolor: "#e1e7eb" },
    yaxis: { range: [-0.6, 3.6], tickvals: [0, 1, 2, 3], ticktext: labels.slice().reverse(), gridcolor: "#e1e7eb" },
    shapes: [{ type: "line", x0: vm, x1: vm, y0: 0, y1: 1, yref: "paper", line: { color: colours.membrane, width: 2, dash: "dot" } }],
  }), plotConfig);

  const traces = [
    { key: "K", label: "I<sub>K</sub>", colour: colours.K, width: 2.2 },
    { key: "Na", label: "I<sub>Na</sub>", colour: colours.Na, width: 2.2 },
    { key: "Cl", label: "I<sub>Cl</sub>", colour: colours.Cl, width: 2.2 },
    { key: "total", label: "I<sub>total</sub>", colour: colours.total, width: 4 },
  ].map((trace) => ({
    x: state.voltages,
    y: state.currents[trace.key],
    type: "scatter",
    mode: "lines",
    name: trace.label,
    line: { color: trace.colour, width: trace.width },
    hovertemplate: `V<sub>m</sub>: %{x:.1f} mV<br>${trace.label}: %{y:.3f} normalized<extra></extra>`,
  }));
  Plotly.react("currentPlot", traces, graphLayout("Constant-field current balance", p, {
    xaxis: { title: axisTitle("Membrane voltage (mV)"), range: [-180, 150], gridcolor: "#e1e7eb" },
    yaxis: { title: axisTitle("Relative current (normalized)"), zeroline: true, zerolinewidth: 2, zerolinecolor: colours.zero, gridcolor: "#e1e7eb" },
    legend: { orientation: "h", x: 0.5, xanchor: "center", y: -0.16, bgcolor: "rgba(255,255,255,.78)" },
    shapes: [{ type: "line", x0: vm, x1: vm, y0: 0, y1: 1, yref: "paper", line: { color: colours.membrane, width: 2, dash: "dash" } }],
    annotations: [{ x: vm, y: 1, yref: "paper", text: `V<sub>GHK</sub> ${displayNumber(vm)} mV`, showarrow: false, yanchor: "bottom", font: { color: colours.membrane } }],
  }), plotConfig);
}

function renderUndefinedGoldman() {
  const p = state.parameters;
  $("readoutHeading").textContent = "Goldman result";
  $("primaryLabel").innerHTML = "V<sub>GHK</sub>";
  $("primaryValue").textContent = "Undefined";
  $("secondaryLabel").textContent = "Permeable ions";
  $("secondaryValue").textContent = "None";
  $("tertiaryLabel").textContent = "Total current";
  $("tertiaryValue").textContent = "Zero at every voltage";
  $("movementText").innerHTML = "With no permeable ions, this passive model cannot select a membrane voltage.";
  $("conceptTitle").textContent = "No permeability, no Goldman voltage";
  $("conceptText").textContent = "At least one ion must cross the membrane before a zero-current voltage is defined.";
  const annotation = {
    text: "Set at least one relative permeability above zero",
    x: 0.5, y: 0.5, xref: "paper", yref: "paper", showarrow: false,
  };
  const emptyLayout = (title) => graphLayout(title, p, {
    xaxis: { visible: false }, yaxis: { visible: false }, annotations: [annotation],
  });
  Plotly.react("potentialPlot", [], emptyLayout("Ion and membrane potentials"), plotConfig);
  Plotly.react("currentPlot", [], emptyLayout("Constant-field current balance"), plotConfig);
}

function render() {
  const p = state.parameters;
  const isGoldman = p.mode === "goldman";
  $("nernstControls").hidden = isGoldman;
  $("goldmanControls").hidden = !isGoldman;
  $("fontValue").textContent = `${p.font} px`;
  $("status").textContent = "";
  if (isGoldman && !Number.isFinite(state.mixedPotential)) {
    $("status").textContent = "At least one relative permeability must be greater than zero.";
    renderUndefinedGoldman();
    return;
  }
  if (isGoldman) renderGoldman();
  else renderNernst();
}

function update() {
  state = calculate(readParameters());
  render();
}

function scheduleUpdate() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    update();
  });
}

function setLogControl(id, value) {
  $(id).value = concentrationText(value);
  $(id + "Range").value = Math.log10(value);
}

function setLinearControl(id, value) {
  $(id).value = value;
  if ($(id + "Range")) $(id + "Range").value = value;
}

function connectLinear(id, marksCustom = false) {
  const number = $(id);
  const range = $(id + "Range");
  number.addEventListener("input", () => {
    if (range) range.value = number.value;
    if (marksCustom) $("preset").value = "custom";
    scheduleUpdate();
  });
  if (range) range.addEventListener("input", () => {
    number.value = range.value;
    if (marksCustom) $("preset").value = "custom";
    scheduleUpdate();
  });
}

function connectLog(id, marksCustom = false) {
  const number = $(id);
  const range = $(id + "Range");
  number.addEventListener("input", () => {
    const value = Number(number.value);
    if (Number.isFinite(value) && value > 0)
      range.value = Math.max(-6, Math.min(3, Math.log10(value)));
    if (marksCustom) $("preset").value = "custom";
    scheduleUpdate();
  });
  range.addEventListener("input", () => {
    number.value = concentrationText(10 ** Number(range.value));
    if (marksCustom) $("preset").value = "custom";
    scheduleUpdate();
  });
}

function loadSingleIon() {
  const ion = ionDefinitions[$("ion").value];
  setLogControl("singleInside", ion.inside);
  setLogControl("singleOutside", ion.outside);
  update();
}

function applyGoldmanPreset(name) {
  const preset = goldmanPresets[name];
  if (!preset) return;
  for (const [id, value] of Object.entries(preset)) {
    if (id.endsWith("In") || id.endsWith("Out")) setLogControl(id, value);
    else setLinearControl(id, value);
  }
}

function reset() {
  $("mode").value = defaults.mode;
  $("temperature").value = defaults.temperature;
  $("temperatureRange").value = defaults.temperature;
  $("font").value = defaults.font;
  $("ion").value = defaults.ion;
  $("testVoltage").value = defaults.testVoltage;
  $("testVoltageRange").value = defaults.testVoltage;
  const ion = ionDefinitions[defaults.ion];
  setLogControl("singleInside", ion.inside);
  setLogControl("singleOutside", ion.outside);
  $("preset").value = "rest";
  applyGoldmanPreset("rest");
  update();
}

function downloadData() {
  if (!state) return;
  const p = state.parameters;
  const lines = [
    "Nernst and Goldman Potentials - Version 0.9",
    `mode,${p.mode}`,
    `temperature_C,${p.temperature}`,
  ];
  if (p.mode === "nernst") {
    lines.push(
      `ion,${p.ion}`,
      `valence,${state.ion.z}`,
      `inside_mM,${p.singleInside}`,
      `outside_mM,${p.singleOutside}`,
      `equilibrium_potential_mV,${state.singlePotential.toFixed(8)}`,
      `test_membrane_voltage_mV,${p.testVoltage}`,
      `driving_force_mV,${(p.testVoltage - state.singlePotential).toFixed(8)}`,
      "",
      "membrane_voltage_mV,driving_force_mV",
      ...state.voltages.map((voltage) => `${voltage},${(voltage - state.singlePotential).toFixed(8)}`),
    );
  } else {
    lines.push(
      `K_inside_mM,${p.kIn}`, `K_outside_mM,${p.kOut}`, `K_relative_permeability,${p.kP}`,
      `Na_inside_mM,${p.naIn}`, `Na_outside_mM,${p.naOut}`, `Na_relative_permeability,${p.naP}`,
      `Cl_inside_mM,${p.clIn}`, `Cl_outside_mM,${p.clOut}`, `Cl_relative_permeability,${p.clP}`,
      `E_K_mV,${state.potentials.K.toFixed(8)}`,
      `E_Na_mV,${state.potentials.Na.toFixed(8)}`,
      `E_Cl_mV,${state.potentials.Cl.toFixed(8)}`,
      `V_GHK_mV,${state.mixedPotential.toFixed(8)}`,
      "",
      "membrane_voltage_mV,I_K_relative,I_Na_relative,I_Cl_relative,I_total_relative,I_K_normalized,I_Na_normalized,I_Cl_normalized,I_total_normalized",
      ...state.voltages.map((voltage, i) => [
        voltage,
        state.rawCurrents.K[i].toFixed(8), state.rawCurrents.Na[i].toFixed(8),
        state.rawCurrents.Cl[i].toFixed(8), state.rawCurrents.total[i].toFixed(8),
        state.currents.K[i].toFixed(8), state.currents.Na[i].toFixed(8),
        state.currents.Cl[i].toFixed(8), state.currents.total[i].toFixed(8),
      ].join(",")),
    );
  }
  save(
    new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" }),
    "NernstGoldman_data.csv",
  );
}

connectLinear("temperature");
connectLinear("testVoltage");
connectLog("singleInside");
connectLog("singleOutside");
for (const id of ["kIn", "kOut", "naIn", "naOut", "clIn", "clOut"]) connectLog(id, true);
for (const id of ["kP", "naP", "clP"]) connectLinear(id, true);
$("font").addEventListener("input", scheduleUpdate);
$("mode").addEventListener("change", update);
$("ion").addEventListener("change", loadSingleIon);
$("preset").addEventListener("change", () => {
  applyGoldmanPreset($("preset").value);
  update();
});
$("reset").addEventListener("click", reset);
$("download").addEventListener("click", downloadData);
reset();
