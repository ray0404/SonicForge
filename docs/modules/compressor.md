# Versatile Dynamics Compressor

The **Versatile Dynamics Compressor** is a flexible signal processor that automatically reduces the dynamic range of an audio signal. It features four distinct emulation modes (VCA, FET, Opto, VarMu), each offering a unique character and response curve.

## Purpose
- **Consistency:** Evening out the volume of a performance (e.g., leveling a vocal track).
- **Glue:** Helping multiple elements of a mix blend together.
- **Punch:** Shaping the transients of drums to emphasize the initial "hit."
- **Coloration:** Adding harmonic character through different hardware-style emulations.

## Emulation Modes

| Mode | Type | Character | Logic |
| :--- | :--- | :--- | :--- |
| **0** | **VCA** | Clean & Fast | Feed-forward detection with linear ratio. |
| **1** | **FET** | Punchy & Aggressive | Feed-back detection; modeled after classic aggressive compressors. |
| **2** | **Opto** | Smooth & Musical | Program-dependent release; slower response modeled after light-based hardware. |
| **3** | **VarMu** | Warm & Thick | Soft-knee with a "sliding ratio" that increases as the signal drives harder. |

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Threshold** | -60 to 0 dB | -24 dB | The level above which compression begins. |
| **Ratio** | 1:1 to 20:1 | 4:1 | How much the signal is reduced once it exceeds the threshold. |
| **Attack** | 0.1ms to 1s | 10ms | How quickly the compressor reacts to a peak. |
| **Release** | 1ms to 2s | 100ms | How quickly the compressor returns to unity gain. |
| **Knee** | 0 to 20 dB | 5 dB | Softness of the transition into compression (or Knee Factor in VarMu). |
| **Makeup Gain**| 0 to 24 dB | 0 dB | Increases the output volume to compensate for gain reduction. |
| **Mix** | 0 to 100% | 100% | Parallel compression blend (Dry vs. Wet). |

## Implementation Details

### DSP Logic (`compressor-processor.js`)
The processor implements a **Gain Reduction (GR)** state that tracks in decibels.

1.  **Detection Source:**
    - **Feed-forward (VCA/Opto/VarMu):** Analyzes the *input* sample.
    - **Feed-back (FET):** Analyzes the *previous output* sample.
2.  **Gain Calculation:**
    - Standard: $TargetGR = (Input_{dB} - Threshold) * (1 - 1/Ratio)$.
    - **VarMu Logic:** The ratio is modulated by the overshoot: $Ratio_{eff} = 1.0 + (Overshoot_{dB} * KneeFactor)$.
3.  **Ballistics (Attack/Release):**
    - The `gr` state is smoothed using exponential decay coefficients based on the attack and release times.
    - **Opto Logic:** The release coefficient is modulated by the signal amplitude, creating a non-linear, program-dependent tail.
4.  **Application:** The gain factor is calculated as $10^{(-GR/20)}$ and applied to the input sample.

### Code Analysis
```javascript
// From compressor-processor.js
let targetGR = overshoot * (1 - 1 / Math.max(1, r));

// Apply Ballistics
if (targetGR > state.gr) {
    // Attack phase
    state.gr = attCoeff * state.gr + (1 - attCoeff) * targetGR;
} else {
    // Release phase
    state.gr = relCoeff * state.gr + (1 - relCoeff) * targetGR;
}

const processed = x * Math.pow(10, -state.gr / 20) * makeup;
```

### Trinity Pattern Roles
-   **Processor:** Manages per-channel state, including the feedback loop for FET mode. Performs the non-linear logic for Opto and VarMu modes.
-   **Node:** Exposes the `mode` parameter as an integer and coordinates the timing of parameter updates.
-   **Unit:** Provides a toggle for the four modes and a real-time gain reduction meter.
