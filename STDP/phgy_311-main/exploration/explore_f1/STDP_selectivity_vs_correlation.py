"""
STDP Selectivity vs Correlation Strength
==========================================
Sweeps yConst values for condition 2 and plots how selectivity
(correlated vs uncorrelated weight difference) depends on
input correlation strength.
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from STDP_figure1 import run_selectivity_simulation


def selectivity_index(weights, n_corr=50):
    corr = weights[:n_corr].mean()
    uncorr = weights[n_corr:].mean()
    denom = corr + uncorr
    if denom == 0:
        return 0.0
    return (corr - uncorr) / denom


# -------------------------------------------------------------------------
# Sweep correlation strength
# -------------------------------------------------------------------------
print("Sweeping correlation strength (yConst) for condition 2...")

correlation_levels = [0, 0.5, 1, 2, 3, 5]
selectivity = []

for y in correlation_levels:
    print(f"  yConst = {y} ...")
    weights, _, _, _ = run_selectivity_simulation(
        condition=2, stime=500000, yConst_override=y
    )
    selectivity.append(selectivity_index(weights))

# -------------------------------------------------------------------------
# Plot
# -------------------------------------------------------------------------
plt.figure(figsize=(6, 4))

plt.plot(correlation_levels, selectivity, 'ko-', linewidth=2, markersize=8)
plt.axhline(0, color='gray', linewidth=0.5)

plt.xlabel("Correlation strength (yConst)")
plt.ylabel("Selectivity index  S")
plt.title("Selectivity vs Input Correlation Strength")

plt.tight_layout()
fig_dir = os.path.join(os.path.dirname(__file__), "analysis_figures")
os.makedirs(fig_dir, exist_ok=True)
plt.savefig(os.path.join(fig_dir, "selectivity_vs_correlation.png"), dpi=150)
print("\nSaved analysis_figures/selectivity_vs_correlation.png")
plt.show()
