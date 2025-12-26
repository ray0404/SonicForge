# Transient Shaper: Technical Reference

## 1. Introduction
The **Transient Shaper** is a dynamics processor that operates on a fundamentally different principle than a compressor. While compressors react to *absolute level* (volume), a transient shaper reacts to the *rate of change* (slope) of the signal. This allows it to modify the initial attack (transient) and the sustain (tail) of a sound completely independently of its input level.

In Sonic Forge, this module is an invaluable tool for sound design, drum mixing, and shaping the "envelope" of percussive elements without the threshold-dependence of standard compression.

---

## 2. Fundamental Purpose and Use Cases
Traditional compressors struggle to isolate the "attack" from the "sustain" if the sustain is nearly as loud as the attack. A Transient Shaper ignores the volume and focuses on the *shape*.

### Use Cases:
- **Drum Punch:** Increasing the **Attack** parameter adds significant "snap" and impact to kick and snare drums, cutting through a dense mix.
- **Room Removal:** Reducing the **Sustain** parameter acts like a precise noise gate, shortening the decay of a drum hit and effectively "drying up" the room sound.
- **Guitar Articulation:** Boosting the attack emphasizes the pick sound; boosting the sustain makes the notes ring out longer.
- **Sample Design:** Transforming a dull, flat sample into something sharp and aggressive.

---

## 3. How it Works: Differential Envelope Analysis
The core algorithm relies on comparing two parallel envelope followers:
1.  **Fast Envelope:** Follows the signal extremely closely (typically 10ms integration time). It tracks the immediate rise of the transient.
2.  **Slow Envelope:** Follows the signal more loosely (typically 100ms integration time). It represents the "average" energy.

The difference ($\Delta$) between these two envelopes defines the transient behavior:
- If $\Delta > 0$ (Fast > Slow), the signal is rapidly rising. This is an **Attack** event.
- If $\Delta < 0$ (Fast < Slow), the signal is falling or steady. This is a **Sustain** event.

---

## 4. Parameters and Controls

### 4.1 Attack Gain (dB)
- **Range:** -24.0 to +24.0 dB.
- **Default:** 0.0 dB.
- **Function:** Controls the volume of the detected transients.
    - Positive values make the sound "punchier" and "snappier."
    - Negative values soften the attack, pushing the sound back in the mix.

### 4.2 Sustain Gain (dB)
- **Range:** -24.0 to +24.0 dB.
- **Default:** 0.0 dB.
- **Function:** Controls the volume of the signal's tail/decay.
    - Positive values increase the ambiance, ring, and body.
    - Negative values shorten the sound, tightening the groove.

### 4.3 Mix (%)
- **Range:** 0 to 100%.
- **Default:** 100%.
- **Function:** A standard Dry/Wet blend knob. Used for parallel processing (e.g., blending extreme transient shaping with the natural signal).

---

## 5. Mathematical Foundation

### 5.1 The Delta Function
The "Transientness" factor is calculated as:

$$\Delta[n] = Env_{fast}[n] - Env_{slow}[n]$$

### 5.2 Gain Mapping
The applied gain ($G_{dB}$) depends on the polarity of $\Delta$:

$$G_{dB} = \begin{cases} \Delta \times AttackGain \times k & \text{if } \Delta > 0 \\ |\Delta| \times SustainGain \times k & \text{if } \Delta < 0 \end{cases}$$

(Where $k$ is an internal scaling constant, usually 2.0, to ensure the knob range feels responsive).

### 5.3 Linear Gain Application
The final sample processing is:

$$Output[n] = Input[n] \times 10^{(G_{dB} / 20)}$$

---

## 6. DSP Implementation Analysis (`transient-processor.js`)

### 6.1 State Management
The processor uses two `EnvelopeFollower` instances per channel.
```javascript
this.channelState.push({
    fastEnv: new EnvelopeFollower(),
    slowEnv: new EnvelopeFollower()
});
```
The time constants are fixed internally to ensure consistent transient detection logic:
- `fastTime = 0.010` (10ms)
- `slowTime = 0.100` (100ms)

### 6.2 The Processing Loop
For every sample:
1.  **Analyze:** Process the sample through both envelopes.
2.  **Compare:** Calculate `delta = fast - slow`.
3.  **Scale:** Multiply the delta by the user's Attack or Sustain gain parameter.
4.  **Apply:** Modulate the input sample by the calculated gain factor.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `TransientProcessor` is strictly feed-forward and level-independent. This makes it extremely robust; it works identically on a -30dB signal and a -3dB signal, unlike a compressor which would need threshold adjustment.

### 7.2 Node Layer (`TransientShaperNode.ts`)
The Node simply exposes the gain parameters. Since the logic is internal to the DSP comparison, there are no complex "timing" parameters to expose to the user, making it a very "easy to use" module.

### 7.3 UI Layer (`TransientShaperUnit.tsx`)
The UI typically consists of two large, central knobs (Attack and Sustain), emphasizing the simplicity of the workflow.

---

## 8. Practical Engineering Guide

### 8.1 "Drying" a Drum Loop
If you have a drum break that has too much reverb baked into the recording:
1.  Set **Attack** to +3dB (to keep the punch).
2.  Set **Sustain** to -6dB or lower.
3.  Listen as the room sound disappears, leaving only the tight direct hits.

### 8.2 Making Synth Plucks "Pop"
On a dull synth pluck sound:
1.  Crank the **Attack** to +6dB or more.
2.  This adds a sharp, percussive edge to the start of every note, helping it cut through a dense pad or reverb wash.

---

## 9. Common Troubleshooting
- **Clipping:** Transient shaping adds actual gain to peaks. If you boost the Attack by +6dB, your peak level *will* increase by roughly 6dB. Always check your output levels and use a Limiter afterward if necessary.
- **Artifacts:** Extreme settings (e.g., +24dB Attack) can sound unnatural or "clicky." Use the Mix knob to blend the effect for a more subtle result.

---

## 10. Technical Specifications Summary
- **Topology:** Differential Envelope Follower.
- **Level Dependence:** None (Level Independent).
- **Latency:** 0 samples.
- **Channels:** Stereo linked or dual-mono.
