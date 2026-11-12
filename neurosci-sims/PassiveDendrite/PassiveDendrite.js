/*
 * Passive Dendrite and Cable Filtering
 *
 * Created 21 October 2026, entirely "vibe coded" by OpenAI Codex
 * (a GPT-6-based coding assistant), under P. Jesper Sjöström's guidance.
 * The design and interpretation follow classical passive-cable work by
 * Wilfrid Rall (1959, 1962, 1967; references and links are in the webpage).
 *
 * This teaching model discretizes a uniform passive dendrite attached to a
 * finite spherical soma. An implicit compartmental solution keeps long runs
 * stable while the interface exposes the familiar cable parameters.
 */

"use strict";

const COLORS = { A: "#187d72", B: "#d36a2d", input: "#a34086", record: "#5d4da0", soma: "#38464d" };
const SOMA_DIAMETER_UM = 20;
const COMPARTMENTS = 80;
const DT_MS = 0.1;
const STORE_EVERY = 5;

const defaults = {
  fontSize: 18, length: 1000, rest: -70, input: 800, record: 500,
  waveform: "alpha", amplitude: 50, start: 20, width: 3, run: 200,
  snapshot: 30, compareB: false,
  diameterA: 2, rmA: 20, cmA: 1, raA: 150,
  diameterB: 5, rmB: 20, cmB: 1, raB: 150
};

const specs = {
  length: [200, 2000, 50], rest: [-90, -50, 1], input: [0, 1000, 10], record: [0, 1000, 10],
  amplitude: [1, 500, 1], start: [0, 100, 1], width: [0.5, 50, 0.5], run: [50, 500, 10],
  snapshot: [0, 200, 0.5], diameterA: [0.2, 10, 0.1], rmA: [1, 100, 1], cmA: [0.2, 3, 0.1], raA: [50, 300, 5],
  diameterB: [0.2, 10, 0.1], rmB: [1, 100, 1], cmB: [0.2, 3, 0.1], raB: [50, 300, 5]
};

const $ = id => document.getElementById(id);
const state = { ...defaults, resultA: null, resultB: null, selectedTrace: null, animating:false, animationPreview:false };
let simulationTimer = null;
let animationFrame = null;
let previousAnimationTime = null;

function roundForStep(value, step) {
  const decimals = (String(step).split(".")[1] || "").length;
  return Number(Number(value).toFixed(decimals));
}

function bindPair(key) {
  const number = $(key + "Number");
  const range = $(key + "Range");
  const [min, max, step] = specs[key];
  for (const element of [number, range]) {
    element.min = min; element.max = max; element.step = step;
  }
  number.value = range.value = state[key];
  const update = event => {
    const source = event.currentTarget;
    let value = Math.min(Number(source.max), Math.max(Number(source.min), Number(source.value)));
    value = roundForStep(value, Number(source.step));
    state[key] = value;
    number.value = range.value = value;
    if (key === "length") constrainLocations();
    if (key === "run") constrainSnapshot();
    if (key === "snapshot") {
      stopAnimation(true);
      renderTraces(); renderProfile(); return;
    }
    scheduleSimulation();
  };
  number.addEventListener("change", update);
  range.addEventListener("input", update);
}

function constrainLocations() {
  for (const key of ["input", "record"]) {
    const number = $(key + "Number");
    const range = $(key + "Range");
    number.max = range.max = state.length;
    if (state[key] > state.length) state[key] = state.length;
    number.value = range.value = state[key];
  }
}

function constrainSnapshot() {
  $("snapshotNumber").max = $("snapshotRange").max = state.run;
  if (state.snapshot > state.run) state.snapshot = state.run;
  $("snapshotNumber").value = $("snapshotRange").value = state.snapshot;
}

function inputCurrentPA(timeMs) {
  if (timeMs < state.start) return 0;
  if (state.waveform === "square") return timeMs <= state.start + state.width ? state.amplitude : 0;
  const x = (timeMs - state.start) / state.width;
  return state.amplitude * x * Math.exp(1 - x);
}

function cableConstants(model) {
  const dCm = model.diameter * 1e-4;
  const rmOhmCm2 = model.rm * 1000;
  return {
    lambdaUm: Math.sqrt(dCm * rmOhmCm2 / (4 * model.ra)) * 1e4,
    tauMs: rmOhmCm2 * model.cm / 1000
  };
}

function prepareTridiagonal(model) {
  const nodeCount = COMPARTMENTS + 1;
  const dxCm = (state.length / COMPARTMENTS) * 1e-4;
  const dCm = model.diameter * 1e-4;
  const dendArea = Math.PI * dCm * dxCm;
  const somaDCm = SOMA_DIAMETER_UM * 1e-4;
  const somaArea = Math.PI * somaDCm * somaDCm;
  const crossArea = Math.PI * dCm * dCm / 4;
  const gAx = crossArea / (model.ra * dxCm) * 1000;
  const rmOhmCm2 = model.rm * 1000;
  const areas = new Float64Array(nodeCount);
  areas[0] = somaArea;
  for (let i = 1; i < nodeCount; i++) areas[i] = dendArea;
  const capacitance = Float64Array.from(areas, area => model.cm * area);
  const leak = Float64Array.from(areas, area => area / rmOhmCm2 * 1000);
  const a = new Float64Array(nodeCount), b = new Float64Array(nodeCount), c = new Float64Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) {
    const left = i > 0 ? gAx : 0;
    const right = i < nodeCount - 1 ? gAx : 0;
    a[i] = -left;
    c[i] = -right;
    b[i] = capacitance[i] / DT_MS + leak[i] + left + right;
  }
  const cPrime = new Float64Array(nodeCount);
  const denominators = new Float64Array(nodeCount);
  denominators[0] = b[0];
  cPrime[0] = c[0] / denominators[0];
  for (let i = 1; i < nodeCount; i++) {
    denominators[i] = b[i] - a[i] * cPrime[i - 1];
    cPrime[i] = i < nodeCount - 1 ? c[i] / denominators[i] : 0;
  }
  return { a, cPrime, denominators, capacitance, leak };
}

function simulate(model) {
  const n = COMPARTMENTS + 1;
  const matrix = prepareTridiagonal(model);
  let voltage = new Float64Array(n); voltage.fill(state.rest);
  const rhs = new Float64Array(n), dPrime = new Float64Array(n);
  let next = new Float64Array(n);
  const inputIndex = Math.round(state.input / state.length * COMPARTMENTS);
  const recordIndex = Math.round(state.record / state.length * COMPARTMENTS);
  const steps = Math.round(state.run / DT_MS);
  const positions = Array.from({ length:n }, (_, i) => i * state.length / COMPARTMENTS);
  const times = [], soma = [], record = [], input = [], injected = [], profiles = [];
  let globalMin = state.rest, globalMax = state.rest;
  const store = step => {
    times.push(step * DT_MS); soma.push(voltage[0]); record.push(voltage[recordIndex]); input.push(voltage[inputIndex]);
    injected.push(inputCurrentPA(step * DT_MS));
    const profile = Array.from(voltage);
    profiles.push(profile);
    for (const value of profile) {
      if (value < globalMin) globalMin = value;
      if (value > globalMax) globalMax = value;
    }
  };
  store(0);
  for (let step = 1; step <= steps; step++) {
    const currentUA = inputCurrentPA(step * DT_MS) * 1e-6;
    for (let i = 0; i < n; i++) rhs[i] = matrix.capacitance[i] / DT_MS * voltage[i] + matrix.leak[i] * state.rest;
    rhs[inputIndex] += currentUA;
    dPrime[0] = rhs[0] / matrix.denominators[0];
    for (let i = 1; i < n; i++) dPrime[i] = (rhs[i] - matrix.a[i] * dPrime[i - 1]) / matrix.denominators[i];
    next[n - 1] = dPrime[n - 1];
    for (let i = n - 2; i >= 0; i--) next[i] = dPrime[i] - matrix.cPrime[i] * next[i + 1];
    const swap = voltage; voltage = next; next = swap;
    if (step % STORE_EVERY === 0 || step === steps) store(step);
  }
  const constants = cableConstants(model);
  const peakInfo = trace => {
    let peak = -Infinity, index = 0;
    trace.forEach((value, i) => { const delta = value - state.rest; if (delta > peak) { peak = delta; index = i; } });
    const half = peak / 2;
    let first = 0, last = 0, found = false;
    trace.forEach((value, i) => {
      if (value - state.rest >= half) { if (!found) first = i; last = i; found = true; }
    });
    return { peak, time:times[index], width:found ? times[last] - times[first] : 0 };
  };
  const inputPeak = peakInfo(input), somaPeak = peakInfo(soma);
  return { model, positions, times, soma, record, input, injected, profiles, inputIndex, recordIndex,
    globalMin, globalMax,
    constants, metrics: { attenuation: inputPeak.peak > 0 ? 100 * somaPeak.peak / inputPeak.peak : 0,
      delay: somaPeak.time - inputPeak.time,
      widthRatio: inputPeak.width > 0 ? somaPeak.width / inputPeak.width : 0,
      somaPeak:somaPeak.peak, inputPeak:inputPeak.peak } };
}

function scheduleSimulation() {
  stopAnimation(true);
  clearTimeout(simulationTimer);
  simulationTimer = setTimeout(runSimulation, 35);
}

function currentModels() {
  return {
    A: { diameter:state.diameterA, rm:state.rmA, cm:state.cmA, ra:state.raA },
    B: { diameter:state.diameterB, rm:state.rmB, cm:state.cmB, ra:state.raB }
  };
}

function runSimulation() {
  stopAnimation(true);
  const models = currentModels();
  state.resultA = simulate(models.A);
  state.resultB = state.compareB ? simulate(models.B) : null;
  updateReadouts(); renderAll();
}

function formatNumber(value, digits=2) { return Number(value).toLocaleString(undefined, { maximumFractionDigits:digits }); }

function updateReadouts() {
  const value = (result, key) => {
    if (!result) return "—";
    const c = result.constants, m = result.metrics;
    const values = {
      lambda: `${formatNumber(c.lambdaUm, 0)} µm`,
      tau: `${formatNumber(c.tauMs, 1)} ms`,
      electrotonicLength: formatNumber(state.length / c.lambdaUm, 2),
      inputDistance: formatNumber(state.input / c.lambdaUm, 2),
      attenuation: `${formatNumber(m.attenuation, 1)}%`,
      delay: `${formatNumber(m.delay, 1)} ms`,
      width: `${formatNumber(m.widthRatio, 2)}×`
    };
    return values[key];
  };
  const rows = [
    ["λ","lambda"], ["τ<sub>m</sub>","tau"], ["L/λ","electrotonicLength"],
    ["Input distance/λ","inputDistance"], ["Soma/input peak","attenuation"],
    ["Peak delay","delay"], ["Soma/input width","width"]
  ];
  $("combinedReadout").innerHTML = `<span class="metric-heading">Measure</span>
    <span class="metric-heading metric-value model-a-value">A</span>
    <span class="metric-heading metric-value model-b-value">B</span>` + rows.map(([label,key]) =>
      `<span>${label}</span><span class="metric-value model-a-value">${value(state.resultA,key)}</span><span class="metric-value model-b-value">${value(state.resultB,key)}</span>`
    ).join("");
}

function graphConfig(filename) {
  return { responsive:true, displaylogo:false, modeBarButtonsToRemove:["toImage","lasso2d","select2d"],
    modeBarButtonsToAdd:[{ name:"Download plot as PNG", icon:Plotly.Icons.camera, click:gd => downloadPlotPNG(gd, filename) }] };
}

function downloadPlotPNG(plot, filename) {
  Plotly.toImage(plot, { format:"png", width:Math.max(1200, plot.clientWidth * 2), height:Math.max(700, plot.clientHeight * 2), scale:1 })
    .then(url => fetch(url)).then(response => response.blob()).then(blob => {
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${filename}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
}

function baseLayout(title, xTitle, yTitle) {
  const fs = state.fontSize;
  return { title:{ text:`<b>${title}</b>`, font:{size:fs+4}, y:.96 }, paper_bgcolor:"#fff", plot_bgcolor:"#fff",
    font:{ family:"Arial, sans-serif", size:fs, color:"#304047" }, margin:{l:72,r:22,t:62,b:64},
    xaxis:{title:{text:xTitle,standoff:8},gridcolor:"#dfe7e5",zerolinecolor:"#82928f"},
    yaxis:{title:{text:yTitle,standoff:7},gridcolor:"#dfe7e5",zerolinecolor:"#82928f"},
    legend:{orientation:"h",x:.5,xanchor:"center",y:1.01,yanchor:"bottom",bgcolor:"rgba(255,255,255,.75)"}, hovermode:"closest" };
}

function renderSchematic() {
  const rows = state.resultB ? [{result:state.resultA,y:1,label:"A",color:COLORS.A},{result:state.resultB,y:0,label:"B",color:COLORS.B}] : [{result:state.resultA,y:.5,label:"A",color:COLORS.A}];
  const traces = [], annotations = [];
  rows.forEach(row => {
    traces.push({ x:[0,state.length], y:[row.y,row.y], mode:"lines", line:{color:row.color,width:Math.max(4,Math.min(18,row.result.model.diameter*2.1))}, hovertemplate:`Dendrite ${row.label}<br>x=%{x:.0f} µm<extra></extra>`, showlegend:false });
    traces.push({ x:[0], y:[row.y], mode:"markers", marker:{color:COLORS.soma,size:28,symbol:"circle"}, hovertemplate:`20 µm soma<extra></extra>`,showlegend:false });
    traces.push({ x:[state.input], y:[row.y], mode:"markers+text", text:["Input"], textposition:"top center",
      textfont:{color:COLORS.input,size:Math.max(11,state.fontSize-3)}, marker:{color:COLORS.input,size:14,symbol:"triangle-down"},
      hovertemplate:`Input location: ${state.input} µm<extra></extra>`,showlegend:false });
    traces.push({ x:[state.record], y:[row.y], mode:"markers+text", text:["Dendritic recording"], textposition:"top center",
      textfont:{color:COLORS.record,size:Math.max(11,state.fontSize-3)}, marker:{color:COLORS.record,size:13,symbol:"diamond"},
      hovertemplate:`Dendritic recording: ${state.record} µm<extra></extra>`,showlegend:false });
    annotations.push({x:-.052*state.length,y:row.y,text:`<b>${row.label}</b>`,showarrow:false,font:{color:row.color,size:state.fontSize}});
  });
  const layout = { ...baseLayout("Cable geometry", "Distance from soma (µm)", ""), margin:{l:78,r:20,t:54,b:48},
    yaxis:{visible:false,range:state.resultB?[-.5,1.5]:[-.1,1.1]}, xaxis:{title:{text:"Distance from soma (µm)",standoff:5},range:[-.075*state.length,1.075*state.length],gridcolor:"#e3e9e7",zeroline:false},
    annotations, legend:{orientation:"h"}, shapes:[] };
  Plotly.react("schematicPlot", traces, layout, graphConfig("PassiveDendrite_schematic"));
}

function modelTraceSet(result, letter, color, limit) {
  const common = { type:"scatter",mode:"lines",legendgroup:letter,hovertemplate:"%{x:.1f} ms<br>%{y:.3f} mV<extra></extra>" };
  const x = result.times.slice(0,limit);
  return [
    {...common,x,y:result.input.slice(0,limit),name:`${letter}: input`,line:{color,width:2,dash:"dot"}},
    {...common,x,y:result.record.slice(0,limit),name:`${letter}: dendrite`,line:{color,width:2,dash:"dash"}},
    {...common,x,y:result.soma.slice(0,limit),name:`${letter}: soma`,line:{color,width:3}}
  ];
}

function renderTraces() {
  const limit = state.resultA.times.length;
  let traces = modelTraceSet(state.resultA,"A",COLORS.A,limit);
  if (state.resultB) traces = traces.concat(modelTraceSet(state.resultB,"B",COLORS.B,limit));
  const layout = baseLayout("Voltage responses", "Time (ms)", "V<sub>m</sub> (mV)");
  layout.margin = {l:78,r:20,t:92,b:64};
  layout.legend = {orientation:"v",x:.98,xanchor:"right",y:.87,yanchor:"top",bgcolor:"rgba(255,255,255,.78)"};
  layout.shapes = [
    {type:"line",x0:state.start,x1:state.start,yref:"paper",y0:0,y1:1,line:{color:COLORS.input,width:1.5,dash:"dash"}},
    {type:"line",x0:state.snapshot,x1:state.snapshot,yref:"paper",y0:0,y1:1,line:{color:"#37474f",width:2}}
  ];
  layout.annotations = [
    {x:state.start,y:1,xref:"x",yref:"paper",text:"input",showarrow:false,yshift:10,font:{color:COLORS.input,size:Math.max(11,state.fontSize-2)}},
    {x:state.snapshot,y:1,xref:"x",yref:"paper",text:`${state.snapshot.toFixed(1)} ms`,showarrow:false,yshift:10,font:{color:"#37474f",size:Math.max(11,state.fontSize-3)}}
  ];
  Plotly.react("tracePlot", traces, layout, graphConfig("PassiveDendrite_voltageTraces"));
}

function setSnapshot(value) {
  state.snapshot = Math.min(state.run, Math.max(0,value));
  $("snapshotNumber").value = $("snapshotRange").value = roundForStep(state.snapshot, 0.5);
}

function stopAnimation(clearPreview=false) {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  previousAnimationTime = null;
  state.animating = false;
  if (clearPreview) state.animationPreview = false;
  const button = $("animationButton");
  if (button) button.textContent = state.animationPreview ? "Resume" : "Animate";
}

function animationTick(timestamp) {
  if (!state.animating) return;
  if (previousAnimationTime === null) previousAnimationTime = timestamp;
  const elapsed = timestamp - previousAnimationTime;
  previousAnimationTime = timestamp;
  setSnapshot(state.snapshot + elapsed * state.run / 8000);
  renderTraces(); renderProfile();
  if (state.snapshot >= state.run) {
    stopAnimation(true);
    renderTraces();
    return;
  }
  animationFrame = requestAnimationFrame(animationTick);
}

function toggleAnimation() {
  if (state.animating) {
    state.animationPreview = true;
    stopAnimation(false);
    return;
  }
  if (state.snapshot >= state.run - 0.001) setSnapshot(0);
  state.animating = true;
  state.animationPreview = true;
  previousAnimationTime = null;
  $("animationButton").textContent = "Pause";
  renderTraces(); renderProfile();
  animationFrame = requestAnimationFrame(animationTick);
}

function nearestProfile(result) {
  let index = Math.round(state.snapshot / (DT_MS * STORE_EVERY));
  index = Math.min(result.profiles.length - 1, Math.max(0,index));
  return { voltage:result.profiles[index], time:result.times[index] };
}

function renderProfile() {
  if (!state.resultA) return;
  const traces = [];
  const a = nearestProfile(state.resultA);
  traces.push({x:state.resultA.positions,y:a.voltage,type:"scatter",mode:"lines",name:"A",line:{color:COLORS.A,width:3},hovertemplate:"x=%{x:.0f} µm<br>V=%{y:.3f} mV<extra></extra>"});
  let displayTime = a.time;
  if (state.resultB) {
    const b = nearestProfile(state.resultB); displayTime = b.time;
    traces.push({x:state.resultB.positions,y:b.voltage,type:"scatter",mode:"lines",name:"B",line:{color:COLORS.B,width:3},hovertemplate:"x=%{x:.0f} µm<br>V=%{y:.3f} mV<extra></extra>"});
  }
  const layout = baseLayout(`Spatial profile at ${displayTime.toFixed(1)} ms`, "Distance from soma (µm)", "V<sub>m</sub> (mV)");
  layout.margin = {l:78,r:20,t:76,b:64};
  layout.xaxis.range = [-.075*state.length,1.075*state.length];
  const extrema = [state.resultA.globalMin,state.resultA.globalMax];
  if (state.resultB) extrema.push(state.resultB.globalMin,state.resultB.globalMax);
  const globalMin = Math.min(...extrema), globalMax = Math.max(...extrema);
  const padding = Math.max(0.05, (globalMax-globalMin)*0.04);
  layout.yaxis.range = [globalMin-padding,globalMax+padding];
  layout.shapes = [
    {type:"line",x0:0,x1:state.length,y0:state.rest,y1:state.rest,line:{color:"#87928f",width:1,dash:"dash"}},
    {type:"line",x0:state.input,x1:state.input,yref:"paper",y0:0,y1:1,line:{color:COLORS.input,width:1,dash:"dot"}},
    {type:"line",x0:state.record,x1:state.record,yref:"paper",y0:0,y1:1,line:{color:COLORS.record,width:1,dash:"dot"}}
  ];
  Plotly.react("profilePlot", traces, layout, graphConfig("PassiveDendrite_spatialProfile"));
}

function renderAll() { renderSchematic(); renderTraces(); renderProfile(); }

function downloadData() {
  const lines = [];
  lines.push("Passive Dendrites and Cable Filtering");
  lines.push(`waveform,${state.waveform}`); lines.push(`length_um,${state.length}`); lines.push(`resting_V_mV,${state.rest}`);
  lines.push(`input_x_um,${state.input}`); lines.push(`recording_x_um,${state.record}`); lines.push(`input_amplitude_pA,${state.amplitude}`);
  lines.push(`input_start_ms,${state.start}`); lines.push(`${state.waveform === "alpha" ? "input_tau_ms" : "input_duration_ms"},${state.width}`);
  for (const letter of state.resultB ? ["A","B"] : ["A"]) {
    const r = letter === "A" ? state.resultA : state.resultB;
    lines.push(`${letter}_diameter_um,${r.model.diameter}`); lines.push(`${letter}_Rm_kohm_cm2,${r.model.rm}`);
    lines.push(`${letter}_Cm_uF_cm2,${r.model.cm}`); lines.push(`${letter}_Ra_ohm_cm,${r.model.ra}`);
    lines.push(`${letter}_lambda_um,${r.constants.lambdaUm}`); lines.push(`${letter}_tau_m_ms,${r.constants.tauMs}`);
  }
  lines.push("");
  const header = ["time_ms","input_current_pA","A_soma_mV","A_dendrite_mV","A_input_mV"];
  if (state.resultB) header.push("B_soma_mV","B_dendrite_mV","B_input_mV");
  lines.push(header.join(","));
  state.resultA.times.forEach((time,i) => {
    const row = [time,state.resultA.injected[i],state.resultA.soma[i],state.resultA.record[i],state.resultA.input[i]];
    if (state.resultB) row.push(state.resultB.soma[i],state.resultB.record[i],state.resultB.input[i]);
    lines.push(row.join(","));
  });
  lines.push("");
  const a = nearestProfile(state.resultA), profileHeader = ["profile_x_um",`A_profile_mV_at_${a.time.toFixed(1)}ms`];
  const b = state.resultB ? nearestProfile(state.resultB) : null;
  if (b) profileHeader.push(`B_profile_mV_at_${b.time.toFixed(1)}ms`);
  lines.push(profileHeader.join(","));
  state.resultA.positions.forEach((x,i) => { const row=[x,a.voltage[i]]; if(b) row.push(b.voltage[i]); lines.push(row.join(",")); });
  const blob = new Blob([lines.join("\r\n") + "\r\n"], {type:"text/csv;charset=utf-8"});
  const link = document.createElement("a"); link.href=URL.createObjectURL(blob); link.download="PassiveDendrite_data.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href),1000);
}

function applyDefaults() {
  stopAnimation(true);
  Object.assign(state, defaults);
  Object.keys(specs).forEach(key => { $(key+"Number").value=$(key+"Range").value=state[key]; });
  $("fontSize").value=state.fontSize; $("fontSizeValue").textContent=`${state.fontSize} px`;
  $("waveform").value=state.waveform; $("compareB").checked=state.compareB; $("modelBControls").hidden=true;
  $("widthLabel").textContent="Time constant τ (ms)"; constrainLocations(); constrainSnapshot(); runSimulation();
}

function initialize() {
  Object.keys(specs).forEach(bindPair);
  constrainLocations(); constrainSnapshot();
  $("waveform").addEventListener("change", event => { state.waveform=event.target.value; $("widthLabel").textContent=state.waveform === "alpha" ? "Time constant τ (ms)" : "Duration (ms)"; scheduleSimulation(); });
  $("compareB").addEventListener("change", event => { state.compareB=event.target.checked; $("modelBControls").hidden=!state.compareB; runSimulation(); });
  $("fontSize").addEventListener("input", event => { state.fontSize=Number(event.target.value); $("fontSizeValue").textContent=`${state.fontSize} px`; renderAll(); });
  $("resetButton").addEventListener("click", applyDefaults);
  $("downloadButton").addEventListener("click", downloadData);
  $("animationButton").addEventListener("click", toggleAnimation);
  runSimulation();
}

initialize();
