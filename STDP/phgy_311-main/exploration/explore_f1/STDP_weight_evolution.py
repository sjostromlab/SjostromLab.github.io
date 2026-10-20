"""
STDP Weight Evolution Over Time
================================
Runs all three conditions and plots how mean synaptic weights evolve,
showing when and how input selectivity emerges.
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from STDP_figure1 import run_selectivity_simulation


# -------------------------------------------------------------------------
# Run all three conditions
# -------------------------------------------------------------------------
print("Running STDP simulations for weight evolution analysis...")

results = {}
conditions = {
    1: "All uncorrelated",
    2: "Corr vs Uncorr",
    3: "Two correlated groups",
}

for c in [1, 2, 3]:
    print(f"\nCondition {c}: {conditions[c]}")
    weights, history, times, _ = run_selectivity_simulation(c)
    results[c] = {"weights": weights, "history": history, "times": times}

# -------------------------------------------------------------------------
# Plot weight evolution
# -------------------------------------------------------------------------
plt.figure(figsize=(14, 4))

# Condition 1: all uncorrelated — single mean line
plt.subplot(1, 3, 1)
history = results[1]["history"]
times = results[1]["times"] / 1000  # convert to seconds

mean_all = history.mean(axis=1)
plt.plot(times, mean_all, 'k-', linewidth=2, label="All inputs")
plt.xlabel("Time (s)")
plt.ylabel("Average weight (g/g$_{max}$)")
plt.title("Condition 1\n(All uncorrelated)")
plt.ylim(0, 1)
plt.legend()

# Condition 2: correlated vs uncorrelated
plt.subplot(1, 3, 2)
history = results[2]["history"]
times = results[2]["times"] / 1000

corr_mean = history[:, :50].mean(axis=1)
uncorr_mean = history[:, 50:].mean(axis=1)

plt.plot(times, corr_mean, linewidth=2, label="Correlated")
plt.plot(times, uncorr_mean, linewidth=2, label="Uncorrelated")
plt.xlabel("Time (s)")
plt.ylabel("Average weight (g/g$_{max}$)")
plt.title("Condition 2\n(Corr vs Uncorr)")
plt.ylim(0, 1)
plt.legend()

# Condition 3: two correlated groups
plt.subplot(1, 3, 3)
history = results[3]["history"]
times = results[3]["times"] / 1000

group1_mean = history[:, :50].mean(axis=1)
group2_mean = history[:, 50:].mean(axis=1)

plt.plot(times, group1_mean, linewidth=2, label="Group 1")
plt.plot(times, group2_mean, linewidth=2, label="Group 2")
plt.xlabel("Time (s)")
plt.ylabel("Average weight (g/g$_{max}$)")
plt.title("Condition 3\n(Two correlated groups)")
plt.ylim(0, 1)
plt.legend()

plt.tight_layout()
fig_dir = os.path.join(os.path.dirname(__file__), "analysis_figures")
os.makedirs(fig_dir, exist_ok=True)
plt.savefig(os.path.join(fig_dir, "weight_evolution.png"), dpi=150)
print("\nSaved analysis_figures/weight_evolution.png")
plt.show()
