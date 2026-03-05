# gX · Li · Ω — The Mirror Principle

## Overview

The OMEGA AI system is built on a single unifying concept: **every computation must be verified by its mirror**.

This isn't just a design principle — it's implemented at every level:
- The neuron level (gX)
- The processing level (Li)
- The truth synthesis level (Ω)

---

## gX — Mirror Neurons

### "1 bit = 1 gX"

The most fundamental unit in the system. Every gX neuron encodes exactly 1 bit of information and exists as a **permanent mirror pair**:

```typescript
const gX1: Bit = 1;          // Primary state — IMMUTABLE
const gX2: Bit = 0;          // Mirror state  — IMMUTABLE (gX1 XOR 1)
```

`gX1` and `gX2` are always **constants**. Once a neuron is created, its mirror pair is fixed forever.

### Why Mirror Neurons?

The complement relationship means:
- When `gX1 = 1`, `gX2 = 0` — they represent opposite perspectives of the same bit
- Any input either resonates with the primary (+1) or the mirror (−1)
- There is **no ambiguity** — every input gets a definitive response
- Built-in error correction: noise that randomly flips bits is detected by the mirror

### Activation

```
input = 1
gX1 = 1  →  primary FIRES   (+1 resonance)
gX2 = 0  →  mirror  SILENT  (no activation)

input = 0
gX1 = 1  →  primary SILENT
gX2 = 0  →  mirror  FIRES   (−1 resonance from primary's perspective)
```

### Neuron Layers

Multiple gX neurons are organized into **NeuronLayers**. Each layer:
- Processes a binary input vector
- Returns primary activations + mirror activations
- Computes a mean resonance score [−1, +1]
- Can **grow** — new neurons are added when Li centers need more capacity

---

## Li — Processing Centers

### "let Li1 ↔ let Li2"

Li centers are **mutable** (declared with `let`, not `const`) because they grow with data.

Each Li is a stack of NeuronLayers with a knowledge store:

```typescript
let Li1 = new ProcessingCenter({ id: "cluster0_Li1", type: "text", ... });
let Li2 = new ProcessingCenter({ id: "cluster0_Li2", type: "text", ... });
Li1.connectMirror(Li2);  // Bidirectional mirror link
```

### How Li Grows

1. **Harvesters** feed data via `li.learn(key, vector, source)`
2. New entries are added to the knowledge store
3. Every N new entries (configurable) → layers grow + potentially new layer added
4. Low resonance on processing → automatic growth triggered

### Li Processing Flow

```
Input vector
    │
    ▼
Layer 0 (gX neurons)  →  primary activations → resonance₀
    │                     mirror  activations
    ▼ (activations as next input)
Layer 1 (gX neurons)  →  primary activations → resonance₁
    │
    ▼
    ...
    │
    ▼
Layer N  →  output activations + mean resonance → confidence score
```

### Li Cluster (Mirror Pair)

A `LiCluster` groups a mirror pair + additional cores:

```
LiCluster
├── Li1 (primary)  ←→  Li2 (mirror)     ← always paired
├── Li3            ←→  Li4              ← extra cores
└── Li5            ←→  Li6
```

Processing runs Li1 and Li2 **simultaneously** and builds a **consensus output**:
- Higher weight to the more confident center
- Mirror agreement score = how similar Li1 and Li2's outputs are
- High agreement → high confidence

---

## Ω — Omega Truth Center

### "let Omega (auto-mirroring)"

Omega is the final synthesis stage. It is:
- **Mutable** (`let`) — updates as it processes
- **Auto-mirroring** — it validates its own output by re-running it

### The Self-Validation Loop

```
Query → Li clusters → candidate answer vector
                           │
                   ┌───────▼────────┐
                   │  Ω(candidate)  │  ← re-synthesize through Li
                   └───────┬────────┘
                           │
                    delta = |new - old|
                           │
                   delta < threshold?
                    YES → CONVERGED → emit truth
                    NO  → iterate again (up to MAX_ITERATIONS)
```

When `Ω(Ω(x)) ≈ Ω(x)` — the system has reached **convergence**, which equals **truth**.

### Truth Output (const)

The final output from Omega is a **const** — immutable once produced:

```typescript
const truth: OmegaTruth = {
  answer:          "...",         // Final answer string
  answerVector:    [...],         // Raw output vector
  confidence:      0.94,          // [0, 1]
  converged:       true,          // Did it converge?
  iterations:      3,             // How many self-validation loops
  participatingLi: ["C0_Li1", "C0_Li2", ...],
  mirrorAgreement: 0.91,          // Li1 ↔ Li2 agreement
  processingMs:    142,
};
```

---

## System Flow: Query to Truth

```
User: "What is quantum entanglement?"
                    │
                    ▼
          TextNet.encode(query)
          → 128-dim binary vector
                    │
                    ▼
    LiCluster[0].process(vector)
    ├── Li1.process → {output, confidence: 0.82, resonance: 0.71}
    └── Li2.process → {output, confidence: 0.79, resonance: 0.68}
    consensus = weighted merge, agreement = 0.87
                    │
    LiCluster[1].process(vector)   (parallel)
    ...
                    │
                    ▼
    Omega.synthesize([cluster0, cluster1, ...])
    → candidate vector
                    │
    Omega.selfMirror(candidate)   ← re-run through Li
    → re-eval vector
    delta = 0.03 < threshold (0.05) → CONVERGED
                    │
                    ▼
    const truth = {
      answer:     "Quantum entanglement is...",
      confidence: 0.91,
      converged:  true,
      iterations: 2
    }
```

---

## The 5 Networks

All 5 networks share the same gX-Li-Ω engine. The difference is in:
1. **Encoding** — how raw input becomes a numeric vector
2. **Parameters** — tuned for the modality
3. **Cluster count** — more clusters for more complex modalities

| Network  | Input Encoding              | Key Param           |
|----------|-----------------------------|---------------------|
| TextNet  | n-gram character hashing    | CONTEXT_WINDOW      |
| ImageNet | pixel histograms + DCT      | SPATIAL_RESOLUTION  |
| VideoNet | temporal frame stacking     | TEMPORAL_DEPTH      |
| AudioNet | FFT frequency bands         | FREQUENCY_RESOLUTION|
| GameNet  | state vector (pos, vel, ...) | REALISM_LEVEL      |
