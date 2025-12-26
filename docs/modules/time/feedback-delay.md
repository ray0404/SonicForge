# Feedback Delay: Technical Reference

## 1. Introduction
The **Feedback Delay** is a time-based effect that creates repeating echoes of the input signal. It is fundamental to creating a sense of space, depth, and rhythm in a mix. Unlike reverb, which simulates the chaotic reflections of a room, delay simulates distinct, discrete reflections (like shouting into a canyon).

Sonic Forge implements a high-fidelity digital delay with smooth parameter interpolation, allowing for "dub-style" pitch warping effects when the time is adjusted in real-time.

---

## 2. Fundamental Purpose and Use Cases
Delay places a sound in a specific temporal space.

### Use Cases:
- **Slapback:** A single, short repeat (80-120ms) commonly used on 50s rock vocals and guitars.
- **Rhythmic Delay:** Setting the time to a 1/8th or 1/4 note (e.g., 500ms at 120BPM) creates a groove that interacts with the beat.
- **Space:** A subtle, low-feedback stereo delay can push a sound back in the mix without muddying it like reverb might.
- **Dub Effects:** Cranking the feedback to near 100% creates a self-oscillating loop that builds in intensity.

---

## 3. Parameters and Controls

### 3.1 Delay Time (Seconds)
- **Range:** 0.0 to 2.0 s.
- **Default:** 0.5 s.
- **Function:** The time interval between repeats.
    - **< 20ms:** Phasing/Comb filtering.
    - **20-50ms:** Doubling/Thickening.
    - **50-150ms:** Slapback.
    - **> 200ms:** Distinct echoes.

### 3.2 Feedback
- **Range:** 0.0 to 0.95.
- **Default:** 0.3.
- **Function:** The amount of output signal fed back into the input.
    - **0.0:** One single repeat.
    - **0.5:** Several repeats fading out.
    - **0.95:** Near-infinite loop. (Clamped below 1.0 to prevent runaway speaker damage).

### 3.3 Wet
- **Range:** 0.0 to 1.0.
- **Default:** 0.5.
- **Function:** Dry/Wet blend.

---

## 4. Mathematical Foundation

### 4.1 Circular Buffer
The delay line is implemented as a circular buffer (an array) of length $N$.
- **Write Pointer:** Increments every sample. Writes input + feedback.
- **Read Pointer:** $WritePointer - (Time \times SampleRate)$.

### 4.2 Interpolation
If the Read Pointer falls between two integer indices (e.g., index 100.5), the processor must interpolate.
$$y = x[100] \times 0.5 + x[101] \times 0.5$$
This allows for smooth time changes. Without interpolation, changing the delay time would cause zipper noise and glitches. With it, it causes a pitch-shift (Doppler) effect.

---

## 5. DSP Implementation Analysis (`feedback-delay-processor.js`)

### 5.1 Feedback Path
```javascript
const wetSig = delayLine.read(delaySamples);
const toBuffer = x + wetSig * fb;
delayLine.write(toBuffer);
```
Crucially, the signal written to the buffer includes the feedback. This creates the "echo of an echo" chain.

### 5.2 Saturation (Implicit or Explicit)
Ideally, a feedback loop should have a soft clipper inside it. If the feedback > 1.0 (or builds up due to resonance), it will digitally clip. Sonic Forge relies on the user to manage levels, but the `0.95` cap on the feedback parameter acts as a safety guard.

---

## 6. Trinity Pattern Integration

### 6.1 DSP Layer
Uses the `DelayLine` helper class, which handles the wrapping of read/write pointers and linear interpolation.

### 6.2 Node Layer (`FeedbackDelayNode.ts`)
Maps parameters.

### 6.3 UI Layer (`FeedbackDelayUnit.tsx`)
A "Tap Tempo" button is a common feature request for delays, allowing the user to click the beat to set the time.

---

## 7. Practical Engineering Guide

### 7.1 The "Abbey Road" Trick (Manual)
To create a delay that doesn't clutter the center of the mix:
1.  Use a Send/Return setup (or Wet=100%).
2.  Follow the delay with a High-Pass filter (cut below 400Hz) and a Low-Pass filter (cut above 4kHz).
3.  This makes the echoes sound distinct from the direct signal, simulating the bandwidth limitations of vintage tape echoes.

### 7.2 Self-Oscillation
1.  Turn Feedback to maximum.
2.  Play a short sound.
3.  Ideally, the delay loop captures it and repeats it forever.
4.  Twist the **Time** knob. The pitch of the loop will swoop up and down. (Classic Dub/Reggae effect).

---

## 8. Common Troubleshooting
- **Runaway Feedback:** If the volume keeps building until it distorts, turn down the Feedback immediately!
- **Timing Drift:** If using the delay rhythmically, ensure the Time parameter matches the song's BPM mathematically ($60 / BPM = \text{Quarter Note Seconds}$). 

---

## 9. Technical Specifications Summary
- **Topology:** Digital Delay Line with Feedback.
- **Interpolation:** Linear.
- **Max Time:** 2.0 seconds.
- **Latency:** 0 samples (Direct signal path).
