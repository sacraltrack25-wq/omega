# Training Parameters — Full Reference

All 35 parameters with descriptions, ranges, and effects.

---

## Learning

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `LEARNING_RATE` | 0.001 | 0.00001–0.1 | How fast gX resonance scores update. Too high = unstable. Too low = slow convergence. |
| `MOMENTUM` | 0.9 | 0–1 | Inertia of training updates. Prevents oscillation. |
| `WEIGHT_DECAY` | 0.01 | 0–0.01 | Slow decay of old patterns. Enables forgetting. |
| `DROPOUT_RATE` | 0.1 | 0–0.5 | Random noise injection during training. Prevents overfitting. |
| `REGULARIZATION_STRENGTH` | 0.0001 | 0–0.001 | L2 penalty on large activations. |
| `BATCH_SIZE` | 32 | 1–512 | Data items processed per training step. |
| `WARMUP_STEPS` | 500 | 0–5000 | Gradual learning rate ramp-up at start. |

---

## Mirror Principle

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `MIRROR_SYNC_RATE` | 0.95 | 0–1 | How tightly gX1/gX2 pairs maintain synchronization. |
| `MIRROR_DIVERGENCE_TOLERANCE` | 0.15 | 0–0.5 | Max allowed divergence between mirror pairs before auto-resync. |
| `MIRROR_AGREEMENT_REQUIRED` | true | bool | If true, Li1 and Li2 must agree before Omega accepts output. |

---

## gX Architecture

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `NEURON_DENSITY` | 128 | 16–2048 | Number of gX neurons per layer. More = richer representations. |
| `LAYER_DEPTH` | 6 | 1–32 | Number of gX layers per Li center. More = deeper reasoning. |

---

## Li Processing Centers

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `LI_CORE_COUNT` | 8 | 2–64 | Number of Li core pairs per cluster. More = parallel processing. |
| `LI_GROWTH_RATE` | 0.1 | 0–0.5 | Fraction of neurons added when Li grows. |
| `LI_MERGE_THRESHOLD` | 0.85 | 0.5–1 | Cosine similarity above which redundant Li centers are merged. |
| `LI_LAYER_SPAWN_THRESHOLD` | 1000 | 100–10000 | New knowledge entries before a new layer is added. |
| `LI_PARTICIPATION_MIN` | 2 | 1–10 | Minimum Li clusters required for a valid Omega output. |

---

## Omega Truth Center

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `OMEGA_CONVERGENCE_THRESHOLD` | 0.95 | 0.5–1 | Confidence required to accept Omega output as truth. |
| `OMEGA_MAX_ITERATIONS` | 10 | 1–50 | Maximum self-validation loop iterations. |
| `OMEGA_SELF_VALIDATION_DEPTH` | 3 | 1–10 | How many layers deep the self-mirror check goes. |
| `TRUTH_CONFIDENCE_THRESHOLD` | 0.75 | 0.5–1 | Minimum confidence to emit a final answer (below = "uncertain"). |

---

## Memory & Storage

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `CACHE_SIZE` | 10000 | 1000–1M | Working memory entries per Li center. |
| `MEMORY_CONSOLIDATION_CYCLE` | 1000 | 100–10000 | Steps between consolidation sweeps (prune weak knowledge). |

---

## Data & Harvesters

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `DATA_QUALITY_THRESHOLD` | 0.7 | 0–1 | Minimum quality score to accept harvested data. |
| `DEDUPLICATION_THRESHOLD` | 0.92 | 0–1 | Similarity above which data is considered duplicate and skipped. |

---

## Generative / Creative

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `ENTROPY_REGULATION` | 0.5 | 0–1 | 0 = fully deterministic; 1 = maximum creativity/randomness. |
| `PATTERN_SENSITIVITY` | 0.3 | 0–1 | Minimum pattern signal strength to learn. Lower = more patterns learned. |
| `ANOMALY_DETECTION_THRESHOLD` | 0.85 | 0–1 | Confidence above which an input is flagged as anomalous. |

---

## Cross-Network

| Parameter | Default | Range | Effect |
|-----------|---------|-------|--------|
| `CROSS_NETWORK_TRANSFER` | 0.3 | 0–1 | Fraction of learned features shared across the 5 networks. |

---

## Network-Specific

| Parameter | Network | Default | Range | Effect |
|-----------|---------|---------|-------|--------|
| `CONTEXT_WINDOW` | TextNet | 4096 | 256–32768 | Token context window. Larger = better memory. |
| `TEMPORAL_DEPTH` | VideoNet, AudioNet | 64 | 8–512 | Look-back window in frames/samples. |
| `SPATIAL_RESOLUTION` | ImageNet, VideoNet, GameNet | 4 | 1–8 | Detail level. 8 = ultra-high detail. |
| `FREQUENCY_RESOLUTION` | AudioNet | 256 | 32–1024 | Number of audio frequency bands. |
| `REALISM_LEVEL` | GameNet | 3 | 1–5 | Physics + visual AI depth. 5 = ultra-realistic simulation. |

---

## Recommended Presets

### Fast / Lightweight
```env
NEURON_DENSITY=64
LAYER_DEPTH=3
LI_CORE_COUNT=4
OMEGA_MAX_ITERATIONS=5
CONTEXT_WINDOW=1024
```

### Balanced (default)
```env
NEURON_DENSITY=128
LAYER_DEPTH=6
LI_CORE_COUNT=8
OMEGA_MAX_ITERATIONS=10
CONTEXT_WINDOW=4096
```

### Deep / High Quality
```env
NEURON_DENSITY=512
LAYER_DEPTH=12
LI_CORE_COUNT=16
OMEGA_MAX_ITERATIONS=25
OMEGA_CONVERGENCE_THRESHOLD=0.98
CONTEXT_WINDOW=16384
```
