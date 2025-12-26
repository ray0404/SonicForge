# 3-Band Multiband Compressor: Technical Reference

## 1. Introduction
The **3-Band Multiband Compressor** is a sophisticated dynamics processor that overcomes the primary limitation of standard compressors: the "one-size-fits-all" approach to gain reduction. By splitting the audio signal into independent frequency bands, it allows for targeted control over the dynamics of specific frequency ranges without affecting others. In Sonic Forge, this module is a powerful tool for complex mastering tasks, such as stabilizing a boomy low end while leaving the high-frequency transients intact.

It combines the precision of high-order crossovers with the musicality of VCA-style compression, providing a tool that is both technical and creative.

---

## 2. Fundamental Purpose and Use Cases
Multiband compression is used when "broadband" compression (affecting the entire signal at once) causes unwanted artifacts like pumping or dulling.

### Use Cases:
- **Bass Management:** Compressing only the low frequencies (below 150Hz) to ensure a solid, consistent foundation without squashing the vocals or cymbals.
- **De-Essing (Mastering):** Applying heavy compression to the high frequencies (above 5kHz) to tame harsh sibilance in a full mix.
- **Tonal Balancing:** Acting as a "dynamic EQ" by only boosting or cutting frequency bands when they exceed a certain volume.
- **Mix Glue:** Adding a final layer of consistency across the spectrum during the mastering stage.

---

## 3. The Crossover Network
The foundation of any multiband processor is its **Crossover**. Sonic Forge utilizes two cascaded **Linkwitz-Riley 4th Order (LR4)** filters.

### Why LR4?
- **Flat Magnitude Response:** When the low and high bands are summed back together, the resulting magnitude is perfectly flat (0dB) across the entire spectrum.
- **Phase Coherence:** LR4 filters ensure that the bands are perfectly in phase at the crossover frequency, preventing "comb filtering" or other phasing artifacts that common filters (like Butterworth) would produce.
- **Steep Slopes:** With a 24dB/octave slope, the bands are cleanly separated, minimizing bleed between them.

**Signal Flow:**
1.  **Crossover 1:** Splits the signal into **Low** and **Mid-High**.
2.  **Crossover 2:** Splits the **Mid-High** signal into **Mid** and **High**.

---

## 4. Parameters and Controls

### 4.1 Frequency Crossovers
- **Low/Mid Crossover:** 20 Hz to 1000 Hz. Sets the boundary between the bass and mid-range.
- **Mid/High Crossover:** 1000 Hz to 10,000 Hz. Sets the boundary between the mid-range and the "air" or treble.

### 4.2 Per-Band Compression (Low, Mid, High)
Each of the three bands has a dedicated set of VCA controls:
- **Threshold (dB):** -60 to 0 dB.
- **Ratio (:1):** 1:1 to 20:1.
- **Attack (s):** 0.1ms to 1s.
- **Release (s):** 1ms to 2s.
- **Make-up Gain (dB):** 0 to 24 dB.

---

## 5. Mathematical Foundation

### 5.1 Linkwitz-Riley Difference Equations
The LR4 is implemented by cascading two 2nd-order Butterworth filters. The biquad coefficients for each stage are calculated based on the center frequency and a fixed $Q$ of $0.7071$ (which, when squared, gives the $Q=0.5$ required for LR alignment).

### 5.2 The VCA Algorithm
The internal compression engine for each band utilizes a Feed-Forward VCA topology. The gain reduction ($GR$) is calculated as:

$$GR_{dB} = \max(0, (Input_{dB} - Threshold) \times (1 - 1/Ratio))$$ 

This value is smoothed using independent attack and release time constants before being converted back to a linear gain factor.

---

## 6. DSP Implementation Analysis (`multiband-compressor-processor.js`)

### 6.1 Architecture
The processor maintains a complex state for each stereo channel:
```javascript
this.channelState.push({
    xover1: new LinkwitzRiley4(sampleRate, 150),
    xover2: new LinkwitzRiley4(sampleRate, 2500),
    vcaLow: new VCA(sampleRate),
    vcaMid: new VCA(sampleRate),
    vcaHigh: new VCA(sampleRate)
});
```

### 6.2 The "Split-Process-Sum" Loop
For every sample:
1.  **Split:**
    ```javascript
    const s1 = state.xover1.process(sample);
    const s2 = state.xover2.process(s1.high);
    ```
2.  **Process:**
    The results from `s1.low`, `s2.low`, and `s2.high` are passed into three independent `VCA` class instances.
3.  **Sum:**
    ```javascript
    output[i] = bandLow + bandMid + bandHigh;
    ```

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The processor handles the heavy math of five biquad stages and three dynamics engines. It is highly optimized, only updating crossover coefficients when the frequency parameters actually change.

### 7.2 Node Layer (`MultibandCompressorNode.ts`)
The Node manages 17 distinct parameters (2 crossovers + 3 bands x 5 params). It provides a unified interface for the UI to update any specific band's settings.

### 7.3 UI Layer (`MultibandCompressorUnit.tsx`)
The React UI uses a tabbed or multi-column layout to display the controls for each band. It often includes a **Crossover Visualization** allowing the user to see the frequency split points.

---

## 8. Practical Engineering Guide

### 8.1 Transparent "Mastering" Glue
1.  **Low Band:** Ratio 2:1, Attack 30ms, Release 100ms. (Preserve the punch).
2.  **Mid Band:** Ratio 1.5:1, Attack 10ms, Release 100ms. (Stabilize the core).
3.  **High Band:** Ratio 1.2:1, Attack 5ms, Release 50ms. (Add air and consistent sparkle).

### 8.2 Fixing a "Muddy" Mix
Set the Low/Mid crossover to ~200Hz. Set the Low Band threshold until you get 2-3dB of reduction. Use a fast attack (5ms) to catch the boomy peaks of the bass/kick. This clarifies the mid-range without making the mix sound "thin."

---

## 9. Common Troubleshooting
- **Phase Issues:** If the mix sounds "hollow" after adding the module, ensure you haven't bypassed an internal band manually or inverted the phase of one band.
- **CPU Spikes:** This is the most computationally expensive module in Sonic Forge. If you experience dropouts, try using the standard Compressor instead if multiband control isn't strictly necessary.

---

## 10. Technical Specifications Summary
- **Crossover Type:** Linkwitz-Riley 4th Order (Cascaded).
- **Number of Bands:** 3 (Low, Mid, High).
- **Latency:** 0 samples.
- **Topology:** Dual-mono independent processing.
- **DSP Overhead:** High (Multiple IIR and Dynamics stages).
