# 3-Band Parametric EQ: Technical Reference

## 1. Introduction
The **3-Band Parametric EQ** is the workhorse of audio mixing. While specialized tools handle dynamics and saturation, the EQ is the primary tool for shaping the tonal balance of a sound. "Parametric" means that for each band, you have continuous control over all three primary parameters: **Frequency** (where), **Gain** (how much), and **Q** (how wide).

Sonic Forge implements a high-quality, 3-band design optimized for standard mixing tasks, featuring a dedicated Low Shelf, a flexible Mid Peaking band, and a High Shelf.

---

## 2. Fundamental Purpose and Use Cases
Equalization (EQ) is used to correct frequency imbalances and to fit multiple instruments into a cohesive mix.

### Use Cases:
- **Low End Cleanup:** Using the Low Shelf to cut mud (below 200Hz) from guitars or vocals to make room for the kick and bass.
- **Surgical Correction:** Using the Mid band with a high Q (narrow width) to notch out annoying resonant frequencies or "whistles."
- **Tonal Shaping:** Boosting the High Shelf to add "air" and "sparkle" to a vocal track.
- **Carving Space:** Cutting the "boxiness" (around 400-600Hz) from a snare drum.

---

## 3. Filter Topology
The module uses three cascaded **Biquad IIR Filters** in series.

1.  **Low Band (Low Shelf):**
    - Affects all frequencies below the target frequency.
    - Used for boosting bass weight or cutting rumble.
2.  **Mid Band (Peaking/Bell):**
    - Affects a specific band of frequencies centered around the target.
    - The bandwidth is controlled by the **Q** factor.
3.  **High Band (High Shelf):**
    - Affects all frequencies above the target frequency.
    - Used for brightening or darkening a sound.

---

## 4. Parameters and Controls

### 4.1 Low Band
- **Freq (Hz):** 20 - 1000 Hz. The "corner frequency" of the shelf.
- **Gain (dB):** -24 to +24 dB. The amount of boost or cut.

### 4.2 Mid Band
- **Freq (Hz):** 200 - 5000 Hz. The center frequency of the bell curve.
- **Gain (dB):** -24 to +24 dB.
- **Q (Factor):** 0.1 to 10.0.
    - **Low Q (0.5):** Broad, musical curves. Good for general tone shaping.
    - **High Q (5.0+):** Narrow, surgical spikes. Good for removing resonance.

### 4.3 High Band
- **Freq (Hz):** 2000 - 20,000 Hz. The corner frequency.
- **Gain (dB):** -24 to +24 dB.

---

## 5. Mathematical Foundation

### 5.1 The Biquad Filter
Each band is implemented as a 2nd-order Direct Form II Transposed Biquad filter. The transfer function in the z-domain is:

$$H(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{a_0 + a_1 z^{-1} + a_2 z^{-2}}$$

### 5.2 Coefficient Calculation
The coefficients ($a_0...a_2, b_0...b_2$) are recalculated whenever a parameter changes using standard Audio EQ Cookbook formulas.
- **Peaking EQ:** Uses trigonometric functions of the center frequency ($\omega_0 = 2\pi f_0 / F_s$) and the bandwidth slope ($A = 10^{G/40}$).
- **Shelving EQ:** Uses similar formulas but accounts for the "slope" parameter (fixed at $S=1$ for maximum steepness without overshoot).

---

## 6. DSP Implementation Analysis (`parametric-eq-processor.js`)

### 6.1 State Management
Each channel maintains three independent filter objects:
```javascript
this.channelState.push({
  lowShelf: new BiquadFilter(),
  midPeak: new BiquadFilter(),
  highShelf: new BiquadFilter()
});
```

### 6.2 The Processing Loop
The processing is strictly serial. This means the phase shifts of each filter are cumulative.
1.  **Input:** Sample enters the loop.
2.  **Stage 1:** `sample = lowShelf.process(sample)`.
3.  **Stage 2:** `sample = midPeak.process(sample)`.
4.  **Stage 3:** `sample = highShelf.process(sample)`.
5.  **Output:** Result is written to the output buffer.

### 6.3 Performance Optimization
The filter coefficients are updated at **K-rate** (once per render block) rather than A-rate (per sample) to save CPU. This is standard practice for EQs, as users rarely modulate EQ parameters at audio rates (unlike filters in a synthesizer).

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `ParametricEQProcessor` handles the coefficient math and the sample-by-sample filtering.

### 7.2 Node Layer (`ParametricEQNode.ts`)
The Node ensures that the parameters are exposed correctly to the host automation system.

### 7.3 UI Layer (`ParametricEQUnit.tsx`)
The UI is arguably the most important part of an EQ. In Sonic Forge, it provides three sets of stacked knobs (Freq/Gain) and a graphical curve visualization (if implemented) to help users "see" the sound.

---

## 8. Practical Engineering Guide

### 8.1 The "Sweep" Technique
To find a bad frequency:
1.  Boost the **Mid Gain** to +10dB.
2.  Set the **Mid Q** to 5.0 (Narrow).
3.  Slowly sweep the **Mid Freq** across the spectrum.
4.  When the sound becomes unbearable or rings intensely, you have found the resonant frequency.
5.  Stop sweeping, and turn the **Gain** down to -3dB or -6dB to cut that resonance.

### 8.2 Subtractive EQ
A golden rule of mixing is "Cut narrow, boost wide."
- Use **High Q** when cutting bad frequencies.
- Use **Low Q** (broad shelves) when boosting to make something sound "better."

---

## 9. Common Troubleshooting
- **Phase Smearing:** Extreme EQ moves (e.g., +24dB at 1kHz) cause significant phase shifts around the center frequency. This can smear the transients. Use smaller moves (3-6dB) for transparent results.
- **Gain Staging:** Boosting EQ adds volume. If you boost the lows by 10dB, you might clip the output. Lower the channel fader or use a trim plugin to compensate.

---

## 10. Technical Specifications Summary
- **Filter Type:** 2nd-Order Biquad IIR.
- **Bands:** 3 (Low Shelf, Mid Peak, High Shelf).
- **Q Definition:** Constant Q (Bandwidth varies with Frequency).
- **Latency:** 0 samples (Phase shift occurs, but no time delay).
