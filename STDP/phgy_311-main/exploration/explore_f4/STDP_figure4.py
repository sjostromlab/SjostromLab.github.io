"""
STDP Figure 4: Temporal Coding Through Latency
================================================
Based on Song, Miller & Abbott (2000) Nature Neuroscience, Figure 4.

Each input neuron has a different latency (burst onset time). STDP
strengthens early inputs (fire before postsynaptic spike) and weakens
late inputs (fire after), sharpening temporal selectivity.

Four panels:
  - Initial synaptic weights vs latency
  - Initial voltage trace (trial 1)
  - Final synaptic weights vs latency
  - Final voltage trace (last trial)
"""

import os
import numpy as np
import matplotlib.pyplot as plt


FIG_DIR = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(FIG_DIR, exist_ok=True)


def run_latency_simulation(N=1000, ttimes=2000, latency_std=15.0,
                           burstdur=20.0, burstrate=100.0,
                           tau_ltp=20.0, tau_ltd=None, A_ltp=0.005, B=1.05,
                           gmax=0.015, Vrest=-74.0, Vth=-54.0,
                           tau_m=20.0, tau_ex=5.0, Eex=0.0,
                           latencies=None):
    """
    Simulate STDP with latency-coded inputs.

    Each input fires a Poisson burst starting at its latency.
    Repeated stimulus presentations drive STDP learning.

    Returns
    -------
    latencies : array of input latencies (ms)
    weights : array of final normalized weights
    initial_voltage : voltage trace from trial 1
    final_voltage : voltage trace from last trial
    weight_snapshots : list of (trial, weights) tuples
    """
    rng = np.random.default_rng()

    if tau_ltd is None:
        tau_ltd = tau_ltp
    A_ltd = A_ltp * B
    int_start = -50
    int_end = 50
    int_length = int_end - int_start + 1
    dt = 1

    # Gaussian-distributed latencies (use provided or generate)
    if latencies is None:
        latencies = rng.standard_normal(N) * latency_std

    # All weights start equal
    g = np.full(N, 0.003)
    initial_weights = g.copy() / gmax

    # Spike probability during burst
    firingp = 1 - np.exp(-burstrate * 0.001)

    # Traces persist across trials
    x = np.zeros(N)
    y = 0.0

    initial_voltage = None
    final_voltage = None
    weight_snapshots = []
    spike_latency = np.full(ttimes, np.nan)

    snapshot_interval = max(1, ttimes // 20)

    for trial in range(1, ttimes + 1):
        tpre = np.full(N, -9999999.0)
        V = Vrest
        Vs = np.zeros(int_length)
        first_spike_time = np.nan

        idx = 0
        for t_ms in range(int_start, int_end + 1):
            t = float(t_ms)

            # Excitatory conductance
            gex = np.sum(g * np.exp(-(t - tpre) / tau_ex))

            # LIF dynamics
            dV = (Vrest - V + gex * (Eex - V)) / tau_m
            V += dV * dt
            Vs[idx] = V

            # Post-synaptic spike
            spost = 0
            if V >= Vth:
                V = -60.0
                Vs[idx] = 0.0
                spost = 1
                g += gmax * A_ltp * x
                if np.isnan(first_spike_time):
                    first_spike_time = t

            dy = (-y + spost) / tau_ltd

            # Pre-synaptic spikes (Poisson during burst window)
            in_burst = (t >= latencies) & (t < latencies + burstdur)
            spikespre = (rng.random(N) <= firingp) & in_burst
            fired = spikespre.astype(float)
            tpre[spikespre] = t + 1

            dx = (-x + fired) / tau_ltp
            g[spikespre] -= gmax * A_ltd * y

            x += dx * dt
            y += dy * dt
            np.clip(g, 0, gmax, out=g)

            idx += 1

        spike_latency[trial - 1] = first_spike_time

        if trial == 1:
            initial_voltage = Vs.copy()

        final_voltage = Vs.copy()

        if trial % snapshot_interval == 0:
            weight_snapshots.append((trial, g.copy() / gmax))
            if trial % 1000 == 0:
                print(f"  Trial {trial}/{ttimes}")

    weights = g / gmax
    return latencies, weights, initial_weights, initial_voltage, final_voltage, weight_snapshots, spike_latency


# -------------------------------------------------------------------------
# Run simulation
# -------------------------------------------------------------------------
print("Running Figure 4: Temporal Coding Through Latency...")

latencies, weights, initial_weights, initial_V, final_V, snapshots, spike_lat = \
    run_latency_simulation()

time_axis = np.arange(-50, 51)

# -------------------------------------------------------------------------
# Plot: 2x2 panels matching the website
# -------------------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Top-left: Initial weights vs latency
ax = axes[0, 0]
ax.scatter(latencies, initial_weights, s=15, c='black', edgecolors='none')
ax.set_xlabel("Latency (ms)")
ax.set_ylabel("Synaptic Strength  g/g$_{max}$")
ax.set_title("Initial Synaptic Weights", fontweight='bold')
ax.set_xlim(-55, 55)
ax.set_ylim(0, 1)

# Top-right: Initial voltage trace
ax = axes[0, 1]
ax.plot(time_axis, initial_V, 'k-', linewidth=1.5)
ax.set_xlabel("Time (ms)")
ax.set_ylabel("Voltage (mV)")
ax.set_title("Initial Voltage Trace (Trial 1)", fontweight='bold')
ax.set_xlim(-50, 50)
ax.set_ylim(-80, 0)

# Bottom-left: Final weights vs latency
ax = axes[1, 0]
ax.scatter(latencies, weights, s=15, c='black', edgecolors='none')
ax.set_xlabel("Latency (ms)")
ax.set_ylabel("Synaptic Strength  g/g$_{max}$")
ax.set_title("Final Synaptic Weights", fontweight='bold')
ax.set_xlim(-55, 55)
ax.set_ylim(0, 1)

# Bottom-right: Final voltage trace
ax = axes[1, 1]
ax.plot(time_axis, final_V, 'k-', linewidth=1.5)
ax.set_xlabel("Time (ms)")
ax.set_ylabel("Voltage (mV)")
ax.set_title("Final Voltage Trace", fontweight='bold')
ax.set_xlim(-50, 50)
ax.set_ylim(-80, 0)

fig.suptitle("STDP Temporal Coding Through Latency (Song et al. 2000, Figure 4)",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_results.png"), dpi=150)
print("\nSaved analysis_figures/figure4_results.png")
plt.show()
