"""
STDP Beyond the Paper: Extended Analyses
==========================================
Goes beyond Song et al. (2001) with four analyses:

1. Selectivity vs number of correlated inputs (Nc sweep)
2. Selectivity vs correlation timing width (corr_time sweep)
3. Weight distribution dynamics over time
4. Selectivity vs correlation strength for different B values (2D sweep)

Contains its own simulation function with flexible Nc/corr_time
to avoid modifying the original STDP_figure1.py.
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt

FIG_DIR = os.path.join(os.path.dirname(__file__), "analysis_figures")
os.makedirs(FIG_DIR, exist_ok=True)


# =========================================================================
# Flexible simulation (supports variable Nc and corr_time)
# =========================================================================

def run_flexible_simulation(N=100, n_corr=50, stime=500000,
                            tau_ltp=20.0, A_ltp=0.005, B=1.05,
                            Vrest=-74.0, Vth=-54.0, tau_m=20.0,
                            tau_ex=5.0, Eex=0.0, corr_time=20.0,
                            yConst=2):
    rng = np.random.default_rng()

    tau_ltd = tau_ltp
    A_ltd = A_ltp * B
    gmax = 0.015 * 50

    corri = np.zeros(N, dtype=int)
    corri[:n_corr] = 1
    mask0 = corri == 0
    mask1 = corri == 1

    dt = 1
    V = Vrest
    x = np.zeros(N)
    y = 0.0
    tpre = np.full(N, -9999999.0)
    ratesi = np.zeros(N)
    ratesp = np.zeros(N)

    g = rng.random(N) * gmax
    dur1 = max(1, round(corr_time + rng.standard_normal()))

    xa = rng.standard_normal(N)
    ratesi[mask0] = 10 * (1 + 0.3 * xa[mask0])

    corr1 = np.any(mask1)
    if corr1:
        xa = rng.standard_normal(N)
        ya = rng.standard_normal()
        ratesi[mask1] = 10 * (1 + 0.3 * xa[mask1] + yConst * ya)

    ratesi = np.maximum(ratesi, 0)
    ratesp = 1 - np.exp(-ratesi * 0.001)

    snapshot_interval = 10000
    weight_history = []
    time_points = []

    for t in range(1, stime + 1):
        if t % dur1 == 0:
            xa = rng.standard_normal(N)
            ratesi[mask0] = 10 * (1 + 0.3 * xa[mask0])
            dur1 = max(1, round(corr_time + rng.standard_normal()))

            xa = rng.standard_normal(N)
            ya = rng.standard_normal()
            if corr1:
                ratesi[mask1] = 10 * (1 + 0.3 * xa[mask1] + yConst * ya)

            ratesi = np.maximum(ratesi, 0)
            ratesp = 1 - np.exp(-ratesi * 0.001)

        gex = np.sum(g * np.exp(-(t - tpre) / tau_ex))
        dV = (Vrest - V + gex * (Eex - V)) / tau_m
        V += dV * dt

        spost = 0
        if V >= Vth:
            V = -60.0
            spost = 1
            g += gmax * A_ltp * x

        dy = (-y + spost) / tau_ltd

        spikespre = (rng.random(N) <= ratesp).astype(float)
        fired = spikespre > 0
        syn_delay = 3
        tpre[fired] = t + syn_delay

        dx = (-x + spikespre) / tau_ltp
        g[fired] -= gmax * A_ltd * y

        x += dx * dt
        y += dy * dt
        np.clip(g, 0, gmax, out=g)

        if t % snapshot_interval == 0:
            weight_history.append(g.copy() / gmax)
            time_points.append(t)

    weights = g / gmax
    return weights, np.array(weight_history), np.array(time_points), n_corr


def selectivity_index(weights, n_corr):
    corr = weights[:n_corr].mean()
    uncorr = weights[n_corr:].mean()
    denom = corr + uncorr
    if denom == 0:
        return 0.0
    return (corr - uncorr) / denom


# =========================================================================
# Analysis 1: Effect of number of correlated inputs
# =========================================================================
print("=" * 60)
print("[1/4] Selectivity vs number of correlated inputs")
print("=" * 60)

Nc_values = [5, 10, 20, 30, 40, 50]
selectivity_Nc = []

for nc in Nc_values:
    print(f"  Nc = {nc} ...")
    w, _, _, _ = run_flexible_simulation(N=100, n_corr=nc, stime=500000)
    selectivity_Nc.append(selectivity_index(w, nc))

plt.figure(figsize=(6, 4))
plt.plot(Nc_values, selectivity_Nc, 'ko-', linewidth=2, markersize=8)
plt.axhline(0, color='gray', linewidth=0.5)
plt.xlabel("Number of correlated inputs (Nc)")
plt.ylabel("Selectivity index  S")
plt.title("How Many Correlated Inputs Does STDP Need?")
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "selectivity_vs_Nc.png"), dpi=150)
print("  Saved selectivity_vs_Nc.png\n")


# =========================================================================
# Analysis 2: Effect of correlation timing width
# =========================================================================
print("=" * 60)
print("[2/4] Selectivity vs correlation timing width")
print("=" * 60)

corr_times = [1, 5, 10, 20, 40, 80]
selectivity_tau = []

for ct in corr_times:
    print(f"  corr_time = {ct} ms ...")
    w, _, _, _ = run_flexible_simulation(
        N=100, n_corr=50, stime=500000, corr_time=ct
    )
    selectivity_tau.append(selectivity_index(w, 50))

plt.figure(figsize=(6, 4))
plt.plot(corr_times, selectivity_tau, 'ko-', linewidth=2, markersize=8)
plt.axhline(0, color='gray', linewidth=0.5)
plt.xlabel("Correlation timing width (ms)")
plt.ylabel("Selectivity index  S")
plt.title("Effect of Temporal Precision on Selectivity")
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "selectivity_vs_corr_time.png"), dpi=150)
print("  Saved selectivity_vs_corr_time.png\n")


# =========================================================================
# Analysis 3: Weight distribution dynamics over time
# =========================================================================
print("=" * 60)
print("[3/4] Weight distribution dynamics")
print("=" * 60)

print("  Running baseline simulation...")
w, history, times, nc = run_flexible_simulation(
    N=100, n_corr=50, stime=500000
)

target_times = [0, 100, 300, 500]
snapshot_indices = []
for tt in target_times:
    tt_ms = tt * 1000
    idx = np.argmin(np.abs(times - tt_ms))
    snapshot_indices.append(idx)

fig, axes = plt.subplots(1, 4, figsize=(16, 4), sharey=True)
bins = np.linspace(0, 1, 25)

for i, (ax, si) in enumerate(zip(axes, snapshot_indices)):
    snapshot = history[si]
    corr_w = snapshot[:50]
    uncorr_w = snapshot[50:]

    ax.hist(corr_w, bins=bins, alpha=0.7, label="Correlated")
    ax.hist(uncorr_w, bins=bins, alpha=0.7, label="Uncorrelated")
    ax.set_xlabel("g/g$_{max}$")
    ax.set_title(f"t = {times[si]/1000:.0f} s")
    if i == 0:
        ax.set_ylabel("Count")
        ax.legend(fontsize=8)

fig.suptitle("Weight Distribution Dynamics Under STDP", fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.93])
fig.savefig(os.path.join(FIG_DIR, "weight_distribution_dynamics.png"), dpi=150)
print("  Saved weight_distribution_dynamics.png\n")


# =========================================================================
# Analysis 4: Selectivity vs correlation strength x B (2D sweep)
# =========================================================================
print("=" * 60)
print("[4/4] Selectivity vs correlation strength x B (2D sweep)")
print("=" * 60)

B_values = [0.95, 1.0, 1.05, 1.1]
yConst_values = [0, 0.5, 1, 2, 3, 5]

plt.figure(figsize=(7, 5))

for b in B_values:
    sel_list = []
    for yc in yConst_values:
        print(f"  B = {b}, yConst = {yc} ...")
        w, _, _, _ = run_flexible_simulation(
            N=100, n_corr=50, stime=500000, B=b, yConst=yc
        )
        sel_list.append(selectivity_index(w, 50))
    plt.plot(yConst_values, sel_list, 'o-', linewidth=2, markersize=7,
             label=f"B = {b}")

plt.axhline(0, color='gray', linewidth=0.5)
plt.xlabel("Correlation strength (yConst)")
plt.ylabel("Selectivity index  S")
plt.title("STDP Sensitivity: Correlation Strength vs LTD/LTP Ratio")
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "selectivity_2D_sweep.png"), dpi=150)
print("  Saved selectivity_2D_sweep.png\n")


# =========================================================================
# Summary
# =========================================================================
print("=" * 60)
print("All analyses complete. Figures saved to analysis_figures/")
print("=" * 60)

plt.show()
