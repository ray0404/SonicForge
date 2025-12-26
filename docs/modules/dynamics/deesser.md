# Mastering DeEsser: Technical Reference

## 1. Introduction
The **Mastering DeEsser** is a specialized dynamics processor designed to target and reduce harsh sibilant sounds—the high-frequency energy typically found in "s," "sh," and "ch" sounds. While commonly used on vocal tracks, in the context of Sonic Forge, it is optimized for mastering, where it can tame "brittle" or "glassy" high-end in a full mix without affecting the overall brightness or clarity.

It acts as a frequency-dependent compressor, only engaging when specific high-frequency thresholds are crossed.

---

## 2. Fundamental Purpose and Use Cases
Sibilance occurs naturally in speech and singing, but it can be unnaturally emphasized by bright microphones, heavy compression, or saturation.

### Use Cases:
- **Vocal Polishing:** Making a vocal sound professional and "expensive" by removing piercing high-end spikes.
- **Harsh Mix Taming:** Reducing the harshness of overly bright cymbals or aggressive high-frequency synths in a final master.
- **Pre-Saturation Control:** Using a de-esser before a saturator to prevent the distortion from emphasizing harsh frequencies.

---

## 3. How it Works: Frequency-Dependent Compression
A DeEsser is essentially a compressor with a **Sidechain Filter**.

1.  **Filtering (Sidechain):** The incoming audio is passed through a sharp **Band-Pass Filter**. This filter is tuned to the specific frequency of the harshness (typically 4kHz to 8kHz).
2.  **Analysis:** An envelope follower monitors the amplitude of this filtered signal.
3.  **Gain Reduction:** When the high-frequency energy exceeds the **Threshold**, the gain of the *original* signal is reduced.
4.  **Result:** The "s" sound is lowered in volume, while the rest of the audio (which does not contain that high-frequency energy) passes through relatively untouched.

---

## 4. Parameters and Controls

### 4.1 Frequency (Hz)
- **Range:** 2,000 to 10,000 Hz.
- **Default:** 6,000 Hz.
- **Function:** Sets the center frequency of the detection band. For female vocals, 6-8kHz is common; for male vocals, 4-6kHz is often more effective.

### 4.2 Threshold (dB)
- **Range:** -60 to 0 dB.
- **Default:** -20 dB.
- **Function:** Determines how sensitive the de-esser is. Lower thresholds cause the processor to react to even subtle sibilance.

### 4.3 Ratio (:1)
- **Range:** 1:1 to 20:1.
- **Default:** 4:1.
- **Function:** Determines the intensity of the gain reduction once the threshold is exceeded. 

### 4.4 Monitor (Toggle)
- **Function:** When active, the user hears ONLY the filtered sidechain signal. This is an essential "surgical" tool for precisely tuning the **Frequency** parameter to the exact center of the harshness.

---

## 5. Mathematical Foundation

### 5.1 Band-Pass Filtering
The sidechain uses a 2nd-order Biquad Band-Pass filter. The coefficients are calculated to create a narrow "bell" shape ($Q 
approx 2.0$), ensuring that the detector only sees the problematic sibilance.

### 5.2 Gain Calculation
The gain reduction ($GR$) follows the standard Feed-Forward VCA model:

$$GR = \begin{cases} (Env_{dB} - Threshold) \times (1 - 1/Ratio) & \text{if } Env_{dB} > Threshold \\ 0 & \text{if } Env_{dB} \leq Threshold \end{cases}
$$

---

## 6. DSP Implementation Analysis (`deesser-processor.js`)

### 6.1 State Management
The processor maintains a filter and an envelope follower for each channel.
```javascript
this.channelState.push({
    filter: new BiquadFilter(),
    envelope: new EnvelopeFollower(),
    gainReduction: 0
});
```

### 6.2 The Detection Loop
For every sample:
1.  **Filter:** `sidechain = state.filter.process(sample)`.
2.  **Detect:** `env = state.envelope.process(sidechain)`.
3.  **Compute:** Calculate the decibel level and the required reduction.
4.  **Apply:** 
    ```javascript
    if (monitor) {
        output[i] = sidechain; // Monitoring mode
    } else {
        output[i] = sample * gain; // De-essing mode
    }
    ```

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The processor is designed for low-latency "real-time" performance. It uses a very fast attack time (fixed at ~5ms) to catch the instantaneous spikes of sibilance.

### 7.2 Node Layer (`DeEsserNode.ts`)
The Node handles the `monitor` and `bypass` flags, allowing the UI to quickly switch between processing and tuning modes without glitching.

### 7.3 UI Layer (`DeEsserUnit.tsx`)
The UI features a prominent **Frequency Slider** and a **Threshold Meter**. The "Monitor" button is usually styled distinctly to remind the user they are hearing the "listen" path.

---

## 8. Practical Engineering Guide

### 8.1 The "Search and Destroy" Method
1.  Enable **Monitor** mode.
2.  Sweep the **Frequency** knob until you hear the "s" sound most clearly and harshly (it will sound like a whistle or sharp static).
3.  Disable **Monitor** mode.
4.  Lower the **Threshold** until the harshness is reduced to a natural level. 

### 8.2 Avoid "The Lisp"
Over-de-essing occurs when you use a threshold that is too low or a ratio that is too high. This results in the singer sounding like they have a lisp (turning "s" into "th"). Always aim for transparency; 3-4dB of reduction is usually enough.

---

## 9. Common Troubleshooting
- **Dull Sound:** If the whole track sounds muffled, your **Frequency** is likely too low (entering the mid-range), or your **Threshold** is too low, causing constant gain reduction.
- **Inconsistent Action:** Ensure your input level is healthy. If the signal is too quiet, it will never cross the threshold.

---

## 10. Technical Specifications Summary
- **Filter Type:** 2nd-order Biquad Band-Pass.
- **Topology:** Broadband Compression (sidechain-driven).
- **Latency:** 0 samples.
- **Monitoring:** Listen to detection band.
