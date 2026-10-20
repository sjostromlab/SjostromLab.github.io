# Interactive Neuroscience Simulations

Interactive teaching simulations developed for PHGY 311 and other neuroscience courses at McGill University. The collection explores ion channels, synaptic transmission, neuronal excitability, plasticity, and learning.

**[Launch the simulations](https://sjostromlab.github.io/)**

## Simulations

| Simulation | Topics explored |
|---|---|
| **Single-channel Monte Carlo model** | Stochastic channel activity, summed currents, and fluctuations across repeated trials. |
| **Channel currents and I–V curves** | Deterministic population currents and current–voltage relationships for AMPA, NMDA, CP-AMPA, nAChR, GABAₐ, HCN1, Kir2.1, and Hodgkin–Huxley Na⁺ and K⁺ channels. |
| **Binomial quantal release** | How release-site number, release probability, quantal amplitude, and background noise shape synaptic responses. |
| **Heterogeneous quantal release** | What happens when binomial assumptions do not hold because release sites have different probabilities or quantal amplitudes. |
| **CV Analysis** | How changes in response mean and variability affect normalized CV analysis, and how sample size and model assumptions influence experimental conclusions. |
| **Leaky Integrate-and-Fire neuron** | Temporal integration, spike generation, and short-term synaptic depression and facilitation. |
| **Hodgkin–Huxley model** | Action potentials, ionic currents, and current- and voltage-clamp experiments. |
| **Spike-Timing-Dependent Plasticity (STDP)** | Synaptic learning and input selectivity, following the Song et al. studies from 2000 and 2001. |
| **Hopfield network** | Content-addressable memory, retrieval from noisy cues, attractor states, storage capacity, and Lyapunov energy. |

## Using the simulations

Open the website, choose a simulation, and adjust its parameters to explore how the model behaves. Each simulation includes guidance explaining its controls, model assumptions, and suggested activities.

- **Graph text size:** Available in selected simulations to improve readability.
- **PNG export:** Use a graph’s camera button to save an image.
- **Data export:** Selected simulations include download buttons that save comma-delimited data as `.txt` files.
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

## Running locally

Download or clone this repository. Most simulations can be opened directly from their HTML files, but the **single-channel Monte Carlo simulation requires a local web server** because it uses a Web Worker.

With Python 3 installed, run this command from the repository folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open **[http://localhost:8000](http://localhost:8000)** in your browser. Keep the server running while using the simulations. This serves the files only on your computer; it does not upload them.

## About

These simulations are teaching tools for exploring model behaviour and connecting mathematical descriptions with neuronal and synaptic physiology. Source-code comments document student contributions, subsequent revisions, and model references where known.

**[Visit the Sjöström Lab website](http://plasticity.muhc.mcgill.ca/index.html)**
