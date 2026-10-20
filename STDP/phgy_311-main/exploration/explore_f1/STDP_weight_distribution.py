"""
STDP Weight Distribution Analysis
==================================
Runs all three conditions and plots histograms of equilibrium synaptic weights.
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
print("Running STDP simulations for weight distribution analysis...")

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
# Plot weight distributions
# -------------------------------------------------------------------------
plt.figure(figsize=(12, 4))

# Condition 1
plt.subplot(1, 3, 1)
weights = results[1]["weights"]
plt.hist(weights, bins=20)
plt.title("Condition 1\n(All uncorrelated)")
plt.xlabel("g/gmax")
plt.ylabel("Count")

# Condition 2
plt.subplot(1, 3, 2)
corr_weights = results[2]["weights"][:50]
uncorr_weights = results[2]["weights"][50:]

bins = np.linspace(0, 1, 30)

plt.hist(corr_weights, bins=bins, alpha=0.7, label="Correlated")
plt.hist(uncorr_weights, bins=bins, alpha=0.7, label="Uncorrelated")
plt.title("Condition 2\n(Corr vs Uncorr)")
plt.xlabel("g/gmax")
plt.legend()

# Condition 3
plt.subplot(1, 3, 3)
group1 = results[3]["weights"][:50]
group2 = results[3]["weights"][50:]

plt.hist(group1, bins=bins, alpha=0.7, label="Group 1")
plt.hist(group2, bins=bins, alpha=0.7, label="Group 2")
plt.title("Condition 3\n(Two correlated groups)")
plt.xlabel("g/gmax")
plt.legend()

plt.tight_layout()
fig_dir = os.path.join(os.path.dirname(__file__), "analysis_figures")
os.makedirs(fig_dir, exist_ok=True)
plt.savefig(os.path.join(fig_dir, "weight_distribution.png"), dpi=150)
print("\nSaved analysis_figures/weight_distribution.png")
plt.show()
