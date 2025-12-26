# Multi-Band Stereo Imager: Technical Reference

## 1. Introduction
The **Stereo Imager** is a mastering-grade tool designed to manipulate the perceived width of a mix across different frequency bands. Unlike simple "width" knobs that affect the entire signal, a multi-band imager allows for surgical control. You can mono the bass frequencies for tightness while simultaneously widening the treble frequencies for sparkle and dimension.

This is achieved by splitting the signal into three bands (Low, Mid, High) and applying Mid/Side (M/S) processing to each band independently.

---

## 2. Fundamental Purpose and Use Cases
Manipulating stereo width is one of the final steps in polishing a mix.

### Use Cases:
- **Mono-Safe Low End:** Essential for vinyl cutting and club systems. Frequencies below 150Hz provide no directional information to the human ear; keeping them mono focuses the energy and prevents phase cancellation.
- **Cinematic Width:** Expanding the high frequencies (>5kHz) pushes reverbs and FX to the edges of the soundstage, making the mix feel "expensive" and immersive.
- **Centering Vocals:** Narrowing the Mid band slightly can help focus a lead vocal or snare drum that feels too diffuse.

---

## 3. How it Works: Multi-Band M/S Processing

### 3.1 Frequency Splitting
The signal is split into three bands using **Linkwitz-Riley 4th Order** crossovers (identical to the Multiband Compressor).
- **Low Band:** Bass / Kick.
- **Mid Band:** Vocals / Snare / Guitars.
- **High Band:** Cymbals / Air.

### 3.2 Width Algorithm
For each band, the stereo signal ($L, R$) is converted to Mid/Side ($M, S$).
$$M = (L + R) \times 0.5$$
$$S = (L - R) \times 0.5$$

The **Width** parameter is a multiplier for the Side channel:
$$S_{new} = S \times Width$$

Then decoded back:
$$L_{new} = M + S_{new}$$
$$R_{new} = M - S_{new}$$

---

## 4. Parameters and Controls

### 4.1 Crossovers
- **Low Freq:** 20 - 1000 Hz. (Def: 150Hz).
- **High Freq:** 1000 - 10,000 Hz. (Def: 2500Hz).

### 4.2 Per-Band Width
- **Range:** 0.0 to 2.0.
- **Default:**
    - Low: 0.0 (Mono).
    - Mid: 1.0 (Unchanged).
    - High: 1.2 (Widened).
- **Function:**
    - **0.0:** Removes all Side information (Mono).
    - **1.0:** Natural stereo image.
    - **>1.0:** Boosts Side information (Widening).

### 4.3 Bypass
- **Function:** Globally bypasses the processing for A/B comparison.

---

## 5. DSP Implementation Analysis (`stereo-imager-processor.js`)

### 5.1 The Crossover Tree
Since the `LinkwitzRiley4` class is a 2-way splitter, we cascade two of them to get 3 bands.
1.  **Split 1:** Input -> Low / High (actually Mid+High).
2.  **Split 2:** Split 1 High -> Mid / High.

### 5.2 M/S Calculation
The math is performed per-sample inside the loop.
```javascript
const processWidth = (l, r, width) => {
    if (width === 1.0) return [l, r];
    const m = (l + r) * 0.5;
    const s = (l - r) * 0.5;
    const sNew = s * width;
    return [m + sNew, m - sNew];
};
```
This ensures sample-accurate phase coherency.

---

## 6. Trinity Pattern Integration

### 6.1 DSP Layer
The processor handles 6 crossover filters (2 per channel x Stereo + cascading logic) and the matrix math.

### 6.2 Node Layer (`StereoImagerNode.ts`)
Maps the width and frequency parameters.

### 6.3 UI Layer (`StereoImagerUnit.tsx`)
A **Vectorscope** or **Correlation Meter** is the ideal visualization here, showing the user if the signal is becoming too wide (anti-correlated).

---

## 7. Practical Engineering Guide

### 7.1 "Standard" Mastering Settings
1.  **Low (<120Hz):** Width 0. (Tight bass).
2.  **Mid (120Hz - 4kHz):** Width 1.0. (Preserve the mix decisions).
3.  **High (>4kHz):** Width 1.15. (Subtle enhancement).

### 7.2 Fixing a Lopsided Mix
If a mix feels heavy on the left side in the midrange:
1.  This tool cannot fix balance (panning); it only affects width.
2.  Use a standard Balance control first.
3.  However, reducing the Width of the Mid band slightly (0.8) can help mask balance issues by pulling everything towards the center.

---

## 8. Common Troubleshooting
- **Phase Issues:** Widening beyond 1.5 usually creates phase issues. Check your mix in Mono. If the wide parts disappear or sound "hollow," you have widened too much.
- **Crossover Distortion:** While LR4 filters are transparent, rapid modulation of the crossover frequencies can cause artifacts. Set them and leave them.

---

## 9. Technical Specifications Summary
- **Crossover:** Linkwitz-Riley 4th Order.
- **Algorithm:** Mid/Side Balancing.
- **Latency:** 0 samples.
