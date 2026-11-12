/*
 * Channel Currents & I–V Curves — Version 0.6, 17 October 2026.
 * Entirely "vibe coded" by OpenAI Codex (GPT-6-based coding assistant),
 * under the guidance of P. Jesper Sjöström for PHGY 311.
 * Classical squid-axon kinetics, not a fit to a particular mammalian channel.
 * Hodgkin & Huxley (1952), J Physiol 117:500–544.
 * https://doi.org/10.1113/jphysiol.1952.sp004764
 * Na and delayed K: Hodgkin AL & Huxley AF (1952),
 * "A quantitative description of membrane current and its application to
 * conduction and excitation in nerve", J Physiol 117:500–544 (DOI above).
 * AMPAR and NMDAR gating: Destexhe A, Mainen ZF & Sejnowski TJ (1994),
 * "An efficient method for computing synaptic conductances based on a kinetic
 * model of receptor binding", Neural Comput 6:14–18.
 * https://doi.org/10.1162/neco.1994.6.1.14
 * Specific reduced receptor rates are tabulated in the 1998 chapter below.
 * NMDAR Mg block: Jahr CE & Stevens CF (1990), "Voltage dependence of
 * NMDA-activated macroscopic conductances predicted by single-channel
 * kinetics", J Neurosci 10:3178–3182. https://doi.org/10.1523/JNEUROSCI.10-09-03178.1990
 * CP-AMPAR block: Washburn et al. (1997), J Neurosci 17:9393–9406.
 * https://pubmed.ncbi.nlm.nih.gov/9390995/
 * Woodhull-type approximation B=1/[1+(PA/K0)exp(V/k)]. K0=20 µM,
 * k=15 mV are illustrative teaching parameters, NOT a fit from the paper.
 * Intended qualitative range: -100 to +50 mV. No permeant-block relief,
 * double rectification, use dependence, or Ca-specific flux is modelled.
 * Muscle nAChR: adapted from Land, Salpeter & Salpeter (1981),
 * PNAS 78:7200–7204. https://doi.org/10.1073/pnas.78.11.7200
 * C <-> AC <-> A2C <-> O, two equivalent binding sites, deterministic.
 * Uses Table 3B reversible-binding assumption: kon=40 /mM/ms,
 * Kd=0.04 mM -> koff=1.6 /ms; Table 2 relaxation=25 /ms and
 * Table 3B open fraction=0.7 -> opening=17.5, closing=7.5 /ms.
 * This is a reduced teaching adaptation of lizard muscle receptor kinetics:
 * no cleft diffusion, ACh breakdown, desensitisation, agonist block,
 * or voltage-dependent gating. Open-channel current is ohmic.
 * Receptor g defaults are pedagogical amplitude scales, not experimental fits.
 * Receptors: reduced two-state Destexhe, Mainen & Sejnowski (1998) model.
 * https://papers.cnl.salk.edu/PDFs/Kinetic%20Models%20of%20Synaptic%20Transmission%201998-3229.pdf
 * AMPA alpha=1.1, beta=0.19; NMDA alpha=0.072, beta=0.0066.
 * GABAA: alpha=5, beta=0.18 (1998 chapter, section 1.4.3).
 * Effective E_GABA is adjustable; Cl and bicarbonate fluxes are not separated.
 * Kir2.1: steady-state two-mode spermine block, Ishihara & Ehara (2004),
 * J Physiol 556:61–78, eqs. 3–4 and Fig. 3. Published fitted parameters
 * are also stated explicitly in Ishihara & Yan (2007), Fig. 3 caption.
 * https://doi.org/10.1113/jphysiol.2003.055434
 * https://doi.org/10.1113/jphysiol.2007.136028
 * Kd_high=0.7 exp(-u/4.8) µM, Kd_low=40 exp(-u/9.1) µM;
 * high/low fractions 0.9/0.1; fixed spermine=5 µM, no Mg block.
 * u=V-E_K: translating the original near-zero-reversal fit follows the
 * parallel shifts reported in 2007. This is not a full ion-concentration model.
 * Original fit: mouse Kir2.1 in HEK293T inside-out patches, symmetric high K,
 * 24–26 C. Equilibrium is applied instantly here: no block/unblock transients.
 * Conductance density remains a teaching scale, not a measured channel density.
 * HCN1: Altomare et al. (2001), J Gen Physiol 117:519–532,
 * https://doi.org/10.1085/jgp.117.6.519 — Table 2, Fig. 2, Appendix.
 * Ten deterministic populations; refined parameters (not Table 1 guesses).
 * We follow Fig. 2 / detailed balance; the HTML rendering of Table A1 has
 * inconsistent entries. Native Ih, cAMP modulation and ion concentrations
 * are not simulated. Erev=-30 mV and g=1 are adjustable teaching defaults.
 * Alpha units: /mM/ms; beta units: /ms. No desensitisation is represented.
 * NMDA block: Jahr & Stevens (1990), https://pubmed.ncbi.nlm.nih.gov/1697902/
 * Instantaneous equilibrium Mg block; co-agonist assumed sufficient.
 * HH retains 6.3 C kinetics; receptor rates are fixed literature teaching
 * presets, not temperature-matched to HH and not a specific subunit fit.
 * Uses the modern absolute-voltage convention (rest approximately −65 mV).
 *
 * Contribution clarification, 17 October 2026: P. Jesper Sjöström directed
 * the scientific and teaching design, supplied requirements, and reviewed
 * iterative revisions. OpenAI Codex generated the implementation and assisted
 * with debugging and checks. This is separate from the student implementations.
 */
"use strict";
const HHModel = (() => {
  // Stable evaluation of x/(1-exp(-x)), including the removable singularity.
  function ratio(x) {
    return Math.abs(x) < 1e-7 ? 1 + x / 2 + (x * x) / 12 : x / -Math.expm1(-x);
  }
  function kinetics(v) {
    const rates = [
      [ratio((v + 40) / 10), 4 * Math.exp(-(v + 65) / 18)],
      [0.07 * Math.exp(-(v + 65) / 20), 1 / (1 + Math.exp(-(v + 35) / 10))],
      [0.1 * ratio((v + 55) / 10), 0.125 * Math.exp(-(v + 65) / 80)],
    ];
    return rates.map(([a, b]) => ({ inf: a / (a + b), tau: 1 / (a + b) }));
  }
  function equilibrium(v) {
    return kinetics(v).map((r) => r.inf);
  }
  // Under a constant clamp voltage the gate equations have exact solutions.
  function gates(initial, v, t) {
    return kinetics(v).map((r, i) => r.inf + (initial[i] - r.inf) * Math.exp(-t / r.tau));
  }
  function current(channel, conductance, reversal, v, state) {
    const [m, h, n] = state;
    return conductance * (channel === "Na" ? m * m * m * h : n ** 4) * (v - reversal);
  }
  function isReceptor(channel) {
    return ["AMPA", "CPAMPA", "NMDA", "nAChR", "GABA"].includes(channel);
  }
  // Published equilibrium fit; the two modes contribute in parallel.
  // Keep concentration explicit internally for validation; the UI fixes it at 5 µM.
  const kirParameters = Object.freeze({
    spermine: 5,
    highFraction: 0.9,
    highKd: 0.7,
    lowKd: 40,
    highSlope: 4.8,
    lowSlope: 9.1,
  });
  function kirBlock(v, reversal, spermine = kirParameters.spermine) {
    const u = v - reversal;
    const highKd = kirParameters.highKd * Math.exp(-u / kirParameters.highSlope);
    const lowKd = kirParameters.lowKd * Math.exp(-u / kirParameters.lowSlope);
    return (
      kirParameters.highFraction / (1 + spermine / highKd) +
      (1 - kirParameters.highFraction) / (1 + spermine / lowKd)
    );
  }
  function polyamineBlock(v, pa) {
    return 1 / (1 + (pa / 20) * Math.exp(v / 15));
  }
  // Integrate population fractions, not individual random channel openings.
  function nachrDerivative(state, ach) {
    const [c, ac, a2c, o] = state;
    const binding1 = 80 * ach * c - 1.6 * ac;
    const binding2 = 40 * ach * ac - 3.2 * a2c;
    const opening = 17.5 * a2c - 7.5 * o;
    return [-binding1, binding1 - binding2, binding2 - opening, opening];
  }
  function advanceNachr(state, duration, ach) {
    const steps = Math.ceil(duration / 0.001);
    if (!steps) return state;
    const dt = duration / steps;
    for (let i = 0; i < steps; i++) {
      const k1 = nachrDerivative(state, ach);
      const k2 = nachrDerivative(
        state.map((v, j) => v + (dt * k1[j]) / 2),
        ach,
      );
      const k3 = nachrDerivative(
        state.map((v, j) => v + (dt * k2[j]) / 2),
        ach,
      );
      const k4 = nachrDerivative(
        state.map((v, j) => v + dt * k3[j]),
        ach,
      );
      state = state.map((v, j) => v + (dt * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) / 6);
    }
    return state;
  }
  let nachrCache = { key: null, open: null };
  // Gates are voltage-independent in this teaching preset: reuse across sweeps.
  function nachrPopulation(times, ach, pulse) {
    const key = JSON.stringify([times.length, times[times.length - 1], ach, pulse, times]);
    if (key === nachrCache.key) return nachrCache.open;
    let state = [1, 0, 0, 0],
      previous = 0;
    const transitions = new Map();
    const advance = (dt, concentration) => {
      if (!dt) return;
      dt = Number(dt.toFixed(9));
      const key = concentration + ":" + dt;
      if (!transitions.has(key)) {
        const q = Array.from({ length: 4 }, (_, i) =>
          nachrDerivative(
            Array.from({ length: 4 }, (_, j) => +(i === j)),
            concentration,
          ),
        );
        transitions.set(key, populationTransition(q, dt));
      }
      state = movePopulation(state, transitions.get(key));
    };
    const open = times.map((time) => {
      const t = Math.max(0, time - 2);
      const on = Math.max(0, Math.min(t, pulse) - Math.min(previous, pulse));
      advance(on, ach);
      advance(t - previous - on, 0);
      previous = t;
      return state[3];
    });
    nachrCache = { key, open };
    return open;
  }
  function magnesiumBlock(v, mg) {
    return 1 / (1 + (mg / 3.57) * Math.exp(-0.062 * v));
  }
  // Exact population solution of ds/dt = alpha[T](1-s) - beta*s.
  // All receptors start closed; the appropriate agonist begins at test-step onset.
  function receptorOpen(channel, time, glutamate, pulse) {
    if (time <= 0 || glutamate === 0) return 0;
    const alpha = channel === "NMDA" ? 0.072 : channel === "GABA" ? 5 : 1.1;
    const beta = channel === "NMDA" ? 0.0066 : channel === "GABA" ? 0.18 : 0.19;
    const rate = alpha * glutamate + beta;
    const during = ((alpha * glutamate) / rate) * -Math.expm1(-rate * Math.min(time, pulse));
    return during * Math.exp(-beta * Math.max(0, time - pulse));
  }
  // Altomare et al. (2001), Table 2 HCN1 parameters, Fig. 2 topology.
  // Rates are converted from /s to /ms; r=25.85 mV is their Appendix value.
  const hcnParameters = Object.freeze({
    alpha: 0.01406,
    beta: 743.6,
    gamma: 2.289,
    delta: 74.36,
    zGate: 0.9369,
    zSensor: 1.018,
    a: 0.2,
    thermal: 25.85,
  });
  function hcnRates(v) {
    const p = hcnParameters;
    return {
      alpha: (p.alpha * Math.exp((-p.zGate * v) / p.thermal)) / 1000,
      beta: (p.beta * Math.exp((p.zGate * v) / p.thermal)) / 1000,
      gamma: (p.gamma * Math.exp((-p.zSensor * v) / p.thermal)) / 1000,
      delta: (p.delta * Math.exp((p.zSensor * v) / p.thermal)) / 1000,
    };
  }
  function hcnGenerator(v) {
    const { alpha, beta, gamma, delta } = hcnRates(v),
      f = 1 / Math.sqrt(hcnParameters.a);
    const q = Array.from({ length: 10 }, () => Array(10).fill(0));
    const edge = (i, j, rate) => {
      q[i][j] += rate;
      q[i][i] -= rate;
    };
    // State order C0..C4,O0..O4; i is the number of willing sensors.
    for (let i = 0; i <= 4; i++) {
      edge(i, i + 5, alpha * f ** i);
      edge(i + 5, i, beta / f ** i);
      if (i < 4) {
        edge(i, i + 1, (4 - i) * gamma);
        edge(i + 5, i + 6, (4 - i) * gamma * f);
      }
      if (i > 0) {
        edge(i, i - 1, i * delta);
        edge(i + 5, i + 4, (i * delta) / f);
      }
    }
    return q;
  }
  function hcnEquilibrium(v) {
    const { alpha, beta, gamma, delta } = hcnRates(v),
      r = gamma / delta;
    const choose = [1, 4, 6, 4, 1];
    const weights = choose
      .map((n, i) => n * r ** i)
      .concat(choose.map((n, i) => (alpha / beta) * n * (r / hcnParameters.a) ** i));
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((x) => x / total);
  }
  function hcnOpen(state) {
    return state.slice(5).reduce((a, b) => a + b, 0);
  }

  function matrixProduct(a, b) {
    const n = a.length,
      out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++)
      for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) out[i][j] += a[i][k] * b[k][j];
    return out;
  }
  // Matrix exponential by uniformization, scaling and squaring. All terms are
  // nonnegative, preserving population probabilities even for stiff rate sets.
  function populationTransition(q, dt) {
    const n = q.length,
      identity = () =>
        Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
    const rate = Math.max(...q.map((row, i) => -row[i]));
    if (dt === 0 || rate === 0) return identity();
    const squarings = Math.max(0, Math.ceil(Math.log2((rate * dt) / 0.5)));
    const mean = (rate * dt) / 2 ** squarings;
    const step = q.map((row, i) => row.map((x, j) => x / rate + +(i === j)));
    let power = identity(),
      weight = Math.exp(-mean);
    let result = power.map((row) => row.map((x) => x * weight));
    for (let k = 1; k <= 18; k++) {
      power = matrixProduct(power, step);
      weight *= mean / k;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) result[i][j] += weight * power[i][j];
    }
    for (let k = 0; k < squarings; k++) result = matrixProduct(result, result);
    // Correct roundoff in row sums, not the underlying rates or state fractions.
    return result.map((row) => {
      const sum = row.reduce((a, b) => a + b, 0);
      return row.map((x) => x / sum);
    });
  }
  function movePopulation(state, transition) {
    return state.map((_, j) => state.reduce((sum, x, i) => sum + x * transition[i][j], 0));
  }
  function hcnPopulation(time, voltage, hold) {
    let state = hcnEquilibrium(hold);
    const cache = new Map();
    return time.map((t, i) => {
      if (i) {
        // A command discontinuity has duplicate timestamps: state is continuous.
        const dt = Number((t - time[i - 1]).toFixed(9)),
          v = voltage[i - 1];
        const key = v + ":" + dt;
        if (!cache.has(key)) cache.set(key, populationTransition(hcnGenerator(v), dt));
        state = movePopulation(state, cache.get(key));
      }
      return hcnOpen(state);
    });
  }
  function sweep(p, c, v) {
    const initial = equilibrium(p.hold),
      final = gates(initial, v, p.duration);
    const time = [],
      voltage = [],
      test = [],
      phase = [];
    const add = (t, command, part) => {
      time.push(t);
      voltage.push(command);
      phase.push(part);
      if (part === "test") test.push(time.length - 1);
    };
    for (let i = 0; i < 100; i++) add(i * 0.02, p.hold, "before");
    // Preserve 0.01-ms resolution through the first 200 ms; use 1 ms later.
    // Agonist offsets also receive a dense window to retain fast deactivation.
    const testTimes = [0, p.duration];
    const segment = (start, end, dt) => {
      const count = Math.ceil((end - start) / dt);
      for (let i = 0; i <= count; i++)
        testTimes.push(Number((start + (i * (end - start)) / Math.max(1, count)).toFixed(9)));
    };
    segment(0, Math.min(200, p.duration), 0.01);
    if (p.duration > 200) segment(200, p.duration, 1);
    // Include all agonist offsets in the shared timeline for exact comparisons.
    for (const pulse of [p.pulse, p.achPulse, p.gabaPulse])
      if (pulse > 0 && pulse <= p.duration) testTimes.push(pulse);
    add(2, p.hold, "before");
    for (const t of [...new Set(testTimes)].sort((a, b) => a - b)) add(2 + t, v, "test");
    for (let i = 0; i <= 250; i++) add(2 + p.duration + i * 0.02, p.hold, "after");
    const nicotinic = c.channel === "nAChR" ? nachrPopulation(time, p.ach, p.achPulse) : null;
    const hcn = c.channel === "HCN" ? hcnPopulation(time, voltage, p.hold) : null;
    const values = time.map((t, i) => {
      const command = voltage[i];
      if (hcn) return c.g * hcn[i] * (command - c.e);
      if (c.channel === "Kir") {
        return c.g * kirBlock(command, c.e) * (command - c.e);
      }
      if (isReceptor(c.channel)) {
        const open = nicotinic
          ? nicotinic[i]
          : receptorOpen(
              c.channel,
              t - 2,
              c.channel === "GABA" ? p.gaba : p.glutamate,
              c.channel === "GABA" ? p.gabaPulse : p.pulse,
            );
        const block =
          c.channel === "NMDA"
            ? magnesiumBlock(command, c.mg)
            : c.channel === "CPAMPA"
              ? polyamineBlock(command, c.pa)
              : 1;
        return c.g * open * block * (command - c.e);
      }
      const state =
        phase[i] === "before"
          ? initial
          : phase[i] === "test"
            ? gates(initial, v, t - 2)
            : gates(final, p.hold, t - 2 - p.duration);
      return current(c.channel, c.g, c.e, command, state);
    });
    let index = test[test.length - 1];
    if (p.measure === "peak")
      index = test.reduce(
        (best, i) => (Math.abs(values[i]) > Math.abs(values[best]) ? i : best),
        test[0],
      );
    const glutamate = time.map((t) => (t >= 2 && t < 2 + (p.pulse ?? 0) ? (p.glutamate ?? 0) : 0));
    const acetylcholine = time.map((t) => (t >= 2 && t < 2 + (p.achPulse ?? 0) ? (p.ach ?? 0) : 0));
    const gaba = time.map((t) => (t >= 2 && t < 2 + (p.gabaPulse ?? 0) ? (p.gaba ?? 0) : 0));
    return {
      v,
      time,
      voltage,
      values,
      glutamate,
      acetylcholine,
      gaba,
      index,
      measured: values[index],
    };
  }
  function voltages(p) {
    const n = Math.floor((p.max - p.min) / p.increment + 1e-9);
    return Array.from({ length: n + 1 }, (_, i) => Number((p.min + i * p.increment).toFixed(8)));
  }
  return {
    hcnParameters,
    hcnRates,
    hcnGenerator,
    hcnEquilibrium,
    hcnOpen,
    hcnPopulation,
    populationTransition,
    movePopulation,
    kinetics,
    equilibrium,
    gates,
    current,
    sweep,
    voltages,
    isReceptor,
    receptorOpen,
    magnesiumBlock,
    polyamineBlock,
    kirBlock,
    kirParameters,
    nachrDerivative,
    advanceNachr,
    nachrPopulation,
  };
})();
if (typeof module !== "undefined") module.exports = HHModel;
