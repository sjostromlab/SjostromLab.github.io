# PHGY 311 Interactive Simulations

Interactive neuroscience simulations used in PHGY 311 at McGill University to explore ion channels, synaptic transmission, neuronal excitability, and learning.

**[Launch the simulations](https://sjostromlab.github.io/)**

## Simulations

| Simulation | Topics explored |
|---|---|
| **Binomial quantal release** | How release-site number, release probability, and quantal amplitude shape synaptic responses. |
| **Heterogeneous quantal release** | Synaptic responses from up to three release sites with different release probabilities and quantal amplitudes. |
| **Single-channel Monte Carlo model** | Stochastic channel activity, summed currents, and fluctuations across repeated trials. |
| **Leaky Integrate-and-Fire neuron** | Temporal integration, spike generation, and short-term synaptic depression and facilitation. |
| **Hodgkin–Huxley model** | Action potentials, ionic currents, and current- and voltage-clamp experiments. |
| **Spike-Timing-Dependent Plasticity (STDP)** | Synaptic learning and input selectivity, following the Song et al. studies from 2000 and 2001. |
| **Hopfield network** | Content-addressable memory and retrieval from noisy patterns. |

## Using the simulations

Open the website, choose a simulation, and adjust its parameters to explore how the model behaves.

- **Graph text size:** Available in selected simulations for improving readability.
- **PNG export:** Use a graph’s camera button to save an image.
- **Trace export:** The HH and LIF simulations include a **Download** button that saves comma-delimited data as a `.txt` file.

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
