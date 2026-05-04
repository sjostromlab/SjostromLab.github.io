// Seeded random number generator (Mulberry32 - matches MATLAB's rng behavior)

class SeededRNG {
    constructor(seed = null) {
        // rng('shuffle') equivalent - use current time if no seed provided
        this.seed = seed !== null ? seed : Date.now() ^ (Math.random() * 0xFFFFFFFF);
        this.state = this.seed;
    }

    // Mulberry32 PRNG - fast and high quality
    random() {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Box-Muller transform for Gaussian random numbers (like MATLAB's randn)
    randn() {
        const u = this.random();
        const v = this.random();
        const mag = Math.sqrt(-2.0 * Math.log(u));
        return mag * Math.sin(2.0 * Math.PI * v);
    }
}

// Legacy class for compatibility
class GaussianRNG extends SeededRNG {
    constructor(seed = null) {
        super(seed);
    }

    next() {
        return this.randn();
    }
}

// Figure 1 simulation: Input selectivity through correlations

/**
 * Simulates how STDP leads to input selectivity based on correlation structure.
 *
 * Three conditions tested:
 *   1. All inputs uncorrelated - weights remain distributed
 *   2. Half correlated, half uncorrelated - correlated inputs win
 *   3. Two correlated groups competing - winner-take-all
 *
 * @param {number} conditionNumber - 1, 2, or 3
 * @param {object} params - simulation parameters
 * @param {function} onProgress - callback for progress updates (time, weights)
 * @returns {Array} final synaptic weights (normalized by gmax)
 */
async function runSelectivitySimulation(conditionNumber, params, onProgress) {
    if (onProgress === undefined) onProgress = null;
    const rng = new GaussianRNG();

    // Adjust parameters for condition 3 (stronger competition needed)
    if (conditionNumber === 3) {
        params.gmax = 0.015 * 125;  // 1.875
        params.yConst = 15;
    } else {
        params.gmax = 0.015 * 50;   // 0.75
        params.yConst = 2;
    }

    // Set up correlation groups
    // corri[i] = 0: uncorrelated, 1: correlated group 1, 2: correlated group 2
    const corri = new Array(params.N).fill(0);
    if (conditionNumber === 2) {
        for (let i = 0; i < params.N / 2; i++) corri[i] = 1;
    }
    if (conditionNumber === 3) {
        for (let i = 0; i < params.N / 2; i++) corri[i] = 1;
        for (let i = Math.floor(params.N / 2); i < params.N; i++) corri[i] = 2;
    }

    // Initialize state variables
    const dt = 1;                                      // Time step (ms)
    let V = params.Vrest;                              // Membrane potential (mV)
    const x = new Array(params.N).fill(0);             // Pre-synaptic traces (for LTP)
    let y = 0;                                         // Post-synaptic trace (for LTD)
    const tpre = new Array(params.N).fill(-9999999);   // Last pre-spike times
    const ratesi = new Array(params.N).fill(0);        // Instantaneous firing rates
    const ratesp = new Array(params.N).fill(0);        // Spike probabilities

    // Initialize synaptic weights randomly in [0, gmax]
    const g = new Array(params.N);
    for (let i = 0; i < params.N; i++) {
        g[i] = Math.min(Math.max(rng.random() * params.gmax, 0), params.gmax);
    }

    // Two separate timers (matching MATLAB simSTDP2 - concurrent clusters)
    let dur1 = Math.round(Math.max(1, params.corr_time + rng.randn()));
    let dur2 = Math.round(Math.max(1, params.corr_time + rng.randn()));

    // Initialize firing rates (matching MATLAB simSTDP2)
    let xa = new Array(params.N);
    let ya;

    // Uncorrelated input
    for (let i = 0; i < params.N; i++) xa[i] = rng.randn();
    for (let i = 0; i < params.N; i++) {
        if (corri[i] === 0) {
            ratesi[i] = 10 * (1 + 0.3 * Math.sqrt(2) * xa[i]);
        }
    }

    // Check which correlation groups exist
    let corr1 = 0;
    if (corri.some(c => c === 1)) {
        corr1 = 1;
        for (let i = 0; i < params.N; i++) xa[i] = rng.randn();
        ya = rng.randn();
        for (let i = 0; i < params.N; i++) {
            if (corri[i] === 1) {
                ratesi[i] = 10 * (1 + 0.3 * Math.sqrt(2) * xa[i] + params.yConst * ya);
            }
        }
    }

    let corr2 = 0;
    if (corri.some(c => c === 2)) {
        corr2 = 1;
        for (let i = 0; i < params.N; i++) xa[i] = rng.randn();
        ya = rng.randn();
        for (let i = 0; i < params.N; i++) {
            if (corri[i] === 2) {
                ratesi[i] = 10 * (1 + 0.3 * Math.sqrt(2) * xa[i] + params.yConst * ya);
            }
        }
    }

    // Convert rates to spike probabilities
    for (let i = 0; i < params.N; i++) {
        ratesi[i] = Math.max(ratesi[i], 0);
    }
    for (let i = 0; i < params.N; i++) {
        if (corri[i] === 0) ratesp[i] = 1 - Math.exp(-ratesi[i] * 0.001);
        if (corri[i] === 1) ratesp[i] = 1 - Math.exp(-ratesi[i] * 0.001);
        if (corri[i] === 2) ratesp[i] = 1 - Math.exp(-ratesi[i] * 0.001);
    }

    // Main simulation loop (matching MATLAB simSTDP2 - concurrent clusters)
    for (let t = 1; t <= params.stime; t++) {

        // Timer 1: Update uncorrelated inputs AND correlated group 1
        if (t % dur1 === 0) {
            // Regenerate uncorrelated inputs
            for (let i = 0; i < params.N; i++) xa[i] = rng.randn();
            for (let i = 0; i < params.N; i++) {
                if (corri[i] === 0) {
                    ratesi[i] = 10 * (1 + 0.3 * Math.sqrt(2) * xa[i]);
                }
            }
            dur1 = Math.round(Math.max(1, params.corr_time + rng.randn()));

            // Regenerate for correlated group 1
            for (let i = 0; i < params.N; i++) xa[i] = rng.randn();
            ya = rng.randn();
            if (corr1) {
                for (let i = 0; i < params.N; i++) {
                    if (corri[i] === 1) {
                        ratesi[i] = 10 * (1 + 0.3 * xa[i] + params.yConst * ya);
                        ratesp[i] = 1 - Math.exp(-ratesi[i] * 0.001);
                    }
                }
            }
            // Update spike probabilities for uncorrelated
            for (let i = 0; i < params.N; i++) {
                if (corri[i] === 0) {
                    ratesp[i] = 1 - Math.exp(-ratesi[i] * 0.001);
                }
            }
            for (let i = 0; i < params.N; i++) {
                ratesi[i] = Math.max(ratesi[i], 0);
            }
        }

        // Timer 2: Update correlated group 2 (only if it exists)
        if (corr2 && t % dur2 === 0) {
            for (let i = 0; i < params.N; i++) xa[i] = rng.randn();
            ya = rng.randn();
            dur2 = Math.round(Math.max(1, params.corr_time + rng.randn()));

            for (let i = 0; i < params.N; i++) {
                if (corri[i] === 2) {
                    ratesi[i] = 10 * (1 + 0.3 * xa[i] + params.yConst * ya);
                    ratesp[i] = 1 - Math.exp(-ratesi[i] * 0.001);
                }
            }
        }

        // Calculate total excitatory conductance (sum of exponential kernels)
        let gex = 0;
        for (let i = 0; i < params.N; i++) {
            gex += g[i] * Math.exp(-(t - tpre[i]) / params.tau_ex);
        }

        // Leaky Integrate-and-Fire neuron dynamics
        // dV/dt = (Vrest - V + gex*(Eex - V)) / tau_m
        const dV = (params.Vrest - V + gex * (params.Eex - V)) / params.tau_m;
        V = V + dV * dt;

        // Post-synaptic spike and LTP
        let spost = 0;
        if (V >= params.Vth) {
            V = -60;  // Reset potential
            spost = 1;

            // LTP: if post fires after pre, strengthen synapse
            // Weight change proportional to pre-synaptic trace x[i]
            for (let i = 0; i < params.N; i++) {
                g[i] = g[i] + params.gmax * params.A_ltp * x[i];
            }
        }

        // Update post-synaptic trace (exponential decay)
        const dy = (-y + spost) / params.tau_ltd;

        // Pre-synaptic spikes (Poisson process)
        const spikespre = new Array(params.N);
        for (let i = 0; i < params.N; i++) {
            spikespre[i] = rng.random() <= ratesp[i] ? 1 : 0;
            if (spikespre[i]) tpre[i] = t + 1;
        }

        // Calculate dx (but don't update x yet, matching MATLAB order)
        const dx = new Array(params.N);
        for (let i = 0; i < params.N; i++) {
            dx[i] = (-x[i] + spikespre[i]) / params.tau_ltp;
        }

        // LTD: if pre fires after post, weaken synapse
        // Weight change proportional to post-synaptic trace y
        for (let i = 0; i < params.N; i++) {
            if (spikespre[i]) {
                g[i] = g[i] - params.gmax * params.A_ltd * y;
            }
        }

        // Update traces (after LTD, matching MATLAB order)
        for (let i = 0; i < params.N; i++) {
            x[i] = x[i] + dx[i] * dt;
        }
        y = y + dy * dt;

        // Bound weights to [0, gmax]
        for (let i = 0; i < params.N; i++) {
            g[i] = Math.max(Math.min(g[i], params.gmax), 0);
        }

        // Progress callback (every 2500 ms for UI updates)
        if (onProgress && t % 2500 === 0) {
            const normalizedWeights = g.map(w => w / params.gmax);
            await onProgress(t, params.stime, normalizedWeights);
        }
    }

    return g.map(w => w / params.gmax);
}

// Figure 4 simulation: Temporal coding through latency

/**
 * Simulates how STDP implements temporal coding based on input latency.
 *
 * Each input has a different latency (time of burst onset relative to t=0).
 * STDP strengthens early inputs (that fire before post-spike) and weakens
 * late inputs (that fire after post-spike), sharpening temporal selectivity.
 *
 * @param {object} params - simulation parameters
 * @param {function} onProgress - callback (iteration, total, weights, voltage)
 * @returns {object} { latencies, weights }
 */
async function runLatencySimulation(params, onProgress) {
    if (onProgress === undefined) onProgress = null;
    const rng = new GaussianRNG();
    const dt = 1;
    const int_start = -50;   // Integration window start (ms)
    const int_end = 50;      // Integration window end (ms)
    const int_length = int_end - int_start + 1;

    // Generate input latencies (Gaussian distribution)
    const latencies = new Array(params.N);
    for (let i = 0; i < params.N; i++) {
        latencies[i] = rng.next() * params.latency_std;
    }

    // Initialize all weights equally
    const g = new Array(params.N).fill(params.g_init);

    // Spike probability during burst
    const firingp = 1 - Math.exp(-params.burstrate * 0.001);

    // Pre/post synaptic traces - persist across trials (matching MATLAB)
    const x = new Array(params.N).fill(0);
    let y = 0;

    let initialVoltage = null;

    // Main loop: repeated stimulus presentations
    for (let trial = 1; trial <= params.ttimes; trial++) {
        const tpre = new Array(params.N).fill(-9999999);
        let V = params.Vrest;
        const Vs = new Array(int_length).fill(0);

        let idx = 0;
        for (let t = int_start; t <= int_end; t++) {
            // Calculate excitatory conductance
            let gex = 0;
            for (let i = 0; i < params.N; i++) {
                gex += g[i] * Math.exp(-(t - tpre[i]) / params.tau_ex);
            }

            // Integrate-and-fire dynamics
            const dV = (params.Vrest - V + gex * (params.Eex - V)) / params.tau_m;
            V = V + dV * dt;
            Vs[idx] = V;

            // Post-synaptic spike
            let spost = 0;
            if (V >= params.Vth) {
                V = -60;
                Vs[idx] = 0;
                spost = 1;

                // LTP for recently active synapses
                for (let i = 0; i < params.N; i++) {
                    g[i] = g[i] + params.gmax * params.A_ltp * x[i];
                }
            }

            const dy = (-y + spost) / params.tau_ltd;

            // Pre-synaptic spikes (only during each input's burst window)
            const spikespre = new Array(params.N);
            for (let i = 0; i < params.N; i++) {
                const inBurstWindow = t >= latencies[i] && t < (latencies[i] + params.burstdur);
                spikespre[i] = (rng.random() <= firingp && inBurstWindow) ? 1 : 0;
                if (spikespre[i]) tpre[i] = t + 1;
            }

            // Calculate dx (but don't update x yet, matching MATLAB order)
            const dx = new Array(params.N);
            for (let i = 0; i < params.N; i++) {
                dx[i] = (-x[i] + spikespre[i]) / params.tau_ltp;
            }

            // LTD for late pre-synaptic spikes
            for (let i = 0; i < params.N; i++) {
                if (spikespre[i]) {
                    g[i] = g[i] - params.gmax * params.A_ltd * y;
                }
            }

            // Update traces (after LTD, matching MATLAB order)
            for (let i = 0; i < params.N; i++) {
                x[i] = x[i] + dx[i] * dt;
            }
            y = y + dy * dt;

            // Bound weights
            for (let i = 0; i < params.N; i++) {
                g[i] = Math.max(Math.min(g[i], params.gmax), 0);
            }

            idx++;
        }

        // Store initial voltage trace
        if (trial === 1) {
            initialVoltage = Vs.slice();
        }

        // Progress callback
        if (onProgress && trial % 100 === 0) {
            const normalizedWeights = g.map(w => w / params.gmax);
            await onProgress(trial, params.ttimes, latencies, normalizedWeights, Vs, initialVoltage);
        }
    }

    return {
        latencies: latencies,
        weights: g.map(w => w / params.gmax)
    };
}

// Plotly configuration

var config = {responsive: true};

// Figure 1 plot layouts

var layout1 = {
    title: '<b>Uncorrelated \u2194 Uncorrelated</b>',
    xaxis: {
        title: '<b>Input Neuron</b>',
        range: [0, 100],
        zeroline: false
    },
    yaxis: {
        title: '<b>Synaptic Strength<br>g/g<sub>max</sub></b>',
        range: [0, 1],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

var layout2 = {
    title: '<b>Correlated \u2194 Uncorrelated</b>',
    xaxis: {
        title: '<b>Input Neuron</b>',
        range: [0, 100],
        zeroline: false
    },
    yaxis: {
        title: '<b>Synaptic Strength<br>g/g<sub>max</sub></b>',
        range: [0, 1],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

var layout3 = {
    title: '<b>Correlated \u2194 Correlated</b>',
    xaxis: {
        title: '<b>Input Neuron</b>',
        range: [0, 100],
        zeroline: false
    },
    yaxis: {
        title: '<b>Synaptic Strength<br>g/g<sub>max</sub></b>',
        range: [0, 1],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

var layoutSTDPWindow = {
    title: '<b>STDP Window Function</b>',
    xaxis: {
        title: '<b>t<sub>pre</sub> − t<sub>post</sub> (ms)</b>',
        range: [-200, 200],
        zeroline: true
    },
    yaxis: {
        title: '<b>Synaptic Weight Change (%)</b>',
        range: [-0.5, 0.5],
        zeroline: true
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: true,
    legend: {
        x: 0.6,
        y: 0.95,
        font: {size: 9}
    },
    annotations: [
        {
            x: -100,
            y: 0.35,
            text: 'LTP: F = A<sub>LTP</sub> e<sup>Δt/τ<sub>LTP</sub></sup>',
            showarrow: false,
            font: {size: 11}
        },
        {
            x: 100,
            y: -0.35,
            text: 'LTD: F = −A<sub>LTD</sub> e<sup>−Δt/τ<sub>LTD</sub></sup>',
            showarrow: false,
            font: {size: 11}
        }
    ]
};

// Figure 4 plot layouts

var layoutF4InitWeights = {
    title: '<b>Initial Synaptic Weights</b>',
    xaxis: {
        title: '<b>Latency (ms)</b>',
        range: [-55, 55],
        zeroline: false
    },
    yaxis: {
        title: '<b>Synaptic Strength<br>g/g<sub>max</sub></b>',
        range: [0, 1],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

var layoutF4InitVoltage = {
    title: '<b>Initial Voltage Trace</b>',
    xaxis: {
        title: '<b>Time (ms)</b>',
        range: [-50, 50],
        zeroline: false
    },
    yaxis: {
        title: '<b>Voltage (mV)</b>',
        range: [-80, 0],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

var layoutF4CurrWeights = {
    title: '<b>Synaptic Weights</b>',
    xaxis: {
        title: '<b>Latency (ms)</b>',
        range: [-55, 55],
        zeroline: false
    },
    yaxis: {
        title: '<b>Synaptic Strength<br>g/g<sub>max</sub></b>',
        range: [0, 1],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

var layoutF4CurrVoltage = {
    title: '<b>Voltage Trace</b>',
    xaxis: {
        title: '<b>Time (ms)</b>',
        range: [-50, 50],
        zeroline: false
    },
    yaxis: {
        title: '<b>Voltage (mV)</b>',
        range: [-80, 0],
        zeroline: false
    },
    autosize: true,
    paper_bgcolor: '#c7c7c7',
    showlegend: false
};

// Figure 1: Input selectivity simulation UI logic

var isRunning = false;

function getParameters() {
    return {
        N: 100,
        tau_ltp: 20,
        tau_ltd: 20,
        A_ltp: 0.005,
        A_ltd: 0.005 * parseFloat(document.getElementById('B').value),
        gmax: 0.75,
        Vrest: -74,
        Vth: -54,
        tau_m: 20,
        stime: parseInt(document.getElementById('stime').value),
        tau_ex: 5,
        Eex: 0,
        corr_time: parseFloat(document.getElementById('corr_time').value),
        yConst: parseFloat(document.getElementById('yConst').value)
    };
}

function initializePlots() {
    // Initialize empty scatter plots for Figure 1
    var emptyTrace = {
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: 'rgb(0, 0, 0)',
            size: 6
        },
        cliponaxis: false
    };

    Plotly.newPlot('condition1Chart', [emptyTrace], layout1, config);
    Plotly.newPlot('condition2Chart', [emptyTrace], layout2, config);
    Plotly.newPlot('condition3Chart', [emptyTrace], layout3, config);

    // Initialize Panel A: STDP Window Function
    var tau_plus = 20;
    var tau_minus1 = 20;
    var tau_minus2 = 100;
    var A_plus = 0.005;
    var A_minus1 = A_plus;
    var A_minus2 = A_plus * (tau_minus1 / tau_minus2);

    var t_stdp = [];
    var stdp1 = [];
    var stdp2 = [];
    for (var i = 0; i < 1000; i++) {
        var t = -200 + (400 * i / 999);
        t_stdp.push(t);
        if (t < 0) {
            stdp1.push(100 * A_plus * Math.exp(t / tau_plus));
            stdp2.push(100 * A_plus * Math.exp(t / tau_plus));
        } else {
            stdp1.push(-100 * A_minus1 * Math.exp(-t / tau_minus1));
            stdp2.push(-100 * A_minus2 * Math.exp(-t / tau_minus2));
        }
    }

    var traceSTDP1 = {
        x: t_stdp,
        y: stdp1,
        mode: 'lines',
        line: { color: 'black', width: 2, dash: 'dot' },
        name: 'τ<sub>LTD</sub> = τ<sub>LTP</sub>'
    };

    var traceSTDP2 = {
        x: t_stdp,
        y: stdp2,
        mode: 'lines',
        line: { color: 'black', width: 2, dash: 'dash' },
        name: 'τ<sub>LTD</sub> = 5τ<sub>LTP</sub>'
    };

    Plotly.newPlot('histogramChart', [traceSTDP1, traceSTDP2], layoutSTDPWindow, config);
}

function updateConditionPlot(conditionNumber, weights) {
    var chartId = 'condition' + conditionNumber + 'Chart';
    var x = [];
    var y = [];
    for (var i = 0; i < weights.length; i++) {
        x.push(i);
        y.push(weights[i]);
    }

    // Use restyle for smoother updates without flashing
    Plotly.restyle(chartId, {
        x: [x],
        y: [y]
    }, [0]);
}

function updateHistogram(weights) {
    // Panel E is now a static correlation plot, no updates needed
    // This function is kept for compatibility but does nothing
}

async function runCondition(conditionNumber) {
    if (isRunning) return;

    isRunning = true;
    var buttons = ['runCondition1', 'runCondition2', 'runCondition3'];
    buttons.forEach(function(id) { document.getElementById(id).disabled = true; });

    var conditionNames = {
        1: 'Uncorrelated \u2194 Uncorrelated',
        2: 'Correlated \u2194 Uncorrelated',
        3: 'Correlated \u2194 Correlated'
    };

    document.getElementById('status').textContent = 'Running ' + conditionNames[conditionNumber] + '...';

    // Reset progress bar instantly (disable transition so it doesn't animate backwards)
    var progressBar = document.getElementById('progressBar');
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    // Force reflow, then re-enable transition
    progressBar.offsetWidth;
    progressBar.style.transition = 'width 0.3s ease';

    var params = getParameters();

    try {
        var onProgress = async function(t, total, weights) {
            if (!isRunning) throw new Error('Stopped');

            var progress = (t / total) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('status').textContent = conditionNames[conditionNumber] + ': t = ' + t + ' / ' + total + ' ms';

            updateConditionPlot(conditionNumber, weights);

            await new Promise(function(resolve) { setTimeout(resolve, 20); });
        };

        var finalWeights = await runSelectivitySimulation(conditionNumber, params, onProgress);

        updateConditionPlot(conditionNumber, finalWeights);
        updateHistogram(finalWeights);

        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('status').textContent = conditionNames[conditionNumber] + ' completed';

    } catch (error) {
        if (error.message !== 'Stopped') {
            console.error('Simulation error:', error);
            document.getElementById('status').textContent = 'Error occurred';
        }
    }

    isRunning = false;
    buttons.forEach(function(id) { document.getElementById(id).disabled = false; });
}

function stopSimulation() {
    isRunning = false;
    document.getElementById('status').textContent = 'Simulation stopped';
    var buttons = ['runCondition1', 'runCondition2', 'runCondition3'];
    buttons.forEach(function(id) { document.getElementById(id).disabled = false; });
}

// Figure 4: Latency simulation UI logic

var f4_isRunning = false;
var f4_chartsInitialized = false;

function getF4Parameters() {
    return {
        // User-adjustable parameters
        g_init: parseFloat(document.getElementById('f4_g_init').value),
        gmax: parseFloat(document.getElementById('f4_gmax').value),
        ttimes: parseInt(document.getElementById('f4_ttimes').value),
        latency_std: parseFloat(document.getElementById('f4_latency_std').value),
        burstrate: parseFloat(document.getElementById('f4_burstrate').value),

        // Hardcoded parameters (fixed for pedagogical clarity)
        N: 1000,
        tau_ltp: 20,
        tau_ltd: 20,
        A_ltp: 0.005,
        A_ltd: 0.005 * 1.05,
        Vrest: -74,
        Vth: -54,
        tau_m: 20,
        tau_ex: 5,
        Eex: 0,
        burstdur: 20
    };
}

function initializeF4Plots() {
    if (f4_chartsInitialized) return;
    f4_chartsInitialized = true;

    var emptyScatter = {
        x: [],
        y: [],
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: 'rgb(0, 0, 0)',
            size: 4
        },
        cliponaxis: false
    };

    var emptyLine = {
        x: [],
        y: [],
        mode: 'lines',
        type: 'scatter',
        line: {
            color: 'rgb(0, 0, 0)',
            width: 2
        }
    };

    Plotly.newPlot('f4_initialWeights', [emptyScatter], layoutF4InitWeights, config);
    Plotly.newPlot('f4_initialVoltage', [emptyLine], layoutF4InitVoltage, config);
    Plotly.newPlot('f4_currentWeights', [emptyScatter], layoutF4CurrWeights, config);
    Plotly.newPlot('f4_currentVoltage', [emptyLine], layoutF4CurrVoltage, config);
}

async function runFigure4() {
    if (f4_isRunning) return;

    initializeF4Plots();
    f4_isRunning = true;
    document.getElementById('runFigure4').disabled = true;
    document.getElementById('f4_status').textContent = 'Initializing...';

    var params = getF4Parameters();

    try {
        var onProgress = async function(trial, total, latencies, weights, voltage, initialVoltage) {
            if (!f4_isRunning) throw new Error('Stopped');

            var progress = (trial / total) * 100;
            document.getElementById('f4_progressBar').style.width = progress + '%';
            document.getElementById('f4_status').textContent = 'Iteration ' + trial + '/' + total;

            // Update initial weights/voltage on first callback
            if (trial === 100) {
                Plotly.restyle('f4_initialWeights', {
                    x: [latencies],
                    y: [new Array(latencies.length).fill(params.g_init / params.gmax)]
                }, [0]);

                if (initialVoltage) {
                    var initTimeAxis = [];
                    for (var i = 0; i < initialVoltage.length; i++) {
                        initTimeAxis.push(-50 + i);
                    }
                    Plotly.restyle('f4_initialVoltage', {
                        x: [initTimeAxis],
                        y: [initialVoltage]
                    }, [0]);
                }
            }

            // Update current weights using restyle (no flashing)
            Plotly.restyle('f4_currentWeights', {
                x: [latencies],
                y: [weights]
            }, [0]);

            // Update current voltage using restyle (no flashing)
            var timeAxis = [];
            for (var i = 0; i < voltage.length; i++) {
                timeAxis.push(-50 + i);
            }
            Plotly.restyle('f4_currentVoltage', {
                x: [timeAxis],
                y: [voltage]
            }, [0]);

            await new Promise(function(resolve) { setTimeout(resolve, 1); });
        };

        var result = await runLatencySimulation(params, onProgress);

        // Final update using restyle
        Plotly.restyle('f4_currentWeights', {
            x: [result.latencies],
            y: [result.weights]
        }, [0]);

        document.getElementById('f4_progressBar').style.width = '100%';
        document.getElementById('f4_status').textContent = 'Simulation completed';

    } catch (error) {
        if (error.message !== 'Stopped') {
            console.error('Simulation error:', error);
            document.getElementById('f4_status').textContent = 'Error occurred';
        }
    }

    f4_isRunning = false;
    document.getElementById('runFigure4').disabled = false;
}

function stopFigure4() {
    f4_isRunning = false;
    document.getElementById('f4_status').textContent = 'Simulation stopped';
    document.getElementById('runFigure4').disabled = false;
}

// Tab switching logic

function setupTabs() {
    var tabButtons = document.querySelectorAll('.tab-button');
    var tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var tabId = button.getAttribute('data-tab');

            tabButtons.forEach(function(btn) { btn.classList.remove('active'); });
            button.classList.add('active');

            tabContents.forEach(function(content) { content.classList.remove('active'); });
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'figure4') {
                initializeF4Plots();
            }
        });
    });
}

// Initialize on page load

document.addEventListener('DOMContentLoaded', function() {
    initializePlots();
    setupTabs();

    // Reset parameters function for Figure 1
    function resetParameters() {
        // Figure 1 parameters
        document.getElementById('B').value = '1.05';
        document.getElementById('stime').value = '500000';
        document.getElementById('corr_time').value = '20';
        document.getElementById('yConst').value = '2';

        document.getElementById('status').textContent = 'Parameters reset to defaults';
    }

    // Reset parameters function for Figure 4
    function resetParametersF4() {
        // Figure 4 parameters
        document.getElementById('f4_g_init').value = '0.003';
        document.getElementById('f4_gmax').value = '0.015';
        document.getElementById('f4_ttimes').value = '2000';
        document.getElementById('f4_latency_std').value = '15';
        document.getElementById('f4_burstrate').value = '100';

        document.getElementById('f4_status').textContent = 'Parameters reset to defaults';
    }

    // Bind event listeners
    document.getElementById('runCondition1').addEventListener('click', function() { runCondition(1); });
    document.getElementById('runCondition2').addEventListener('click', function() { runCondition(2); });
    document.getElementById('runCondition3').addEventListener('click', function() { runCondition(3); });
    document.getElementById('stopSimulation').addEventListener('click', stopSimulation);
    document.getElementById('resetParams').addEventListener('click', resetParameters);

    document.getElementById('runFigure4').addEventListener('click', runFigure4);
    document.getElementById('stopFigure4').addEventListener('click', stopFigure4);
    document.getElementById('resetParamsF4').addEventListener('click', resetParametersF4);
});
