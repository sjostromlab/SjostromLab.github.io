"""
STDP Figure 4 — Section 4: Mechanism of Temporal Learning
===========================================================
Demonstrates WHY STDP creates temporal selectivity:

1. Evolution of postsynaptic spike timing over training
2. Which synapses become strong (scatter + mean line)
3. Distribution of strong synapse latencies
4. Pre-post timing relationship driving STDP

Key finding: STDP selects the earliest reliable inputs via a
positive feedback loop — early inputs strengthen, spike moves
earlier, reinforcing those early synapses further.
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from STDP_figure4 import run_latency_simulation

FIG_DIR = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(FIG_DIR, exist_ok=True)

N = 1000
shared_latencies = np.random.default_rng(42).standard_normal(N) * 15


# =========================================================================
# Run simulation (spike_latency already recorded per trial)
# =========================================================================
print("Running simulation for mechanism analysis...")

lat, w, _, initial_V, final_V, snapshots, spike_latency = run_latency_simulation(
    N=N, B=1.05, latencies=shared_latencies.copy()
)


# =========================================================================
# Experiment 1: Evolution of postsynaptic spike timing
# =========================================================================
print("\n[1/4] Spike latency evolution")

fig1, ax1 = plt.subplots(figsize=(7, 4))

# Smooth with moving average
window = 50
valid = ~np.isnan(spike_latency)
lat_smooth = np.full_like(spike_latency, np.nan)
for i in range(window // 2, len(spike_latency) - window // 2):
    chunk = spike_latency[i - window // 2: i + window // 2]
    valid_chunk = chunk[~np.isnan(chunk)]
    if len(valid_chunk) > 0:
        lat_smooth[i] = np.mean(valid_chunk)

trials = np.arange(1, len(spike_latency) + 1)

ax1.plot(trials, lat_smooth, 'k-', linewidth=2)
ax1.set_xlabel("Training iteration")
ax1.set_ylabel("Postsynaptic spike latency (ms)")
ax1.set_title("Reduction of Spike Latency During Learning", fontweight='bold')
ax1.grid(True, alpha=0.3)

fig1.tight_layout()
fig1.savefig(os.path.join(FIG_DIR, "mechanism_1_latency_evolution.png"), dpi=150)
print("  Saved mechanism_1_latency_evolution.png")


# =========================================================================
# Experiment 2: Which synapses become strong?
# =========================================================================
print("\n[2/4] Strong synapses vs latency")

fig2, ax2 = plt.subplots(figsize=(7, 5))

strong = w > 0.8
weak = ~strong

ax2.scatter(lat[weak], w[weak], s=10, c='gray', edgecolors='none', alpha=0.5,
            label='Weak synapses')
ax2.scatter(lat[strong], w[strong], s=15, c='black', edgecolors='none',
            label='Strong synapses (g/gmax > 0.8)')

if np.any(strong):
    mean_lat = lat[strong].mean()
    ax2.axvline(mean_lat, color='red', linestyle='--', linewidth=2,
                label=f'Mean strong latency = {mean_lat:.1f} ms')

ax2.set_xlabel("Input latency (ms)")
ax2.set_ylabel("g/g$_{max}$")
ax2.set_title("Strong Synapses Are Early Inputs", fontweight='bold')
ax2.set_xlim(-55, 55)
ax2.set_ylim(0, 1)
ax2.legend(fontsize=9)

fig2.tight_layout()
fig2.savefig(os.path.join(FIG_DIR, "mechanism_2_strong_synapses.png"), dpi=150)
print("  Saved mechanism_2_strong_synapses.png")


# =========================================================================
# Experiment 3: Histogram of strong synapse latencies
# =========================================================================
print("\n[3/4] Distribution of strong synapse latencies")

fig3, ax3 = plt.subplots(figsize=(7, 4))

strong_latencies = lat[strong]

if len(strong_latencies) > 0:
    ax3.hist(strong_latencies, bins=30, color='black', alpha=0.7)
    ax3.axvline(strong_latencies.mean(), color='red', linestyle='--', linewidth=2,
                label=f'Mean = {strong_latencies.mean():.1f} ms')
    ax3.legend()

ax3.set_xlabel("Latency (ms)")
ax3.set_ylabel("Count")
ax3.set_title("Distribution of Learned Synapse Latencies", fontweight='bold')

fig3.tight_layout()
fig3.savefig(os.path.join(FIG_DIR, "mechanism_3_strong_latency_dist.png"), dpi=150)
print("  Saved mechanism_3_strong_latency_dist.png")


# =========================================================================
# Experiment 4: Pre-post timing relationship
# =========================================================================
print("\n[4/4] Pre-post timing relationship")

fig4, ax4 = plt.subplots(figsize=(7, 4))

# Approximate post-spike time from the mean latency of strong inputs + membrane delay
if len(strong_latencies) > 0:
    post_time = strong_latencies.mean() + 5  # ~5 ms membrane integration delay
else:
    post_time = 0

delta_t = post_time - lat  # positive = pre fires before post (LTP region)

ax4.hist(delta_t[strong], bins=30, color='black', alpha=0.7, label='Strong synapses')
ax4.hist(delta_t[weak], bins=30, color='gray', alpha=0.4, label='Weak synapses')
ax4.axvline(0, color='red', linestyle='-', linewidth=1)

# Mark LTP region
ax4.axvspan(0, 40, alpha=0.1, color='green', label='LTP region (Δt > 0)')

ax4.set_xlabel("Δt = t$_{post}$ − t$_{pre}$ (ms)")
ax4.set_ylabel("Count")
ax4.set_title("Timing Relationship Driving STDP", fontweight='bold')
ax4.legend(fontsize=9)

fig4.tight_layout()
fig4.savefig(os.path.join(FIG_DIR, "mechanism_4_timing_relationship.png"), dpi=150)
print("  Saved mechanism_4_timing_relationship.png")


# =========================================================================
# Summary
# =========================================================================
print("\n" + "=" * 60)
print("Section 4 — Mechanism Analysis Complete")
print("=" * 60)

valid_lat = spike_latency[~np.isnan(spike_latency)]
if len(valid_lat) >= 100:
    early_lat = np.mean(valid_lat[:100])
    late_lat = np.mean(valid_lat[-100:])
    print(f"  Early training spike latency:  {early_lat:.1f} ms")
    print(f"  Late training spike latency:   {late_lat:.1f} ms")
    print(f"  Latency reduction:             {early_lat - late_lat:.1f} ms")

if np.any(strong):
    print(f"  Number of strong synapses:     {np.sum(strong)}")
    print(f"  Mean strong synapse latency:   {lat[strong].mean():.1f} ms")
    print(f"  Mean weak synapse latency:     {lat[weak].mean():.1f} ms")

print(f"\nConclusion: STDP selects early inputs via positive feedback —")
print(f"  early inputs strengthen → spike moves earlier → reinforces early synapses")
print("=" * 60)

plt.show()
