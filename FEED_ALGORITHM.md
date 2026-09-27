# NOVA — Algorithmic Feed V1 Specification

## 1. Overview
NOVA Feed Algorithm V1 replaces naive reverse-chronological ordering with a multi-stage candidate generation, scoring, and diversity filtering pipeline. It balances relationship strength, community engagement, content freshness, and media affinity while preventing creator monopolization.

---

## 2. Multi-Stage Pipeline Architecture

```
[ All Active Posts in DB ]
            │
            ▼
┌──────────────────────────────────────────────┐
│ Stage 1: Candidate Generation & Safety Filter│
│  - Filter blocked users (mutual exclusion)   │
│  - Filter private accounts (if not followed) │
│  - Window: candidate pool of recent posts    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Stage 2: Feature Extraction & Scoring Engine │
│  - Relationship Graph Strength (S_rel)       │
│  - Logarithmic Engagement (S_eng)            │
│  - Exponential Time Decay (S_fresh)          │
│  - Interest & Media Weight (S_int)           │
│  => S = w_rel*S_rel + w_eng*S_eng +          │
│         w_fresh*S_fresh + w_int*S_int        │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Stage 3: Diversity & Frequency Constraints   │
│  - Author diversity: max 2 consecutive posts │
│    from the same creator                     │
│  - Mix: 75% personalized, 25% discovery      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Stage 4: Enrichment & Pagination             │
│  - Dynamic isLiked resolution                │
│  - Dynamic isSaved resolution                │
│  - Sliced pagination (page, limit)           │
└──────────────────────────────────────────────┘
```

---

## 3. Scoring Function Formulation

The total ranking score $S(p, u)$ for post $p$ and viewer $u$ is defined as:

$$S(p, u) = w_{\text{rel}} \cdot S_{\text{rel}} + w_{\text{eng}} \cdot S_{\text{eng}} + w_{\text{fresh}} \cdot S_{\text{fresh}} + w_{\text{int}} \cdot S_{\text{int}}$$

### Parameter Weights
- Relationship weight: $w_{\text{rel}} = 0.35$
- Engagement weight: $w_{\text{eng}} = 0.25$
- Freshness weight: $w_{\text{fresh}} = 0.20$
- Interest / Media weight: $w_{\text{int}} = 0.20$
$$\sum w_i = 1.0$$

---

## 4. Component Score Formulations

### 4.1 Relationship Score ($S_{\text{rel}}$)
Measures the social graph proximity between creator $c$ and viewer $u$:
- $S_{\text{rel}} = 1.0$ if $u$ follows $c$ directly.
- $S_{\text{rel}} = 0.5$ if $u$ and $c$ share mutual followers (2nd-degree network).
- $S_{\text{rel}} = 0.1$ for undiscovered creators (discovery candidate).

### 4.2 Logarithmic Engagement Score ($S_{\text{eng}}$)
Measures audience validation while dampening viral outlier distortion using a logarithmic scale:

$$S_{\text{eng}} = \min\left(1.0, \frac{\ln(1 + \text{likes} + 2.0 \cdot \text{comments})}{\ln(1 + 100)}\right)$$

- Comments are weighted twice as high as passive likes ($2.0 \times$).
- Logarithmic compression prevents viral posts with thousands of likes from permanently starving new discussions.

### 4.3 Exponential Freshness Decay ($S_{\text{fresh}}$)
Models information entropy using continuous exponential half-life decay:

$$S_{\text{fresh}} = \exp\left(-\frac{\Delta t}{\tau}\right)$$

- $\Delta t$: Post age in hours ($\text{now} - \text{createdAt}$).
- $\tau$: Time constant set to $48.0$ hours.
- A 24-hour-old post retains $e^{-24/48} = 60.6\%$ freshness; a 48-hour-old post retains $36.8\%$.

### 4.4 Interest & Media Multiplier ($S_{\text{int}}$)
- Rich media posts (photos/videos) receive a base multiplier of $0.80$ to $1.0$.
- High-relevance topic tags matching user affinity receive positive boosts up to $1.0$.

---

## 5. Diversity Constraints

1. **Max Consecutive Author Constraint**:
   No single creator is permitted to occupy more than **2 consecutive slots** in the ranked feed stream. If a creator's third post is encountered, it is buffered and deferred until another creator's post breaks the cluster.
2. **Discovery Injection**:
   The feed engine interleaves a target mix of **75% in-network** updates with **25% high-engagement discovery** candidates to combat echo chambers.

---

## 6. Feed Modes

- **`type=for_you`**: Full 4-stage algorithmic pipeline (Personalized + Discovery).
- **`type=following`**: Strictly reverse-chronological and relationship-filtered stream composed exclusively of creators followed by the authenticated user.
