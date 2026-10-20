"""
STDP Figure 4: Latency Reduction During Learning
==================================================
Shows that STDP causes the postsynaptic neuron to spike earlier
over training iterations, demonstrating temporal sharpening.

Three plots:
  1. Smoothed spike latency vs training iteration
  2. Early vs late training spike latency comparison
  3. Weight vs latency (before and after)
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from STDP_figure4 import run_latency_simulation

FIG_DIR = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(FIG_DIR, exist_ok=True)

# -------------------------------------------------------------------------
# Run simulation
# -------------------------------------------------------------------------
print("Running Figure 4: Latency reduction analysis...")

latencies, weights, initial_weights, initial_V, final_V, snapshots, spike_latency = \
    run_latency_simulation()

# -------------------------------------------------------------------------
# Figure 1: Smoothed latency over training
# -------------------------------------------------------------------------
fig1, ax1 = plt.subplots(figsize=(7, 4))

# Smooth with moving average (window=50)
window = 50
valid = ~np.isnan(spike_latency)
lat_smooth = np.convolve(
    np.where(valid, spike_latency, 0),
    np.ones(window) / window, mode='same'
)
# Mask edges where convolution is unreliable
lat_smooth[:window // 2] = np.nan
lat_smooth[-(window // 2):] = np.nan

trials = np.arange(1, len(spike_latency) + 1)

ax1.plot(trials, lat_smooth, 'k-', linewidth=2)
ax1.set_xlabel("Training iteration")
ax1.set_ylabel("Postsynaptic spike latency (ms)")
ax1.set_title("Latency Reduction During STDP Learning", fontweight='bold')
ax1.grid(True, alpha=0.3)

fig1.tight_layout()
fig1.savefig(os.path.join(FIG_DIR, "figure4_latency_reduction.png"), dpi=150)
print("  Saved figures/figure4_latency_reduction.png")

# -------------------------------------------------------------------------
# Figure 2: Early vs late training
# -------------------------------------------------------------------------
fig2, (ax2a, ax2b) = plt.subplots(1, 2, figsize=(12, 4), sharey=True)

n_show = 100

ax2a.plot(spike_latency[:n_show], 'k-', linewidth=1.5)
ax2a.set_xlabel("Training iteration")
ax2a.set_ylabel("Spike latency (ms)")
ax2a.set_title("Early Training", fontweight='bold')
ax2a.grid(True, alpha=0.3)

ax2b.plot(range(len(spike_latency) - n_show, len(spike_latency)),
          spike_latency[-n_show:], 'k-', linewidth=1.5)
ax2b.set_xlabel("Training iteration")
ax2b.set_title("Late Training", fontweight='bold')
ax2b.grid(True, alpha=0.3)

fig2.suptitle("Spike Timing: Early vs Late Training", fontweight='bold')
fig2.tight_layout(rect=[0, 0, 1, 0.93])
fig2.savefig(os.path.join(FIG_DIR, "figure4_early_vs_late.png"), dpi=150)
print("  Saved figures/figure4_early_vs_late.png")

# -------------------------------------------------------------------------
# Figure 3: Weight vs latency (before and after)
# -------------------------------------------------------------------------
fig3, (ax3a, ax3b) = plt.subplots(1, 2, figsize=(12, 4))

ax3a.scatter(latencies, initial_weights, s=10, c='black', edgecolors='none')
ax3a.set_xlabel("Latency (ms)")
ax3a.set_ylabel("g/g$_{max}$")
ax3a.set_title("Before STDP", fontweight='bold')
ax3a.set_xlim(-55, 55)
ax3a.set_ylim(0, 1)

ax3b.scatter(latencies, weights, s=10, c='black', edgecolors='none')
ax3b.set_xlabel("Latency (ms)")
ax3b.set_ylabel("g/g$_{max}$")
ax3b.set_title("After STDP", fontweight='bold')
ax3b.set_xlim(-55, 55)
ax3b.set_ylim(0, 1)

fig3.suptitle("Synaptic Weights: Before vs After Learning", fontweight='bold')
fig3.tight_layout(rect=[0, 0, 1, 0.93])
fig3.savefig(os.path.join(FIG_DIR, "figure4_weights_before_after.png"), dpi=150)
print("  Saved figures/figure4_weights_before_after.png")

plt.show()
