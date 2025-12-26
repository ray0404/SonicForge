# Analog Saturation: Technical Reference

## 1. Introduction
**Analog Saturation** is the process of adding harmonic complexity to a signal by simulating the non-linear behavior of analog electrical components. In the digital domain, "perfect" signals can sound sterile or cold. Saturation introduces subtle (or drastic) imperfections—harmonic distortion and soft clipping—that the human ear interprets as "warmth," "thickness," and "character."

Sonic Forge provides a versatile saturation engine capable of emulating three distinct flavors of analog dirt: Tape, Tube, and Fuzz.

---

## 2. Fundamental Purpose and Use Cases
Saturation is arguably the most used effect in modern mixing, often applied subtly across every channel.

### Use Cases:
- **Warmth:** Adding even-order harmonics (Tube) to make a digital synth sound more organic.
- **Glue:** Running a drum bus through Tape saturation to compress the peaks and blend the hits together.
- **Presence:** Adding slight distortion to a bass guitar helps it cut through small speakers (like phones) where the fundamental sub-bass is inaudible.
- **Lo-Fi:** Crushing a signal to make it sound broken or vintage.

---

## 3. Emulation Types

### 3.1 Tape (Type 0)
- **Profile:** Smooth, subtle, and compressive.
- **Harmonics:** Dominantly **Odd-Order** (3rd, 5th).
- **Behavior:** As signal increases, the tape "saturates" smoothly, acting like a soft limiter. It tends to absorb high-frequency transients.

### 3.2 Tube (Type 1)
- **Profile:** Warm, asymmetrical, and musical.
- **Harmonics:** Strong **Even-Order** (2nd) harmonics.
- **Behavior:** Triode tubes clip asymmetrically (the top of the wave flattens differently than the bottom). This adds a rich, "thick" tone that is very pleasing to the ear.

### 3.3 Fuzz (Type 2)
- **Profile:** Aggressive, hard, and buzzy.
- **Harmonics:** Dense spectrum of odd and high-order harmonics.
- **Behavior:** Modeled after transistor-based clipping (like a guitar fuzz pedal). The waveform is squared off abruptly, creating a distinct "fizz."

---

## 4. Parameters and Controls

### 4.1 Drive
- **Range:** 0.0 to 10.0.
- **Default:** 0.0.
- **Function:** Controls the input gain into the saturation stage.
    - **0.0:** Unity gain (Clean).
    - **1.0-3.0:** Subtle coloration.
    - **8.0+:** Heavy distortion.

### 4.2 Type
- **Options:** Tape, Tube, Fuzz.
- **Function:** Selects the mathematical transfer function used for the waveshaping.

### 4.3 Output Gain (dB)
- **Range:** -12.0 to +12.0 dB.
- **Default:** 0.0 dB.
- **Function:** Post-distortion volume control. Driving the input makes the signal louder; use this to compensate and match the level.

### 4.4 Mix (%)
- **Range:** 0 to 100%.
- **Default:** 100%.
- **Function:** Allows for "Parallel Saturation." Blending a heavily distorted signal with the clean original is a common technique for adding body without losing definition.

---

## 5. Mathematical Foundation

### 5.1 Waveshaping
Saturation is implemented using a static non-linear transfer function $y = f(x)$.

**Tape (Approximate Tanh):**
$$f(x) = \tanh(x)$$
*Produces odd harmonics.*

**Tube (Asymmetric):**
$$f(x) = \begin{cases} x & \text{if } x < -1 \\ x - 0.15 x^2 & \text{if } -1 \le x \le 1 \\ 0.85 & \text{if } x > 1 \end{cases}$$
*The quadratic term introduces even harmonics.*

**Fuzz (Hard Clip):**
$$f(x) = \text{sign}(x) \times (1 - e^{-|x|})$$
*(Or similar hard-knee functions).*

---

## 6. DSP Implementation Analysis (`saturation-processor.js`)

### 6.1 Architecture
The processor delegates the math to a `Saturator` helper class (if present) or implements it directly.
```javascript
const saturated = this.saturator.process(inputChannel[i], 1.0 + currentDrive, currentType);
```

### 6.2 Drive Scaling
The "Drive" parameter acts as a multiplier *before* the function.
$x_{driven} = x_{in} \times (1 + Drive)$
The result is then passed through the shaper.

### 6.3 Aliasing Considerations
Non-linear processes expand the bandwidth of the signal. If the generated harmonics exceed the Nyquist frequency, they fold back as dissonant **aliasing**.
- **Oversampling:** High-quality implementations often upsample the signal (2x or 4x), apply the distortion, filter out the ultrasonics, and then downsample. The current MVP implementation operates at the system sample rate, so extreme drive settings on high-pitched sounds may produce digital artifacts.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The processor is lightweight (memory-wise) but math-heavy (per-sample function calls).

### 7.2 Node Layer (`SaturationNode.ts`)
Maps the "Type" parameter from an integer/float to the internal string or enum expected by the DSP.

### 7.3 UI Layer (`SaturationUnit.tsx`)
Features a "Drive" knob and a selector for the Type. The UI should ideally encourage "gain staging" (matching input and output volumes).

---

## 8. Practical Engineering Guide

### 8.1 The "Fake Console" Trick
1.  Put the Saturation module on *every* channel in your mix.
2.  Select **Tape** mode.
3.  Set **Drive** to a very low setting (0.5 - 1.0).
4.  This cumulative effect mimics the sound of summing audio through an analog console, making the mix sound more cohesive.

### 8.2 Parallel Bass Dirt
1.  Set **Type** to Tube or Fuzz.
2.  Crank **Drive** to 8.0 until the bass is nasty.
3.  Dial the **Mix** back to 20-30%.
4.  You now have the clean low-end punch of the dry signal plus the mid-range growl of the wet signal.

---

## 9. Common Troubleshooting
- **Loss of Transients:** Saturation inherently rounds off peaks (compression). If your drums lose their impact, lower the drive or use the Mix knob to blend the transients back in.
- **Digital Hash:** If you hear weird metallic ringing on high notes, it's likely aliasing. Reduce the drive or filter the high frequencies before the saturation stage.

---

## 10. Technical Specifications Summary
- **Topology:** Static Waveshaping.
- **Types:** 3 (Tape, Tube, Fuzz).
- **Aliasing:** Non-oversampled (Standard).
- **Latency:** 0 samples.
