# AutoWah (Envelope Filter): Technical Reference

## 1. Introduction
The **AutoWah**, also known as an Envelope Filter or "Touch Wah," is a dynamic frequency-sweeping effect. It mimics the sound of a traditional Wah-Wah pedal (which is manually rocked back and forth by a foot) by using the *amplitude* of the incoming signal to control the filter's cutoff frequency.

This creates a highly expressive, vocal-like "quack" or "wow" sound that responds intimately to the player's picking dynamics.

---

## 2. Fundamental Purpose and Use Cases
AutoWah brings rhythm and "funk" to a track.

### Use Cases:
- **Funk Guitar:** The classic 70s "wacka-wacka" sound.
- **Synth Bass:** Adding squelchy, acidic movement to a bassline (think TB-303 vibes).
- **Electric Piano:** Adding expressive bite to a Rhodes or Wurlitzer solo.
- **Drums:** Creating weird, breathing filter effects on a breakbeat loop.

---

## 3. How it Works: The Dynamic Sweep
The module is built on two core components:
1.  **Envelope Follower:** Tracks the volume of the input.
    - Louder Input -> Higher Control Signal.
    - Quieter Input -> Lower Control Signal.
2.  **Voltage Controlled Filter (VCF):** A Band-Pass (or Low-Pass) filter whose cutoff frequency is modulated by the control signal.

When you strike a note:
- The volume spikes (Attack).
- The filter sweeps UP quickly (Opening the wah).
- As the note decays (Sustain), the volume drops.
- The filter sweeps DOWN slowly (Closing the wah).

---

## 4. Parameters and Controls

### 4.1 Base Frequency (Hz)
- **Range:** 20 - 5000 Hz.
- **Default:** 100 Hz.
- **Function:** The "closed" position of the filter. When the signal is silent, the filter rests here.

### 4.2 Sensitivity
- **Range:** 0.0 to 10.0.
- **Default:** 0.5.
- **Function:** How much the filter moves in response to volume. High sensitivity means even quiet notes will trigger a full sweep.

### 4.3 Octaves (Range)
- **Range:** 0 to 8 octaves.
- **Default:** 4.
- **Function:** The maximum distance the filter can travel from the Base Frequency. If Base is 100Hz and Octaves is 4, the filter can sweep up to 1600Hz ($100 \times 2^4$).

### 4.4 Q (Resonance)
- **Range:** 0.1 to 20.0.
- **Default:** 2.0.
- **Function:** The sharpness of the filter peak.
    - **Low Q:** Subtle, mild tone shaping.
    - **High Q:** Sharp, vocal-like "quack." Extreme values can self-oscillate.

### 4.5 Attack / Release (Seconds)
- **Attack:** Speed of the upward sweep (opening). Fast = "Quack," Slow = "Mwah."
- **Release:** Speed of the downward sweep (closing).

---

## 5. Mathematical Foundation

### 5.1 Modulation Logic
The instantaneous Cutoff Frequency ($F_c$) is calculated as:

$$Mod = Envelope \times Sensitivity \times Octaves$$
$$F_c = BaseFreq \times 2^{Mod}$$

This exponential mapping ensures the sweep sounds musical and linear to the human ear (which hears pitch logarithmically).

### 5.2 Nyquist Safety
The calculated $F_c$ is clamped to ensure it never exceeds the Nyquist frequency ($SampleRate / 2$), which would cause the filter to explode or alias.
$$F_{safe} = \min(F_c, F_s / 2.1)$$

---

## 6. DSP Implementation Analysis (`autowah-processor.js`)

### 6.1 State Management
The processor uses an envelope follower and a biquad filter per channel.
```javascript
this.followers.push(new EnvelopeFollower());
this.filters.push(new BiquadFilter());
```

### 6.2 The Processing Loop
1.  **Follow:** `env = follower.process(x)`.
2.  **Map:** Calculate `cutoff` based on `env`.
3.  **Update:** `filter.setParams(cutoff, 0, Q, sampleRate, 'bandpass')`.
4.  **Filter:** `wet = filter.process(x)`.
5.  **Mix:** Blend wet and dry.

Note: Updating filter coefficients *per sample* gives the smoothest possible sweep resolution, avoiding "stepped" artifacts during fast transients.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `AutoWahProcessor` is optimized to handle the expensive per-sample coefficient updates efficiently.

### 7.2 Node Layer (`AutoWahNode.ts`)
Exposes the physical modeling parameters (Sensitivity, Range) rather than raw filter coefficients.

### 7.3 UI Layer (`AutoWahUnit.tsx`)
Ideally, this UI visualizes the "Sweep Range" so the user understands that the filter moves between Frequency A and Frequency B based on their playing dynamics.

---

## 8. Practical Engineering Guide

### 8.1 Getting the Perfect "Quack"
1.  Set **Q** to roughly 4.0 for a sharp peak.
2.  Set **Attack** very fast (10ms).
3.  Set **Base Freq** low (100-200Hz).
4.  Play your instrument loudly.
5.  Adjust **Sensitivity** until the filter opens fully on your hardest hits but stays closed on ghost notes.

### 8.2 The "Slow Synth Sweep"
1.  Set **Q** lower (1.0).
2.  Set **Attack** slow (500ms).
3.  Play a long, sustained chord.
4.  The filter will slowly swell open as the chord sustains, creating a "blooming" texture.

---

## 9. Common Troubleshooting
- **No Effect:** Your **Sensitivity** is likely too low, or your input signal is too quiet. Boost the input gain.
- **Harsh Distortion:** High **Q** values boost the gain at the resonant peak significantly. If the filter sweeps through a loud frequency, it can clip. Lower the input or the Q.

---

## 10. Technical Specifications Summary
- **Filter Type:** Dynamic Biquad Band-Pass.
- **Modulation Source:** Internal Envelope Follower.
- **Sweep Curve:** Exponential (Musical intervals).
- **Latency:** 0 samples.
