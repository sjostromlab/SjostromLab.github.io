# Interactive Neuroscience Simulations

Interactive teaching simulations developed for PHGY 311 and other neuroscience courses at McGill University. The collection explores membrane potentials, ion channels, neuronal excitability, electrophysiological recording, synaptic transmission, plasticity, population coding, and learning.

**[Launch the simulations](https://sjostromlab.github.io/)**

## Simulations

### Membrane Potentials and Excitability

| Simulation | Topics explored |
|---|---|
| **Nernst & Goldman Potentials** | How concentration gradients and relative permeabilities determine ionic equilibrium potentials, membrane potential, and conventional current direction. |
| **Channel Currents & I–V Curves** | Deterministic population currents and current–voltage relationships for AMPA, NMDA, CP-AMPA, nAChR, GABA<sub>A</sub>, HCN1, Kir2.1, and Hodgkin–Huxley Na<sup>+</sup> and K<sup>+</sup> channels. |
| **Hodgkin–Huxley** | Action potentials, ionic currents, current- and voltage-clamp experiments, and active or failing propagation along a stick dendrite. |
| **Integrate-and-Fire** | Temporal integration, spike generation, and short-term synaptic depression and facilitation. |
| **Passive Dendrites** | How cable properties attenuate, delay, and broaden signals as they spread through a dendrite. |

### Synaptic Transmission and Plasticity

| Simulation | Topics explored |
|---|---|
| **Single-Channel Activity** | Stochastic channel openings, single-channel currents, summed currents, and trial-to-trial fluctuations. |
| **Quantal Release** | How release-site number, release probability, quantal amplitude, and background noise shape binomial synaptic responses. |
| **Heterogeneous Release** | How different release probabilities or quantal amplitudes produce non-binomial synaptic responses. |
| **CV Analysis** | How response mean and variability inform normalized CV analysis, and how sample size and model assumptions influence experimental conclusions. |
| **Spike-Timing-Dependent Plasticity (STDP)** | Synaptic learning and input selectivity, following the Song et al. studies from 2000 and 2001. |

### Coding and Networks

| Simulation | Topics explored |
|---|---|
| **Population Coding** | Directional tuning curves, stochastic spike trains, population-vector and maximum-likelihood decoding, and decoding accuracy. |
| **Hopfield Memory** | Content-addressable memory, retrieval from noisy cues, attractor states, storage capacity, and Lyapunov energy. |

### Electrophysiology and Recording

| Simulation | Topics explored |
|---|---|
| **Series Resistance in Current Clamp** | How electrode resistance and capacitance distort passive responses and action potentials, why EPSPs are less affected, and what bridge balance can and cannot correct. |
| **Series Resistance in Voltage Clamp** | Voltage-control error, current distortion, series-resistance compensation, and post-hoc correction of synaptic and I–V measurements. |

## Using the Simulations

Open the website, choose a simulation, and adjust its parameters to explore how the model behaves. Each simulation includes guidance explaining its controls, model assumptions, suggested activities, and relevant references.

- **Graph text size:** Available in selected simulations to improve readability.
- **PNG export:** Use a graph’s camera button to save an image.
- **CSV export:** Applicable simulations include a compact **Download data** button for saving tabular data in a consistent comma-separated format.
- **Main menu:** Use the footer link to return to the simulation menu.

### CV Analysis

The CV Analysis simulation offers two input modes:

1. **Mean and SDev:** Specify the response mean and standard deviation before and after induction.
2. **Binomial n, p, and q:** Generate responses from the number of release sites, release probability, and quantal amplitude.

The simulation also allows users to:

- Compare two experiments using side-by-side plasticity time courses and normalized 1/CV²-versus-mean plots.
- Add shared background noise and optionally correct the CV calculation for its variance.
- Change the number of baseline and post-induction responses.
- Show theoretical points alongside results calculated from simulated samples.
- Reveal sample statistics and normalized coordinates with **Show calculations**.
- Use **New seed** to repeat an experiment with fresh random responses.
- Use **Reuse random seed** to distinguish parameter effects from random sampling variability.
- Explore how small sample sizes reduce the reliability of estimated outcomes.
- Download simulated responses and CV-analysis coordinates.

The simulation is based on P. Jesper Sjöström’s Igor Pro teaching code and informed by:

- Faber DS and Korn H (1991), *Applicability of the coefficient of variation method for analyzing synaptic plasticity*. [Biophysical Journal](https://doi.org/10.1016/S0006-3495(91)82162-2).
- Brock JA, Thomazeau A, Watanabe A, Li SSY, and Sjöström PJ (2020), *A Practical Guide to Using CV Analysis for Determining the Locus of Synaptic Plasticity*. [Frontiers in Synaptic Neuroscience](https://doi.org/10.3389/fnsyn.2020.00011). The accompanying Igor Pro code is available on [GitHub](https://github.com/pj-sjostrom/Sim_CV_analysis).

CV-analysis coordinates do not uniquely identify a plasticity mechanism. Their interpretation depends on the underlying assumptions, sources of variability, and experimental design.

## Running Locally

Download or clone this repository. Most simulations can be opened directly from their HTML files, but the **Single-Channel Activity simulation requires a local web server** because it uses a Web Worker.

With Python 3 installed, run this command from the repository folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open **[http://localhost:8000](http://localhost:8000)** in your browser. Keep the server running while using the simulations. This serves the files only on your computer; it does not upload them.

## About

These simulations are teaching tools for exploring model behaviour and connecting mathematical descriptions with neuronal and synaptic physiology. Source-code comments document provenance, contributions, subsequent revisions, and model references where known.

**[Visit the Sjöström Lab website](http://plasticity.muhc.mcgill.ca/index.html)**
