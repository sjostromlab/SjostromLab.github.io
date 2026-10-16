# PHGY 311 Interactive Simulations

Interactive neuroscience simulations used in PHGY 311 at McGill University to explore ion channels, synaptic transmission, neuronal excitability, and learning.

**[Launch the simulations](https://sjostromlab.github.io/)**

## Simulations

| Simulation | Topics explored |
|---|---|
| **Single-channel Monte Carlo model** | Stochastic channel activity, summed currents, and fluctuations across repeated trials. |
| **Binomial quantal release** | How release-site number, release probability, and quantal amplitude shape synaptic responses. |
| **Heterogeneous quantal release** | Synaptic responses from up to three release sites with different release probabilities and quantal amplitudes. |
| **CV Analysis** | How changes in response means and variability affect normalized CV analysis, and how sample size influences experimental reliability. |
| **Leaky Integrate-and-Fire neuron** | Temporal integration, spike generation, and short-term synaptic depression and facilitation. |
| **Hodgkin–Huxley model** | Action potentials, ionic currents, and current- and voltage-clamp experiments. |
| **Spike-Timing-Dependent Plasticity (STDP)** | Synaptic learning and input selectivity, following the Song et al. studies from 2000 and 2001. |
| **Hopfield network** | Content-addressable memory and retrieval from noisy patterns. |

## Using the simulations

Open the website, choose a simulation, and adjust its parameters to explore how the model behaves.

- **Graph text size:** Available in selected simulations for improving readability.
- **PNG export:** Use a graph’s camera button to save an image.
- **Trace export:** The HH, LIF, and CV Analysis simulations include download buttons that save comma-delimited data as `.txt` files.

### CV Analysis

Adjust baseline and post-induction means, standard deviations, and response counts. Compare two experiments using side-by-side time-course and normalized 1/CV²-versus-mean plots.

- Show theoretical points alongside results calculated from simulated responses.
- Reveal sample statistics and normalized coordinates with **Show calculations**.
- Use **New seed** to repeat an experiment with fresh random responses.
- Uncheck **Reuse random seed** to generate fresh samples when adjusting parameters.
- Explore how small sample sizes increase variability in the estimated outcomes.
- Download response traces and observed CV-analysis coordinates.

The simulation uses Gaussian response samples based on P. Jesper Sjöström’s Igor Pro teaching code, with reference to Brock et al. (2020), *A Practical Guide to Using CV Analysis for Determining the Locus of Synaptic Plasticity* ([paper](https://doi.org/10.3389/fnsyn.2020.00011); [accompanying Igor code](https://github.com/pj-sjostrom/Sim_CV_analysis)). CV-analysis coordinates alone do not uniquely identify a plasticity mechanism; interpretation depends on the underlying model assumptions.

## Running locally

Download or clone this repository. Some simulations can be opened directly from their HTML files, but the **single-channel Monte Carlo simulation requires a web server**.

With Python 3 installed, run this command from the repository folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open **http://localhost:8000** in your browser. Keep the server running while using the simulations. This serves the files only on your computer; it does not upload them.

## About

These simulations are teaching tools for exploring model behaviour and connecting mathematical descriptions with neuronal and synaptic physiology.

**[Visit the Sjöström Lab website](http://plasticity.muhc.mcgill.ca/index.html)**
