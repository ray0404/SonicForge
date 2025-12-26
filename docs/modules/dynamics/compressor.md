# Versatile Dynamics Compressor: Technical Reference

## 1. Introduction
The **Versatile Dynamics Compressor** is a cornerstone of professional audio production. Its primary role is to reduce the dynamic range of a signal—essentially making the quiet parts louder and the loud parts quieter. This results in a more consistent, professional, and "glued" sound. The Sonic Forge implementation is uniquely flexible, offering four distinct hardware-inspired emulation modes that cater to everything from transparent vocal leveling to aggressive drum crushing.

By mastering this module, users can control the "punch," "weight," and "presence" of any audio track within the workstation.

---

## 2. Fundamental Purpose and Use Cases
Compression is used for three main reasons:
- **Consistency:** Ensuring a vocal performance stays at the front of the mix regardless of how loud or soft the singer performed.
- **Tone Shaping:** Using the "Attack" parameter to emphasize the transient snap of a snare drum or the "Sustain" parameter to bring out the room ambiance.
- **Sonic Character:** Adding the specific "flavor" of classic analog circuits like FET or Opto hardware.

### Common Scenarios:
- **Vocals:** Smooth out volume spikes using "Opto" mode for a natural, classic feel.
- **Drums:** Use "FET" mode with a slow attack to let the initial hit through while squashing the tail for massive impact.
- **Mastering:** Use "VarMu" mode with a low ratio (1.5:1) to gently "glue" the entire mix together.

---

## 3. Emulation Modes: The Heart of the Module
What sets this compressor apart is its ability to change its internal detection and gain-reduction logic based on the "Mode" parameter.

### Mode 0: VCA (Voltage Controlled Amplifier)
- **Character:** Clean, fast, and transparent.
- **Logic:** Feed-forward detection with a predictable, linear ratio. 
- **Best For:** Modern pop mixing, mastering, and precision control where coloration is not desired.

### Mode 1: FET (Field Effect Transistor)
- **Character:** Punchy, fast, and aggressive.
- **Logic:** **Feedback Detection**. The compressor analyzes the signal *after* the gain reduction has been applied. This creates a "clamping" effect that is highly responsive to transients.
- **Best For:** Snare drums, aggressive rock vocals, and bass guitars.

### Mode 2: Opto (Optical)
- **Character:** Smooth, musical, and "slow."
- **Logic:** **Program-Dependent Release**. The release time is not fixed; it varies based on the intensity and duration of the signal. This emulates the behavior of a light-dependent resistor (LDR) in vintage hardware like the LA-2A.
- **Best For:** Smooth vocal leveling, acoustic guitars, and "invisible" compression.

### Mode 3: VarMu (Variable-Mu)
- **Character:** Warm, thick, and harmonic.
- **Logic:** **Soft-Knee / Variable Ratio**. The ratio increases as the signal drives harder against the threshold. 
- **Best For:** The master bus, drum overheads, and adding "vintage weight" to a mix.

---

## 4. Parameters and Controls

### 4.1 Threshold (dB)
- **Range:** -60.0 to 0.0 dB
- **Default:** -24.0 dB
- **Function:** The level at which the compressor begins to act. Only signals exceeding this level will be compressed.

### 4.2 Ratio (:1)
- **Range:** 1.0 to 20.0
- **Default:** 4.0
- **Function:** Determines how much the signal is reduced. A 4:1 ratio means that for every 4dB the input exceeds the threshold, the output will only increase by 1dB.

### 4.3 Attack (Seconds)
- **Range:** 0.0001 to 1.0 s (0.1ms to 1000ms)
- **Default:** 0.01 s (10ms)
- **Function:** How quickly the compressor reacts to a signal exceeding the threshold. Faster attack times squash transients; slower attack times preserve "snap."

### 4.4 Release (Seconds)
- **Range:** 0.001 to 2.0 s (1ms to 2000ms)
- **Default:** 0.1 s (100ms)
- **Function:** How quickly the compressor returns to unity gain once the signal falls below the threshold. 

### 4.5 Knee / Factor
- **Range:** 0.0 to 20.0
- **Default:** 5.0
- **Function:** In VCA/FET modes, it softens the transition into compression. In VarMu mode, it acts as a "Ratio Intensity" factor.

### 4.6 Mix (%)
- **Range:** 0.0 to 1.0 (0% to 100%)
- **Default:** 1.0
- **Function:** Allows for **Parallel Compression**. By blending the compressed (wet) signal with the original (dry) signal, you can achieve heavy compression while maintaining the natural dynamics of the dry path.

---

## 5. Mathematical Foundation

### 5.1 Gain Reduction Formula
The core gain reduction ($GR$) in decibels is calculated using the following linear equation:

$$GR = (Input_{dB} - Threshold) \times (1 - 1/Ratio)$$

This value is only positive when the input exceeds the threshold.

### 5.2 VarMu Ratio Scaling
In VarMu mode, the ratio ($R$) is dynamic:

$$Ratio_{effective} = 1.0 + (Overshoot_{dB} \times KneeFactor)$$

This results in a compression curve that gets steeper the harder you hit it, providing a natural, musical response.

### 5.3 Ballistics (Envelope Timing)
The compressor uses exponential decay to smooth the gain changes. The coefficients are calculated as:

$$\alpha = e^{-1 / (Time \times SampleRate)}$$

---

## 6. DSP Implementation Analysis (`compressor-processor.js`)

### 6.1 State Management
The processor tracks the current gain reduction (`gr`) and the `lastOutput` for the FET feedback loop.
```javascript
this.channels.push({
    gr: 0, // Current Gain Reduction in dB
    lastOutput: 0 // For FET feedback loop
});
```

### 6.2 The Processing Loop
1.  **Detection:**
    - If `Mode === FET`, `detectorIn = previousOutput`.
    - Else, `detectorIn = currentInput`.
2.  **Conversion:** The absolute value of the detector is converted to dB.
3.  **Threshold Check:** `overshoot = envDb - threshold`.
4.  **Target Calculation:** If `overshoot > 0`, calculate `targetGR`.
5.  **Smoothing:** The `currentGR` state is moved toward `targetGR` using either the `attack` or `release` coefficient.
6.  **Application:** The final sample is multiplied by $10^{(-currentGR/20)}$.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `CompressorProcessor` runs the per-sample dynamics loop. It is optimized to support **a-rate** (sample-accurate) parameters if the host provides them, though the UI currently interacts with them as **k-rate** (block-accurate) for efficiency.

### 7.2 Node Layer (`CompressorNode.ts`)
The Node handles the mapping of the `mode` parameter (0-3) and ensures that all dynamic parameters are updated smoothly using the Web Audio API's `setTargetAtTime` method.

### 7.3 UI Layer (`CompressorUnit.tsx`)
The React UI features a Mode selector and high-fidelity knobs. It displays a real-time **Gain Reduction Meter**, which is essential for understanding how much the compressor is "working."

---

## 8. Practical Engineering Guide

### 8.1 The "Gold Standard" Vocal Chain
1.  **Mode:** Opto.
2.  **Ratio:** 3:1.
3.  **Attack:** 10ms.
4.  **Release:** 100ms.
5.  **Threshold:** Adjust until the meter shows 3-5dB of reduction on the loudest peaks.

### 8.2 Parallel Drum "Crushing"
1.  **Mode:** FET.
2.  **Ratio:** 20:1 (Limiting).
3.  **Attack:** 0.1ms (Fast).
4.  **Release:** 50ms.
5.  **Mix:** 30%.
This adds massive energy and "grit" to the drums without losing the clarity of the initial transients.

---

## 9. Common Troubleshooting
- **Clicking/Popping:** Usually caused by an extremely fast attack time (0.1ms) on low-frequency content. Increase the attack time slightly.
- **Dull/Dark Sound:** You are likely compressing too much. Raise the threshold or lower the ratio.
- **No Effect:** Check the "Mix" knob and ensure it is at 100%. Also, ensure the "Bypass" button is not active.

---

## 10. Technical Specifications Summary
- **Topology:** Switchable Feed-forward / Feed-back.
- **Modes:** VCA, FET, Opto, VarMu.
- **Knee:** Variable (0 to 20 dB).
- **Latency:** 0 samples (Zero-latency processing).
- **Automation:** Sample-accurate parameter support.
