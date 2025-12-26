# Soft-Clip Distortion: Technical Reference

## 1. Introduction
The **Soft-Clip Distortion** module provides a range of waveshaping options designed to overdrive audio signals in a controlled, musical way. While similar to saturation, this module focuses specifically on the "clipping" behavior—what happens when a signal hits a ceiling. It offers accurate mathematical models of both soft (analog-style) and hard (digital-style) clipping curves.

A key feature of this module is its built-in **2x Oversampling**, which significantly reduces the harsh digital aliasing that typically plagues simple distortion plugins.

---

## 2. Fundamental Purpose and Use Cases
Distortion is not just for guitars; it is a vital tool for shaping density and impact.

### Use Cases:
- **Peak Control:** Using soft clipping as an alternative to limiting. A soft clipper rounds off peaks instantaneously, increasing loudness without the "pumping" artifacts of a limiter.
- **Drum Shaping:** Hard clipping a snare drum can add aggressive "crack" and length.
- **Harmonic Enrichment:** Generating upper harmonics to make a sub-bass audible on small speakers.
- **Industrial Sound Design:** Extreme drive settings for destroying audio textures.

---

## 3. Shaper Algorithms

### 3.1 Tanh (Hyperbolic Tangent)
- **Profile:** The gold standard for "Soft Clipping."
- **Math:** $y = \tanh(x)$.
- **Sound:** Very smooth transition from linear to saturated. It mimics the behavior of overdriven analog tape or Class-A amplifiers. It never hits a hard wall but approaches $\pm 1$ asymptotically.

### 3.2 Atan (ArcTangent)
- **Profile:** Harder than Tanh, but softer than digital clipping.
- **Math:** $y = \frac{2}{\pi} \arctan(x)$.
- **Sound:** More aggressive. It stays linear longer than Tanh but flattens out faster once it distorts. Good for crunchier tones.

### 3.3 Cubic (Polynomial)
- **Profile:** Classic "Tube-like" soft clipper.
- **Math:** $y = x - \frac{x^3}{3}$ (valid for $|x| < 1.5$).
- **Sound:** Generates strong third-order harmonics. It is computationally efficient and has a very defined "knee."

---

## 4. Parameters and Controls

### 4.1 Drive
- **Range:** 1.0 to 100.0.
- **Default:** 1.0.
- **Function:** Input gain multiplier.
    - **1.0:** Unity gain.
    - **10.0 (+20dB):** Heavy overdrive.
    - **100.0 (+40dB):** Total destruction.

### 4.2 Type
- **Options:** Tanh, Atan, Cubic.
- **Function:** Selects the mathematical waveshaping function.

### 4.3 Output Gain (dB)
- **Range:** -24.0 to +24.0 dB.
- **Default:** 0.0 dB.
- **Function:** Post-distortion level compensation.

### 4.4 Wet (%)
- **Range:** 0 to 100%.
- **Default:** 100%.
- **Function:** Dry/Wet blend.

---

## 5. Mathematical Foundation

### 5.1 Aliasing and Oversampling
When a signal is distorted, new frequencies (harmonics) are created. If a 10kHz sine wave is distorted, it might generate a 30kHz harmonic (3rd order). In a 44.1kHz system (Nyquist = 22.05kHz), 30kHz cannot exist. Instead of disappearing, it "folds back" to roughly 14kHz ($44.1 - 30$) as non-harmonic noise. This is **Aliasing**.

**2x Oversampling Solution:**
1.  **Interpolate:** Insert a new sample between every existing sample (doubling the sample rate to 88.2kHz). The Nyquist is now 44.1kHz.
2.  **Process:** Apply the distortion at this higher rate. The 30kHz harmonic is now "legal" and represented correctly.
3.  **Filter:** ( Ideally) Low-pass filter the signal to remove everything above 22kHz.
4.  **Decimate:** Throw away every other sample to return to 44.1kHz.

The Sonic Forge implementation uses a simplified linear interpolation and averaging method for efficiency.

---

## 6. DSP Implementation Analysis (`distortion-processor.js`)

### 6.1 The Oversampling Loop
```javascript
// 1. Interpolate
const x_interp = 0.5 * (x + lastX);

// 2. Process Both
const y_real = this.shaper(x * drive, type);
const y_interp = this.shaper(x_interp * drive, type);

// 3. Decimate (Average)
const processed = 0.5 * (y_real + y_interp);
```
This effectively calculates the "area under the curve" more accurately than simple point-sampling.

### 6.2 Shaper Functions
The processor contains optimized implementations of the three math functions.
```javascript
if (type === 0) return Math.tanh(x);
// ... etc
```

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The processor handles the state (`lastSample`) required for the interpolation step.

### 7.2 Node Layer (`DistortionNode.ts`)
Standard parameter mapping.

### 7.3 UI Layer (`DistortionUnit.tsx`)
Features a visualization of the transfer function (input vs. output graph) would be ideal here, showing the curve flattening as Drive increases.

---

## 8. Practical Engineering Guide

### 8.1 "Clipper" on Drums
1.  Place the Distortion module on your snare bus.
2.  Set **Type** to **Cubic**.
3.  Set **Drive** to roughly 2.0 - 4.0.
4.  Adjust **Output Gain** to match the original volume.
5.  Result: The snare peaks are shaved off, allowing you to turn the track up louder without clipping the master, while adding grit and sustain.

### 8.2 Safe Limiting
1.  Set **Type** to **Tanh**.
2.  Use moderate Drive.
3.  This acts as a safety net that sounds much smoother than a digital "hard clip" if you accidentally go into the red.

---

## 9. Common Troubleshooting
- **Volume Jump:** Increasing Drive massively increases gain. Always have your hand on the **Output Gain** knob (or a limiter) to prevent blowing your speakers.
- **Muffled Highs:** While oversampling reduces aliasing, the averaging process acts as a slight low-pass filter. You might need to boost the treble slightly after this module.

---

## 10. Technical Specifications Summary
- **Oversampling:** 2x (Linear Interpolation).
- **Functions:** Tanh, Atan, Cubic.
- **Latency:** 0.5 samples (due to averaging filter).
- **Topology:** Waveshaper.
