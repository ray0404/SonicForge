# Dynamic EQ: Technical Reference

## 1. Introduction
The **Dynamic EQ** represents the intersection of equalization and compression. While a standard Parametric EQ applies a static gain change to a frequency band, a Dynamic EQ modulates that gain in real-time based on the incoming signal level.

This makes it an incredibly powerful problem-solver. It allows engineers to suppress frequencies only when they become problematic (e.g., a "harsh" vocal note that only hurts the ears when the singer belts) while leaving the track untouched during quieter passages.

---

## 2. Fundamental Purpose and Use Cases
Dynamic EQ is preferred over Multi-band Compression when "surgical" precision is required.

### Use Cases:
- **Resonance Control:** Taming a specific note on a bass guitar that "blooms" too loudly compared to others.
- **De-Essing:** A dynamic EQ cut at 7kHz is effectively a highly customizable de-esser.
- **Unmasking:** Ducking the low-mids (200Hz) of a guitar track only when the snare drum hits (requires external sidechain, or internal self-ducking).
- **Expansion:** Boosting the "crack" of a snare (2kHz) only on the loudest hits to add excitement.

---

## 3. How it Works: The Hybrid Architecture
The Dynamic EQ consists of two parallel processing paths for each band:

1.  **Detection Path (The "Brain"):**
    - The signal passes through a **Band-Pass Filter** tuned to the target frequency and Q.
    - An **Envelope Follower** measures the level of this specific frequency band.
    - A **Threshold** detector determines if the level is high enough to trigger processing.
2.  **Audio Path (The "Muscle"):**
    - The signal passes through a standard **Peaking Filter**.
    - The **Gain** of this filter is not fixed; it is modulated sample-by-sample by the output of the Detection Path.

---

## 4. Parameters and Controls

### 4.1 Filter Controls
- **Frequency (Hz):** 20 - 20,000 Hz. Center frequency.
- **Q (Factor):** 0.1 to 100. Bandwidth.
- **Static Gain (dB):** -40 to +40 dB. The "resting" gain of the filter when no dynamics are occurring.

### 4.2 Dynamics Controls
- **Threshold (dB):** -100 to 0 dB. Level at which dynamic processing begins.
- **Ratio (:1):** 1:1 to 20:1. Scaling factor for the dynamic gain change.
- **Attack (s):** 1ms to 1s. Speed of reaction.
- **Release (s):** 1ms to 1s. Speed of recovery.

---

## 5. Mathematical Foundation

### 5.1 Gain Modulation Logic
The processor calculates a dynamic gain reduction ($GR$) value:

$$GR = (Envelope_{dB} - Threshold) \times (1 - 1/Ratio)$$

The final gain applied to the filter is:

$$Gain_{total} = StaticGain - GR$$

(Note: This formula assumes "Cut" behavior. For "Boost" behavior, the logic is inverted).

### 5.2 Filter Coefficient Updates
Unlike a static EQ, where coefficients are calculated once, the Dynamic EQ must recalculate the Biquad coefficients ($a_0...b_2$) potentially every sample (or every small block) because the **Gain** parameter is constantly changing.

To optimize performance, Sonic Forge may update these coefficients at a control rate (e.g., every 32 or 64 samples) and interpolate the result, or use specific optimized filter topologies (like SVF) that handle modulation better than Direct Form Biquads.

---

## 6. DSP Implementation Analysis (`dynamic-eq-processor.js`)

### 6.1 State Management
Each channel requires:
- `scFilter`: Band-pass for detection.
- `mainFilter`: Peaking for audio processing.
- `envFollower`: To track the level.
```javascript
this.channelState.push({
    scFilter: new BiquadFilter(),
    mainFilter: new BiquadFilter(),
    envFollower: new EnvelopeFollower()
});
```

### 6.2 The Processing Loop
1.  **Detect:** Filter input -> Bandpass -> Envelope -> dB.
2.  **Calculate:** Compare dB to Threshold -> Determine Delta.
3.  **Modulate:** $TargetGain = Static - Delta$.
4.  **Update:** `mainFilter.setGain(TargetGain)`.
5.  **Process:** Filter input -> Peaking Filter -> Output.

### 6.3 Performance vs. Quality
Because filter coefficients are expensive to calculate (`Math.sin`, `Math.cos`), doing this per-sample is CPU intensive.
- **Optimization:** If the gain change is small, skip recalculation.
- **Optimization:** Use lookup tables for trigonometric functions.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The processor handles the complex interaction between the envelope and the filter coefficients.

### 7.2 Node Layer (`DynamicEQNode.ts`)
The Node facilitates the parameter updates. Since this module has many parameters (Freq, Q, Gain, Thresh, Ratio, Att, Rel), the `setParam` logic is robust to handle rapid automation.

### 7.3 UI Layer (`DynamicEQUnit.tsx`)
The UI is complex, requiring visualization of both the static EQ curve and the "active" dynamic curve. Typically, a "ghost" curve bounces up and down to show the user exactly what the EQ is doing in real-time.

---

## 8. Practical Engineering Guide

### 8.1 "Smart" Low-End Control
On a bass guitar that varies between high and low notes:
1.  Set Freq to ~100Hz (the "boom").
2.  Set Static Gain to 0dB.
3.  Lower the Threshold until the compressor catches the loudest low notes.
4.  This ensures the bass stays consistent without thinning out the quieter notes, which a static EQ cut would do.

### 8.2 Taming Harsh Cymbals
1.  Set Freq to ~4kHz.
2.  Set Q to 2.0.
3.  Set Threshold so it only triggers on crash hits.
4.  This preserves the brightness of the hi-hats (which are quieter) while controlling the aggressive crash cymbals.

---

## 9. Common Troubleshooting
- **Artifacts/Zipper Noise:** Rapidly changing filter gain can cause digital noise if not smoothed. If you hear "zippering," increase the Attack time slightly (e.g., >10ms).
- **Phase Issues:** Like all IIR EQs, dynamic EQ changes phase. Extreme settings can cause momentary phase shifts that might affect stereo imaging if used on a master bus.

---

## 10. Technical Specifications Summary
- **Filter Type:** Dynamic Biquad IIR.
- **Topology:** Internal Sidechain.
- **Modulation:** Audio-rate (or near audio-rate) coefficient updates.
- **Latency:** 0 samples.
