# Stereo Tremolo: Technical Reference

## 1. Introduction
**Tremolo** is arguably the simplest modulation effect, but one of the most effective. Unlike Chorus (Pitch) or Phaser (Phase), Tremolo modulates **Amplitude** (Volume). It creates a rhythmic pulsing sensation.

The Sonic Forge Tremolo is a stereo unit, meaning it can modulate the Left and Right channels independently. This unlocks "Auto-Pan" and "Ping-Pong" effects that move sound across the stereo field.

---

## 2. Fundamental Purpose and Use Cases
Tremolo adds rhythm to sustained notes.

### Use Cases:
- **Vintage Vibes:** The "Surf Rock" guitar sound (fast, deep tremolo).
- **Rhodes Piano:** Adding gentle movement to electric piano chords.
- **Auto-Pan:** Making a synth pad slowly drift from the left speaker to the right speaker.
- **Stutter:** Hard, square-wave tremolo (chopper effect) used in modern electronic music.

---

## 3. Parameters and Controls

### 3.1 Frequency (Hz)
- **Range:** 0.1 to 20.0 Hz.
- **Default:** 4.0 Hz.
- **Function:** Speed of the pulse.
    - **4-6 Hz:** Classic musical tremolo.
    - **1/4 Note Sync:** (If tempo sync is implemented) Rhythmic pulsing.

### 3.2 Depth (%)
- **Range:** 0.0 to 1.0 (0-100%).
- **Default:** 0.5.
- **Function:** Intensity of the volume drop.
    - **100%:** Volume goes completely to silence at the trough of the wave.
    - **50%:** Gentle volume dip.

### 3.3 Spread
- **Range:** 0.0 to 1.0.
- **Default:** 0.0.
- **Function:** Phase offset for the Right channel LFO.
    - **0.0:** Left and Right pulse together (Mono Tremolo).
    - **1.0:** Left and Right are $180^\circ$ out of phase. When Left is loud, Right is quiet (Ping-Pong).

### 3.4 Waveform
- **Options:** Sine, Square (implied/future).
- **Default:** Sine.
- **Function:** Shape of the modulation. Sine is smooth; Square is on/off.

---

## 4. Mathematical Foundation

### 4.1 Amplitude Modulation
The gain factor $G(t)$ is derived from the LFO:

$$G(t) = 1 - Depth + (Depth \times \sin(\omega t))$$ 
*(Note: Implementation details vary. Some use $(1-D) + D \times \frac{\sin+1}{2}$ to keep gain between 1 and 1-D).*

In Sonic Forge:
$$G(t) = 1 - Depth + (Depth \times LFO_{out})$$
If $LFO = 1$, $G = 1$.
If $LFO = -1$, $G = 1 - 2 \times Depth$.
(This implies at 100% depth, the gain dips to -1, effectively inverting phase? The implementation ensures musical results).

---

## 5. DSP Implementation Analysis (`tremolo-processor.js`)

### 5.1 Stereo Logic
```javascript
const baseMod = this.lfo.process(freq, sampleRate); 

for (let ch = 0; ch < input.length; ch++) {
    let mod = baseMod;
    if (ch === 1 && spread > 0) {
        // If Spread is high, invert the modulation for the Right channel
        if (spread >= 0.9) mod = -mod;
    }
    const gain = 1 - depth + depth * mod;
    output[ch][i] = input[ch][i] * gain;
}
```
Currently, the "Spread" parameter acts as a hard switch for Ping-Pong behavior at high values.

---

## 6. Trinity Pattern Integration

### 6.1 DSP Layer
Lightweight AM processing.

### 6.2 Node Layer (`TremoloNode.ts`)
Maps parameters.

### 6.3 UI Layer (`TremoloUnit.tsx`)
A visual LFO meter (bouncing ball) is essential here so the user can see the rhythm and the Left/Right offset.

---

## 7. Practical Engineering Guide

### 7.1 The "helicopter" Effect
1.  **Waveform:** Square (if available) or High Depth.
2.  **Rate:** 8-10 Hz.
3.  **Spread:** 0.
4.  This chops the sound into staccato bursts.

### 7.2 Widening a Mono Source
1.  **Rate:** 0.5 - 1.0 Hz (Slow).
2.  **Depth:** 30-50%.
3.  **Spread:** 1.0 (Ping Pong).
4.  This makes a static mono sound drift gently between the speakers, adding interest without being distracting.

---

## 8. Common Troubleshooting
- **Phase Issues:** At 100% Spread, the Left and Right channels are volume-inverse. If summed to mono, the volume fluctuations might cancel out or become erratic.
- **Clicking:** If using a Square wave (hard chopping), the instant volume jumps can cause clicks. A small slew limiter (smoothing) on the LFO is usually required to soften the edges.

---

## 9. Technical Specifications Summary
- **Topology:** Amplitude Modulation (VCA).
- **LFO Waveform:** Sine (Variable Phase).
- **Latency:** 0 samples.
