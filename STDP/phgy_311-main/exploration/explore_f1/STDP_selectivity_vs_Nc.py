"""
STDP Selectivity vs Number of Correlated Inputs
=================================================
Sweeps the number of correlated inputs Nc while keeping N=100 fixed.
Answers: how many correlated neurons are required for STDP to detect a pattern?
"""

import os
import numpy as np
import matplotlib.pyplot as plt


FIG_DIR = os.path.join(os.path.dirname(__file__), "analysis_figures")
os.makedirs(FIG_DIR, exist_ok=True)


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

    return g / gmax


def selectivity_index(weights, n_corr):
    corr = weights[:n_corr].mean()
    uncorr = weights[n_corr:].mean()
    denom = corr + uncorr
    if denom == 0:
        return 0.0
    return (corr - uncorr) / denom


# -------------------------------------------------------------------------
# Sweep Nc
# -------------------------------------------------------------------------
print("Selectivity vs number of correlated inputs...")

Nc_values = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70]
selectivity_Nc = []

for nc in Nc_values:
    print(f"  Nc = {nc} ...")
    w = run_flexible_simulation(N=100, n_corr=nc, stime=500000)
    selectivity_Nc.append(selectivity_index(w, nc))

# -------------------------------------------------------------------------
# Plot
# -------------------------------------------------------------------------
plt.figure(figsize=(6, 4))
plt.plot(Nc_values, selectivity_Nc, 'ko-', linewidth=2, markersize=8)
plt.axhline(0, color='gray', linewidth=0.5)
plt.xlabel("Number of correlated inputs (Nc)")
plt.ylabel("Selectivity index  S")
plt.title("How Many Correlated Inputs Does STDP Need?")
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "selectivity_vs_Nc.png"), dpi=150)
print("\nSaved analysis_figures/selectivity_vs_Nc.png")
plt.show()
