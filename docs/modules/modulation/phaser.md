# Multi-Stage Phaser: Technical Reference

## 1. Introduction
The **Phaser** (Phase Shifter) is a psychedelic modulation effect that gained prominence in the 1960s and 70s. Unlike a Chorus/Flanger which uses delay lines, a Phaser uses a series of **All-Pass Filters**. These filters do not change the volume of frequencies, but they change their *phase* relationship.

When this phase-shifted signal is mixed back with the original, specific frequencies cancel out (destructive interference), creating deep "notches" in the spectrum. As an LFO sweeps the filters, these notches move up and down, creating a sweeping, "whooshing," or "vocal-like" texture.

---

## 2. Fundamental Purpose and Use Cases
Phasers add movement and "liquid" texture to static sounds.

### Use Cases:
- **Keys/Synths:** The classic "Jean-Michel Jarre" string sound.
- **Funk Guitar:** Adding a slow, chewing movement to rhythm guitar parts.
- **Drums:** Putting a phaser on hi-hats creates a constantly evolving stereo image.
- **Psychedelic Rock:** The swirling, dizzying texture of 70s rock solos.

---

## 3. How it Works: The All-Pass Chain
An **All-Pass Filter** passes all frequencies at equal amplitude but shifts their phase by $0^\circ$ to $180^°$ depending on the frequency.

- **1 Stage:** Creates 1 phase shift transition.
- **2 Stages:** Creates 1 notch (when mixed with dry).
- **4 Stages:** Creates 2 notches.
- **8 Stages:** Creates 4 notches.

More stages mean a more complex, "rippled" frequency response.

---

## 4. Parameters and Controls

### 4.1 Stages
- **Range:** 2, 4, 6, 8.
- **Default:** 4.
- **Function:** The "Order" of the phaser.
    - **2 Stages:** Subtle, gentle.
    - **4 Stages:** Classic vintage phaser (e.g., MXR Phase 90).
    - **8 Stages:** Deep, sci-fi, watery.

### 4.2 Frequency (Rate)
- **Range:** 0.1 to 10.0 Hz.
- **Default:** 0.5 Hz.
- **Function:** Speed of the LFO sweep.

### 4.3 Base Frequency
- **Range:** 50 to 5000 Hz.
- **Default:** 1000 Hz.
- **Function:** The center point around which the sweep oscillates.

### 4.4 Octaves (Range)
- **Range:** 0 to 5.
- **Default:** 2.
- **Function:** How wide the sweep is. High values sweep from deep bass to shimmering treble.

### 4.5 Wet
- **Range:** 0 to 1.0.
- **Default:** 0.5.
- **Function:** For maximum notching, a 50/50 mix is mathematically required.
    - **50% Wet:** Deepest notches (Maximum effect).
    - **100% Wet:** Vibrato/Phase-shift only (No notches, subtle).

---

## 5. Mathematical Foundation

### 5.1 The All-Pass Filter
The transfer function for a 1st-order All-Pass filter is:
$$H(z) = \frac{-\alpha + z^{-1}}{1 - \alpha z^{-1}}$$
Where $\alpha$ depends on the cutoff frequency ($f_c$):
$$\alpha = \frac{\tan(\pi f_c / F_s) - 1}{\tan(\pi f_c / F_s) + 1}$$

### 5.2 Modulation
The LFO modulates $f_c$ exponentially:
$$f_c(t) = BaseFreq \times 2^{(LFO(t) \times Range)}$$

---

## 6. DSP Implementation Analysis (`phaser-processor.js`)

### 6.1 Architecture
The processor maintains a 2D array of filters: `filters[channel][stage]`.
```javascript
for (let s = 0; s < 8; s++) stageFilters.push(new OnePoleAllPass());
```

### 6.2 The Processing Loop
1.  **LFO:** Calculate current modulation value.
2.  **Alpha:** Calculate the filter coefficient $\alpha$ based on the modulated frequency.
3.  **Cascade:** Pass the sample through $N$ filters in series.
    ```javascript
    let stageSample = inSample;
    for (let s = 0; s < numStages; s++) {
        stageSample = this.filters[ch][s].process(stageSample, alpha);
    }
    ```
4.  **Mix:** `out = input * (1-wet) + stageSample * wet`.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `PhaserProcessor` relies on the `OnePoleAllPass` helper class. It updates the $\alpha$ coefficient every sample (or block) to ensure a smooth sweep without stepping artifacts.

### 7.2 Node Layer (`PhaserNode.ts`)
Maps parameters.

### 7.3 UI Layer (`PhaserUnit.tsx`)
Visualizing the "Stages" is helpful—showing 2, 4, or 8 notches moving across a frequency graph helps users understand the sonic difference.

---

## 8. Practical Engineering Guide

### 8.1 The "Jet Plane"
1.  **Stages:** 8 (Complex).
2.  **Rate:** 0.2 Hz (Very Slow).
3.  **Feedback:** (If available) High. (Sonic Forge Phaser currently relies on stages for depth, but feedback is a common extension).
4.  **Wet:** 50%.
5.  This creates the massive, sweeping sound often used on drum overheads or full mixes in breaks.

### 8.2 Subtle Movement
1.  **Stages:** 2.
2.  **Rate:** 1.0 Hz.
3.  **Range:** Low (1 Octave).
4.  This adds a gentle "breathing" quality to synth pads without dominating the mix.

---

## 9. Common Troubleshooting
- **Volume Drop:** At 50% mix, the notches remove energy from the signal. You may need to compensate by boosting the track volume slightly.
- **Disappearing Bass:** Phasers affect the phase of low frequencies significantly. If used on a bass guitar, check that the low end doesn't become "hollow."

---

## 10. Technical Specifications Summary
- **Topology:** Cascaded 1st-Order All-Pass Filters.
- **Sweep:** Exponential.
- **Notches:** Stages / 2.
- **Latency:** 0 samples (Phase shift only).
