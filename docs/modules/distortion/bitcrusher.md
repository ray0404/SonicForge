# Bitcrusher: Technical Reference

## 1. Introduction
The **Bitcrusher** is an effect that deliberately degrades the fidelity of digital audio. Unlike distortion, which mimics analog overload, bitcrushing mimics the limitations of early digital hardware (like vintage samplers from the 80s and 90s). It introduces two specific types of degradation: **Bit Depth Reduction** (Quantization noise) and **Sample Rate Reduction** (Aliasing).

In Sonic Forge, this module allows for creative destruction, turning pristine high-definition audio into gritty, robotic, or nostalgic textures.

---

## 2. Fundamental Purpose and Use Cases
Lo-Fi aesthetics are a staple of modern production (Hip Hop, Industrial, EDM).

### Use Cases:
- **Vintage Sampler Emulation:** Setting the bits to 12 and frequency to 0.5 (22kHz) mimics the sound of the classic SP-1200 drum machine.
- **Robotic Vocals:** Extreme sample rate reduction creates metallic, "talking robot" artifacts.
- **Background Texture:** Crushing a reverb tail to add a layer of digital "fizz" that sits well in a mix.
- **Gated Fuzz:** Extreme bit reduction (1-2 bits) acts like a hard-gated fuzz pedal.

---

## 3. The Two Pillars of Degradation

### 3.1 Bit Depth Reduction (Quantization)
Digital audio represents amplitude as a series of steps.
- **24-bit:** 16,777,216 steps (Smooth, invisible).
- **8-bit:** 256 steps (Audible hiss and grain).
- **4-bit:** 16 steps (Blocky, distorted, aggressive).

Reducing the bit depth forces the signal to "snap" to the nearest available step, introducing an error signal known as **Quantization Noise**.

### 3.2 Sample Rate Reduction (Downsampling)
Digital audio represents time as a series of snapshots.
- **44.1kHz:** 44,100 snapshots per second.
- **Reduced Rate:** If we hold each snapshot for 10 samples, the effective rate becomes 4.4kHz.

This creates **Aliasing**—harmonic reflections that do not follow the harmonic series of the note, resulting in metallic, dissonant, and "ringing" tones.

---

## 4. Parameters and Controls

### 4.1 Bits
- **Range:** 1.0 to 16.0.
- **Default:** 8.0.
- **Function:** The number of bits used to represent amplitude.
    - **16:** CD Quality (Clean).
    - **8:** Gameboy / Vintage Sampler.
    - **1-2:** Pure noise and destruction.

### 4.2 Norm Freq (Normalized Frequency)
- **Range:** 0.001 to 1.0.
- **Default:** 1.0.
- **Function:** The target sample rate expressed as a fraction of the system rate.
    - **1.0:** Full fidelity (e.g., 44.1kHz).
    - **0.5:** Half rate (22.05kHz).
    - **0.1:** One-tenth rate (4.4kHz).

### 4.3 Mix (%)
- **Range:** 0 to 100%.
- **Default:** 100%.
- **Function:** Dry/Wet blend.

---

## 5. Mathematical Foundation

### 5.1 Quantization Logic
To reduce a signal $x$ (range -1 to 1) to $b$ bits:
1.  Calculate steps: $Steps = 2^b$.
2.  Scale up: $y = x \times Steps$.
3.  Round: $y_{int} = \text{floor}(y)$.
4.  Scale down: $x_{quant} = y_{int} / Steps$.

### 5.2 Downsampling Logic (Sample & Hold)
To reduce sample rate by a factor of $N$:
- A "Phasor" (counter) runs from 0 to 1.
- Every sample, $Phasor += (1/N)$.
- When $Phasor \ge 1.0$, we sample the input and reset the phasor.
- For all other samples, we output the *held* value of the last sample.
- This results in a "stairstep" waveform in the time domain.

---

## 6. DSP Implementation Analysis (`bitcrusher-processor.js`)

### 6.1 Phasor Implementation
The processor uses a shared phasor (or per-channel) to track the "hold" cycles.
```javascript
phasor += normFreq;
if (phasor >= 1.0) {
    phasor -= 1.0;
    // Update hold sample
    this.holdSamples[ch] = Math.floor(input * step) / step;
}
output = this.holdSamples[ch];
```

### 6.2 Stereo Coherence
The implementation uses a shared `phasor` logic (or synchronized phasors) to ensure that the Left and Right channels update at the exact same moment. If they updated asynchronously, the stereo image would jitter and phase issues would occur.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `BitCrusherProcessor` is efficient but relies on precise state management for the "Sample and Hold" buffer.

### 7.2 Node Layer (`BitCrusherNode.ts`)
Maps the normalized frequency parameter.

### 7.3 UI Layer (`BitCrusherUnit.tsx`)
A visualization of the "stairsteps" (Time vs. Amplitude) helps users understand exactly what the Sample Rate and Bit Depth controls are doing to the waveform.

---

## 8. Practical Engineering Guide

### 8.1 The "Daft Punk" Vocal
1.  Bits: 16 (Keep amplitude clean).
2.  Norm Freq: ~0.1 to 0.2.
3.  This creates the robotic, metallic ringing associated with vocoders and talkboxes, without the gritty distortion of bit reduction.

### 8.2 Adding "Air" to Snares
1.  Bits: 6 to 8.
2.  Norm Freq: 0.8.
3.  Mix: 20%.
4.  The quantization noise adds a "white noise" layer to the snare, making it sound brighter and crispier in a dense mix.

---

## 9. Common Troubleshooting
- **Silence/Gating:** At very low bit depths (1-2 bits), quiet signals might fall below the first "step" and become silent. This acts like a crude noise gate.
- **Harshness:** Bitcrushing adds significant high-frequency content. It is almost always a good idea to follow a Bitcrusher with a Low-Pass Filter (EQ) to tame the digital screech.

---

## 10. Technical Specifications Summary
- **Quantization:** Linear PCM.
- **Downsampling:** Zero-Order Hold (Step).
- **Latency:** 0 to 1 sample (depending on hold phase).
- **Topology:** Digital Degradation.
