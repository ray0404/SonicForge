# Mid/Side EQ: Technical Reference

## 1. Introduction
The **Mid/Side (M/S) EQ** is a specialized tool that unlocks the "hidden dimensions" of a stereo mix. Unlike a standard stereo EQ which affects the Left and Right channels equally (or independently), an M/S EQ separates the audio into two components:
1.  **Mid (Sum):** The center image (Vocals, Kick, Snare, Bass).
2.  **Side (Difference):** The stereo width (Reverbs, wide Synths, hard-panned Guitars).

This allows the engineer to EQ the "space" of a mix without affecting the "core," or vice versa.

---

## 2. Fundamental Purpose and Use Cases
M/S processing is a secret weapon in mastering.

### Use Cases:
- **Mono Compatibility:** Cutting the low frequencies (High-Pass) on the **Side** channel ensures that the bass is mono-centered, which is crucial for vinyl cutting and club systems.
- **Vocal Clarity:** Boosting the "presence" (3kHz) on the **Mid** channel brings the vocal forward without brightening the wide guitars or cymbals.
- **Adding "Air":** Boosting the high shelf (10kHz+) on the **Side** channel adds expensive-sounding width and sparkle without making the center image harsh.
- **De-mudding:** Cutting 300Hz on the **Sides** can clean up a muddy reverb tail while leaving the body of the snare/vocal intact.

---

## 3. How it Works: The M/S Matrix
The processor relies on a mathematical matrix to encode and decode the stereo signal.

### 3.1 Encoding (L/R to M/S)
$$Mid = (Left + Right) \times 0.5$$
$$Side = (Left - Right) \times 0.5$$

(Note: The 0.5 scaling factor is applied to maintain unity gain).

### 3.2 Processing
The **Mid** signal passes through one set of filters.
The **Side** signal passes through a completely independent set of filters.

### 3.3 Decoding (M/S back to L/R)
$$Left = Mid + Side$$
$$Right = Mid - Side$$

---

## 4. Parameters and Controls

### 4.1 Mid Channel Controls
- **Mid Gain (dB):** -15 to +15 dB.
- **Mid Freq (Hz):** 20 to 20k Hz.

### 4.2 Side Channel Controls
- **Side Gain (dB):** -15 to +15 dB.
- **Side Freq (Hz):** 20 to 20k Hz.

(In the current implementation, a single Peaking band is available for each channel, but the architecture supports full multi-band expansion).

---

## 5. DSP Implementation Analysis (`midside-eq-processor.js`)

### 5.1 Architecture
The processor uses two `BiquadFilter` instances per channel (technically, it processes stereo pairs).
```javascript
this.midFilter = new BiquadFilter();
this.sideFilter = new BiquadFilter();
```

### 5.2 The Processing Loop
1.  **Read Inputs:** Retrieve Left ($L$) and Right ($R$) samples.
2.  **Encode:** Calculate $M$ and $S$.
3.  **Filter:**
    - `procMid = midFilter.process(M)`
    - `procSide = sideFilter.process(S)`
4.  **Decode:**
    - `OutL = procMid + procSide`
    - `OutR = procMid - procSide`
5.  **Output:** Write to buffers.

---

## 6. Trinity Pattern Integration

### 6.1 DSP Layer
The processor handles the matrix math and filtering. It ensures that the sum/difference operations are sample-accurate to prevent phase anomalies.

### 6.2 Node Layer (`MidSideEQNode.ts`)
The Node maps the user parameters to the internal `mid` and `side` filter coefficients.

### 6.3 UI Layer (`MidSideEQUnit.tsx`)
The UI typically presents two distinct columns or color-coded sections (e.g., Blue for Mid, Orange for Side) to clearly differentiate the two processing paths.

---

## 7. Practical Engineering Guide

### 7.1 The "Vinyl Safe" Bass
1.  Use a High-Pass filter (if available) or a Low Shelf cut on the **Side** channel.
2.  Set the frequency to ~100Hz.
3.  Cut by -6dB or more.
4.  This removes stereo information from the bass frequencies, ensuring a solid, centered low end.

### 7.2 Widening the Top End
1.  Select the **Side** channel.
2.  Set frequency to 10kHz.
3.  Boost by +3dB.
4.  This creates a "wider" stereo image without adding harshness to the center-panned vocals or snare.

---

## 8. Common Troubleshooting
- **Phase Cancellation:** If you boost the exact same frequency on both Mid and Side by different amounts, you are effectively just EQing Left and Right differently.
- **Collapsing the Image:** If you cut the Side channel too much, the mix will sound essentially mono.
- **Lopsided Stereo:** M/S processing relies on a balanced input. If the input is louder on the Left, the "Mid" calculation will be skewed. Ensure your input balance is centered.

---

## 9. Technical Specifications Summary
- **Matrix:** Sum and Difference.
- **Filter Type:** 2nd-Order Biquad Peaking.
- **Channel Correlation:** Processing is inherently linked to the stereo relationship.
- **Latency:** 0 samples.
