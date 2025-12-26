# Multi-Voice Chorus: Technical Reference

## 1. Introduction
The **Chorus** effect is one of the most recognizable sounds in music history, defining the guitar tones of the 80s and the synth textures of the 90s. Its goal is to simulate the natural imperfections of a choir or string ensemble. When multiple people sing the same note, they are never perfectly in tune or perfectly in time. These tiny variations create a "thick," "shimmering," and "wide" sound.

Sonic Forge implements a stereo chorus using modulated delay lines to replicate this psychoacoustic phenomenon.

---

## 2. Fundamental Purpose and Use Cases
Chorus is primarily a widening and thickening tool.

### Use Cases:
- **Stereo Width:** Turning a mono synth lead into a stereo wash that fills the headphones.
- **Vocal Thickening:** Adding a subtle chorus to a lead vocal makes it sound larger and more authoritative.
- **Clean Guitars:** The classic "Roland Jazz Chorus" sound—shimmery, liquid, and clean.
- **Lo-Fi Warble:** High depth and slow rate settings can simulate the instability of a broken cassette tape (Wow and Flutter).

---

## 3. How it Works: The Doppler Effect
DSP Chorus relies on the Doppler Effect—the same physics that makes an ambulance siren sound higher pitch as it approaches you and lower as it drives away.

1.  **Delay:** The input signal is written to a delay buffer.
2.  **Modulation:** An LFO (Low Frequency Oscillator) continuously changes the length of the delay (the "read head" moves back and forth).
    - When the delay shortens (read head moves closer), the pitch goes UP.
    - When the delay lengthens (read head moves away), the pitch goes DOWN.
3.  **Mixing:** This pitch-shifting wet signal is mixed with the steady dry signal. The interference between the two creates the characteristic "beating" and "swirling" texture.

---

## 4. Parameters and Controls

### 4.1 Frequency (Rate)
- **Range:** 0.1 to 10.0 Hz.
- **Default:** 1.5 Hz.
- **Function:** How fast the pitch wobbles. 
    - **Slow (<1Hz):** Lush, expansive pads.
    - **Fast (>5Hz):** Vibrato, warble, underwater effects.

### 4.2 Delay Time (Base)
- **Range:** 0.0 to 0.1 s (0 to 100ms).
- **Default:** 0.03 s (30ms).
- **Function:** The average time delay.
    - **Short (<10ms):** Flanging territory (metallic).
    - **Medium (20-40ms):** Classic Chorus.
    - **Long (>50ms):** Slapback echo territory (doubling).

### 4.3 Depth
- **Range:** 0.0 to 0.01 s (0 to 10ms).
- **Default:** 0.002 s (2ms).
- **Function:** How far the LFO sweeps.
    - **Low:** Subtle thickening.
    - **High:** Extreme pitch bending (detuning).

### 4.4 Feedback
- **Range:** 0.0 to 0.95.
- **Default:** 0.0.
- **Function:** Feeds the output back into the input. Adds resonance and a metallic ringing, pushing the sound toward **Flanger** territory.

### 4.5 Wet
- **Range:** 0.0 to 1.0.
- **Default:** 0.5.
- **Function:** The classic Chorus sound is usually a 50/50 mix (maximum interference). 100% Wet results in pure Vibrato (pitch shift only, no beating).

---

## 5. Mathematical Foundation

### 5.1 Modulated Delay Line
$$Delay[n] = BaseDelay + Depth \times \sin(2\pi \times Rate \times t)$$

### 5.2 Interpolation
Since the calculated delay length is rarely an integer number of samples (e.g., "delay by 45.3 samples"), the processor must interpolate between sample 45 and sample 46. Sonic Forge typically uses Linear Interpolation for efficiency, though Cubic Interpolation is smoother.

### 5.3 Stereo Spread
To create width, the Left and Right channels use independent LFOs.
- **Left LFO Phase:** $0^\circ$.
- **Right LFO Phase:** $90^°$ (or $180^°$).

This offset means that while the left ear hears pitch going up, the right ear hears it steady or going down, creating a massive sense of space.

---

## 6. DSP Implementation Analysis (`chorus-processor.js`)

### 6.1 State Management
```javascript
this.delays.push(new DelayLine(0.5, sampleRate));
this.lfos.push(new LFO());
if (i === 1) this.lfos[i].phase = Math.PI / 2; // Stereo Offset
```

### 6.2 The Processing Loop
1.  **LFO:** Calculate `lfoVal`.
2.  **Mod:** `modSamples = (base + depth * lfoVal) * sampleRate`.
3.  **Read:** `wet = delay.read(modSamples)`.
4.  **Write:** `delay.write(input + wet * feedback)`.
5.  **Mix:** `out = dry*(1-mix) + wet*mix`.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `ChorusProcessor` manages the circular buffers and the fractional delay reading logic.

### 7.2 Node Layer (`ChorusNode.ts`)
Maps parameters.

### 7.3 UI Layer (`ChorusUnit.tsx`)
Often visualizes the LFO rate with a pulsing LED or animation, helping the user visualize the speed of the modulation.

---

## 8. Practical Engineering Guide

### 8.1 The "Dimension D" Trick
(Famous wide, subtle chorus).
1.  **Rate:** 0.5 Hz (Slow).
2.  **Depth:** Very Low (1ms).
3.  **Delay Time:** Short (10-15ms).
4.  **Feedback:** 0.
5.  **Stereo:** Must use stereo offset.
This adds width without the listener consciously hearing "chorus."

### 8.2 Tape Warble
1.  **Rate:** 3-5 Hz.
2.  **Depth:** High.
3.  **Wet:** 100% (No dry signal).
4.  This removes the "beating" and leaves only the unstable, pitch-shifting vibrato of an old cassette player.

---

## 9. Common Troubleshooting
- **Phase Cancellation:** If you collapse the mix to Mono, a wide stereo chorus can sometimes disappear or sound thin due to the L/R phase offsets cancelling each other out. Always check mono compatibility.
- **Sea-Sickness:** High depth + low rate can make the pitch swing so much it makes the listener feel dizzy. Use lower depth for subtle results.

---

## 10. Technical Specifications Summary
- **Topology:** Modulated Delay Line.
- **Interpolation:** Linear.
- **LFO Waveform:** Sine.
- **Stereo:** Phase-offset LFOs.
- **Latency:** Dependent on minimum delay time settings.
