"""
STDP Figure 4 — Section 3: Parameter Sensitivity Analysis
===========================================================
Explores how temporal selectivity depends on key parameters:

1. LTD/LTP ratio (B)
2. STDP time constant (tau)
3. Number of inputs (N)
4. Latency spread (latency_std)
5. Burst rate
6. Burst duration
7. Latency noise
8. Two latency populations (qualitative)

Each sweep shares latencies where appropriate (matching MATLAB scripts).
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
rng_shared = np.random.default_rng(42)
shared_latencies = rng_shared.standard_normal(N) * 15


# =========================================================================
# 1. B sweep (shared latencies)
# =========================================================================
print("=" * 60)
print("[1/8] LTD/LTP ratio (B) sweep")
print("=" * 60)

B_values = [0.8, 0.95, 1.05, 1.2, 1.5]

fig, axes = plt.subplots(2, 3, figsize=(15, 8))
axes_flat = axes.flatten()
for i, B in enumerate(B_values):
    print(f"  B = {B}")
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=N, B=B, latencies=shared_latencies.copy()
    )
    ax = axes_flat[i]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"B = {B}", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)
axes_flat[5].set_visible(False)

fig.suptitle("Effect of LTD/LTP Ratio on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_B_sweep.png"), dpi=150)
print("  Saved figure4_B_sweep.png\n")


# =========================================================================
# 2. Tau sweep (fresh latencies per run)
# =========================================================================
print("=" * 60)
print("[2/8] STDP time constant (tau) sweep")
print("=" * 60)

tau_values = [10, 20, 40, 80]

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
for i, tau in enumerate(tau_values):
    print(f"  tau = {tau} ms")
    latencies = np.random.default_rng().standard_normal(N) * 15
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=N, B=1.05, tau_ltp=tau, tau_ltd=tau, latencies=latencies
    )
    ax = axes[i // 2, i % 2]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"tau = {tau} ms", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)

fig.suptitle("Effect of STDP Time Constant on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_tau_sweep.png"), dpi=150)
print("  Saved figure4_tau_sweep.png\n")


# =========================================================================
# 3. N sweep (fresh latencies per run)
# =========================================================================
print("=" * 60)
print("[3/8] Number of inputs (N) sweep")
print("=" * 60)

N_values = [100, 300, 500, 1000, 2000]

fig, axes = plt.subplots(2, 3, figsize=(15, 8))
axes_flat = axes.flatten()
for i, Nv in enumerate(N_values):
    print(f"  N = {Nv}")
    latencies = np.random.default_rng().standard_normal(Nv) * 15
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=Nv, B=1.05, latencies=latencies
    )
    ax = axes_flat[i]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"N = {Nv}", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)
axes_flat[5].set_visible(False)

fig.suptitle("Effect of Number of Inputs on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_N_sweep.png"), dpi=150)
print("  Saved figure4_N_sweep.png\n")


# =========================================================================
# 4. Latency spread sweep (fresh latencies per run)
# =========================================================================
print("=" * 60)
print("[4/8] Latency spread (std) sweep")
print("=" * 60)

lat_std_values = [5, 10, 15, 25, 40]

fig, axes = plt.subplots(2, 3, figsize=(15, 8))
axes_flat = axes.flatten()
for i, std in enumerate(lat_std_values):
    print(f"  STD = {std} ms")
    latencies = np.random.default_rng().standard_normal(N) * std
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=N, B=1.05, latencies=latencies
    )
    ax = axes_flat[i]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"STD = {std} ms", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)
axes_flat[5].set_visible(False)

fig.suptitle("Effect of Latency Spread on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_latency_sweep.png"), dpi=150)
print("  Saved figure4_latency_sweep.png\n")


# =========================================================================
# 5. Burst rate sweep (shared latencies)
# =========================================================================
print("=" * 60)
print("[5/8] Burst rate sweep")
print("=" * 60)

burstrate_values = [20, 50, 100, 200]

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
for i, br in enumerate(burstrate_values):
    print(f"  Burst rate = {br} Hz")
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=N, B=1.05, burstrate=br, latencies=shared_latencies.copy()
    )
    ax = axes[i // 2, i % 2]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"Burst rate = {br} Hz", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)

fig.suptitle("Effect of Burst Rate on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_burstrate_sweep.png"), dpi=150)
print("  Saved figure4_burstrate_sweep.png\n")


# =========================================================================
# 6. Burst duration sweep (shared latencies)
# =========================================================================
print("=" * 60)
print("[6/8] Burst duration sweep")
print("=" * 60)

burstdur_values = [5, 10, 20, 40, 80]

fig, axes = plt.subplots(2, 3, figsize=(15, 8))
axes_flat = axes.flatten()
for i, bd in enumerate(burstdur_values):
    print(f"  Burst duration = {bd} ms")
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=N, B=1.05, burstdur=bd, latencies=shared_latencies.copy()
    )
    ax = axes_flat[i]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"Burst duration = {bd} ms", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)
axes_flat[5].set_visible(False)

fig.suptitle("Effect of Burst Duration on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_burstdur_sweep.png"), dpi=150)
print("  Saved figure4_burstdur_sweep.png\n")


# =========================================================================
# 7. Noise sweep
# =========================================================================
print("=" * 60)
print("[7/8] Latency noise sweep")
print("=" * 60)

noise_values = [0, 5, 10, 20]

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
for i, noise in enumerate(noise_values):
    print(f"  Noise = {noise} ms")
    rng = np.random.default_rng()
    latencies = rng.standard_normal(N) * 15 + rng.standard_normal(N) * noise
    lat, w, _, _, _, _, _ = run_latency_simulation(
        N=N, B=1.05, latencies=latencies
    )
    ax = axes[i // 2, i % 2]
    ax.scatter(lat, w, s=10, c='black', edgecolors='none')
    ax.set_xlabel("Latency (ms)")
    ax.set_ylabel("g/g$_{max}$")
    ax.set_title(f"Noise = {noise} ms", fontweight='bold')
    ax.set_xlim(-55, 55)
    ax.set_ylim(0, 1)

fig.suptitle("Effect of Latency Noise on Temporal Selectivity",
             fontsize=14, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.95])
fig.savefig(os.path.join(FIG_DIR, "figure4_noise_sweep.png"), dpi=150)
print("  Saved figure4_noise_sweep.png\n")


# =========================================================================
# 8. Two latency populations
# =========================================================================
print("=" * 60)
print("[8/8] Two latency populations")
print("=" * 60)

rng = np.random.default_rng(42)
lat1 = rng.standard_normal(N // 2) * 5 - 20
lat2 = rng.standard_normal(N // 2) * 5 + 20
latencies = np.concatenate([lat1, lat2])

lat, w, _, _, _, _, _ = run_latency_simulation(
    N=N, B=1.05, latencies=latencies
)

plt.figure(figsize=(6, 4))
plt.scatter(lat, w, s=10, c='black', edgecolors='none')
plt.xlabel("Latency (ms)")
plt.ylabel("g/g$_{max}$")
plt.title("Two Latency Populations", fontweight='bold')
plt.ylim(0, 1)
plt.tight_layout()
plt.savefig(os.path.join(FIG_DIR, "figure4_two_populations.png"), dpi=150)
print("  Saved figure4_two_populations.png\n")


# =========================================================================
# 9. Summary: Final spike latency vs parameter
# =========================================================================
print("=" * 60)
print("[9/9] Summary: final spike latency vs B and tau")
print("=" * 60)

fig, (ax_b, ax_tau) = plt.subplots(1, 2, figsize=(12, 4))

# B sweep — measure final spike latency
B_summary = [0.8, 0.9, 0.95, 1.0, 1.05, 1.1, 1.2, 1.5]
final_lat_B = []
for B in B_summary:
    print(f"  B = {B}")
    _, _, _, _, _, _, slat = run_latency_simulation(
        N=N, B=B, latencies=shared_latencies.copy()
    )
    valid = slat[~np.isnan(slat)]
    final_lat_B.append(np.mean(valid[-100:]) if len(valid) >= 100 else np.nan)

ax_b.plot(B_summary, final_lat_B, 'ko-', linewidth=2, markersize=8)
ax_b.set_xlabel("B  (A$_-$ / A$_+$)")
ax_b.set_ylabel("Final spike latency (ms)")
ax_b.set_title("Spike Latency vs LTD/LTP Ratio", fontweight='bold')
ax_b.grid(True, alpha=0.3)

# Tau sweep — measure final spike latency
tau_summary = [5, 10, 20, 40, 60, 80]
final_lat_tau = []
for tau in tau_summary:
    print(f"  tau = {tau} ms")
    latencies = np.random.default_rng().standard_normal(N) * 15
    _, _, _, _, _, _, slat = run_latency_simulation(
        N=N, B=1.05, tau_ltp=tau, tau_ltd=tau, latencies=latencies
    )
    valid = slat[~np.isnan(slat)]
    final_lat_tau.append(np.mean(valid[-100:]) if len(valid) >= 100 else np.nan)

ax_tau.plot(tau_summary, final_lat_tau, 'ko-', linewidth=2, markersize=8)
ax_tau.set_xlabel("tau (ms)")
ax_tau.set_ylabel("Final spike latency (ms)")
ax_tau.set_title("Spike Latency vs STDP Time Constant", fontweight='bold')
ax_tau.grid(True, alpha=0.3)

fig.suptitle("Quantitative Summary: How Parameters Affect Response Timing",
             fontsize=13, fontweight='bold')
fig.tight_layout(rect=[0, 0, 1, 0.93])
fig.savefig(os.path.join(FIG_DIR, "figure4_summary_latency.png"), dpi=150)
print("  Saved figure4_summary_latency.png\n")


# =========================================================================
# Done
# =========================================================================
print("=" * 60)
print("Section 3 complete. All figures saved to figures/")
print("=" * 60)

plt.show()
