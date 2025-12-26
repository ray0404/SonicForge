# LUFS Meter (EBU R128): Technical Reference

## 1. Introduction
The **LUFS Meter** is not an audio effect; it is a precision analysis tool. In the era of streaming services (Spotify, YouTube, Apple Music), **Loudness Units Full Scale (LUFS)** has replaced RMS and Peak levels as the standard for measuring volume.

This module implements the **ITU-R BS.1770-4** algorithm to measure the perceived loudness of the audio signal. It is essential for ensuring your masters meet the delivery specifications of modern platforms.

---

## 2. Fundamental Purpose and Use Cases
Why not just use a Peak Meter?
- A Peak Meter measures **Electricity** (Voltage). A short transient click can hit 0dB while the song sounds quiet.
- A LUFS Meter measures **Perception** (Hearing). It accounts for the fact that we hear mid-range frequencies as louder than bass frequencies.

### Use Cases:
- **Targeting -14 LUFS:** The standard target for Spotify. If you master louder than this, Spotify will turn you down. If you master quieter, you lose competitive volume.
- **Balancing Tracks:** Ensuring the verse and chorus have an appropriate dynamic relationship (e.g., the chorus jumps up by 2-3 LU).

---

## 3. Measurements
The meter provides two distinct readouts:

### 3.1 Momentary (M)
- **Window:** 400ms.
- **Use:** Analyzing immediate volume spikes or short sections.
- **Visual:** Often displayed as a fast-moving bar.

### 3.2 Short-Term (S)
- **Window:** 3 seconds.
- **Use:** Analyzing the "feel" of a phrase or measure. This is the most useful metric for judging the loudness of a specific song section.
- **Visual:** A slower, more stable bar.

*(Note: Integrated Loudness (I), which measures the whole song, requires accumulating data over the entire playback duration. The current module focuses on real-time M and S).*

---

## 4. How it Works: The Algorithm

### 4.1 K-Weighting Filter
Before measurement, the audio passes through two filters designed to mimic the human ear's sensitivity:
1.  **High Shelf:** Boosts high frequencies (to account for the acoustic effect of the head).
2.  **High Pass:** Rolls off low frequencies (because we are less sensitive to sub-bass loudness).

### 4.2 Mean Square Calculation
The energy is averaged over the window time ($T$):
$$z_i = \frac{1}{T} \int_{t-T}^{t} y_i^2 dt$$

### 4.3 Channel Summation
For stereo, the channels are summed (no channel weights are applied for simple stereo, usually):
$$Loudness = 10 \log_{10}(z_L + z_R) - 0.691$$
The constant $-0.691$ compensates for the K-weighting gain.

---

## 5. DSP Implementation Analysis (`lufs-processor.js`)

### 5.1 Circular Buffers
To calculate a "sliding window" average efficiently, the processor uses circular buffers.
```javascript
// Remove old value
this.sumM -= this.bufferM[this.idxM];
// Add new value
this.bufferM[this.idxM] = energy;
this.sumM += energy;
```
This $O(1)$ approach avoids iterating over the entire window history every sample.

### 5.2 Reporting
The processor calculates the logarithmic LUFS value only when reporting to the UI (e.g., every 46ms), saving CPU cycles on the audio thread.

---

## 6. Trinity Pattern Integration

### 6.1 DSP Layer
The `LUFSProcessor` is purely analytical. It passes the audio through unchanged.

### 6.2 Node Layer (`MeteringNode.ts`)
Receives the messages from the processor and exposes them as properties (`momentaryLUFS`, `shortTermLUFS`) that the UI can poll.

### 6.3 UI Layer (`MeteringUnit.tsx`)
A digital readout or LED bar graph.
- **Green:** -14 LUFS (Target).
- **Yellow:** -9 LUFS (Loud/CD).
- **Red:** -6 LUFS (Very Loud/Club).

---

## 7. Practical Engineering Guide

### 7.1 Mastering for Spotify
1.  Play the loudest part of your song (the final chorus).
2.  Watch the **Short-Term** meter.
3.  Adjust your Limiter until the Short-Term meter hovers around **-10 to -9 LUFS**.
4.  Why -9? Because Spotify normalizes based on the *Integrated* loudness of the whole song. If your loud chorus is -9, your quieter verses might bring the average down to -12 or -13, which is close to the -14 target. It's better to be slightly over than under.

### 7.2 Checking Dynamics
1.  Watch the meter during the verse. (Say, -18 LUFS).
2.  Watch it during the chorus. (Say, -10 LUFS).
3.  The dynamic range is 8 LU. This is a healthy, punchy mix. If the difference is only 1-2 LU, your mix might sound flat and fatiguing.

---

## 8. Technical Specifications Summary
- **Standard:** ITU-R BS.1770-4 / EBU R128.
- **Weighting:** K-Curve (2-stage filter).
- **Windows:** 400ms (Momentary), 3000ms (Short-Term).
- **Latency:** 0 samples (Analysis is parallel to pass-through).
