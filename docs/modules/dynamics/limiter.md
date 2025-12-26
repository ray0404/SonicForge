# Lookahead Limiter: Technical Reference

## 1. Introduction
The **Lookahead Limiter** is a critical tool in the mastering engineer's toolkit. Its primary function is to prevent digital audio from exceeding a specific peak level (clipping) while allowing the average signal level to be increased, thereby maximizing perceived loudness. In the Sonic Forge ecosystem, it serves as the final safeguard in the signal chain, ensuring a broadcast-ready output that adheres to strict digital ceilings.

Unlike traditional compressors or soft-limiters, a "true" lookahead limiter is designed for zero-overshoot performance. It achieves this through a clever combination of signal delay and anticipatory analysis, allowing the gain reduction envelope to fully engage before the peak actually reaches the output.

---

## 2. Fundamental Purpose and Use Cases
In modern digital audio, exceeding 0.0 dBFS results in harsh, non-harmonic distortion known as digital clipping. The Limiter is used to:
- **Peak Management:** Tame sporadic transients that would otherwise cause clipping.
- **Loudness Normalization:** Drive a mix harder into the limiter to reduce dynamic range and increase the "density" of the sound.
- **Inter-Sample Peak Protection:** When configured correctly, it prevents "true peaks" that occur during the reconstruction of analog signals from digital samples.
- **Consistency:** Provides a unified maximum level across an entire project or album.

---

## 3. The "Lookahead" Mechanism
The core innovation of this module is the **Sidechain Lookahead**. 

Traditional dynamics processors are *reactive*; they detect a peak and then begin reducing gain. This results in an "Attack" time where the very beginning of the peak might still escape through (overshoot).

The Sonic Forge Limiter is *proactive*:
1.  **Split:** The input signal is split into two identical paths.
2.  **Delay:** The "Audio Path" is sent through a high-fidelity delay line (typically 5ms).
3.  **Analyze:** The "Detection Path" (Sidechain) is analyzed *immediately* without delay.
4.  **Anticipate:** Because the Detection Path is "ahead" of the Audio Path by 5ms, the processor knows exactly when a peak is coming. 
5.  **Ramp:** It begins smoothly reducing the gain so that by the time the peak exits the delay line and hits the output, the gain is already at the perfect level to keep it under the ceiling.

---

## 4. Parameters and Controls

### 4.1 Threshold (dB)
- **Range:** -60.0 to 0.0 dB
- **Default:** -0.5 dB
- **Function:** Defines the level at which the limiter begins to act. In many professional implementations (including this one), lowering the threshold effectively "drives" the input signal harder. If the threshold is -6dB, the limiter will boost the input by 6dB and then clamp anything that exceeds 0dB.

### 4.2 Ceiling (dB)
- **Range:** -20.0 to 0.0 dB
- **Default:** -0.1 dB
- **Function:** The absolute maximum peak level allowed at the output. For streaming platforms like Spotify or Apple Music, a ceiling of -1.0 dB is often recommended to prevent distortion during lossy encoding (MP3/AAC).

### 4.3 Release (Seconds)
- **Range:** 0.001 to 1.0 s (1ms to 1000ms)
- **Default:** 0.1 s
- **Function:** Determines how quickly the gain returns to 1.0 (unity) after a peak has passed. 
    - **Fast Release:** Maximizes loudness but can cause "pumping" or distortion on low frequencies.
    - **Slow Release:** More transparent and "invisible," but can lead to over-compression if many peaks occur in rapid succession.

### 4.4 Lookahead (ms)
- **Range:** 0.0 to 20.0 ms
- **Default:** 5.0 ms
- **Function:** Sets the length of the internal delay line. More lookahead allows for smoother gain changes but increases the overall latency of the workstation.

---

## 5. Mathematical Foundation

### 5.1 Peak Detection
The limiter uses a simple but effective peak-tracking envelope follower. For every sample $x[n]$, it calculates the absolute value $|x[n]|$ and compares it to the current envelope state $E[n-1]$.

The attack phase is effectively instantaneous (or set to a very small constant like 1ms) because the lookahead provides the necessary buffer.

### 5.2 Gain Calculation
The required gain reduction is derived from the ratio of the Threshold ($T$) to the detected Envelope ($E$):

$$Gain_{raw} = \begin{cases} T / E & \text{if } E > T \\ 1.0 & \text{if } E \leq T \end{cases}$$ 

### 5.3 Makeup and Ceiling
To maintain user-expected behavior, we apply a makeup gain factor based on the Ceiling ($C$):

$$Gain_{final} = Gain_{raw} \times (C / T)$$

---

## 6. DSP Implementation Analysis (`limiter-processor.js`)

The implementation utilizes two classes from the `dsp-helpers.js` library: `DelayLine` and `EnvelopeFollower`.

### 6.1 State Management
The processor maintains a `channelState` array, containing an object for each audio channel (Left/Right).
```javascript
this.channelState.push({
  delay: new DelayLine(0.050, sampleRate), // 50ms max buffer
  env: new EnvelopeFollower()
});
```

### 6.2 The Processing Loop
The loop follows a "Write-Analyze-Read" pattern:
1.  **Write:** The current sample is stored in the delay line.
2.  **Analyze:** The same sample is passed to the envelope follower.
3.  **Calculate:** The gain reduction is calculated based on the *current* envelope.
4.  **Read:** The *delayed* sample is retrieved from the buffer.
5.  **Multiply:** The *current* gain is applied to the *delayed* sample.

### 6.3 Performance Considerations
- **Memory:** The `DelayLine` uses a `Float32Array` to minimize garbage collection and provide fast circular-buffer access.
- **Smoothing:** Parameter changes are smoothed via `setTargetAtTime` in the Node layer to prevent zipper noise.

---

## 7. Trinity Pattern Integration

### 7.1 DSP Layer
The `LimiterProcessor` handles the heavy lifting on the audio thread. It reports the **Max Gain Reduction** back to the main thread every 60 frames (approx. 16ms) for UI metering.

### 7.2 Node Layer (`LimiterNode.ts`)
The node exposes the `setParam` method, which is the only way the UI or Engine interacts with the processor. It strictly enforces parameter types:
```typescript
setParam(paramName: 'threshold' | 'ceiling' | 'release' | 'lookahead', value: number)
```

### 7.3 UI Layer (`LimiterUnit.tsx`)
The React component provides high-precision knobs. It utilizes the `currentGainReduction` property of the Node to drive a gain-reduction meter, giving the user visual confirmation of how much "squashing" is occurring.

---

## 8. Practical Engineering Guide

### 8.1 Setting the Ceiling
Always set your ceiling first. For digital-only releases, -0.1 dB is standard. If you are preparing for a "Loudness War" style master, -0.3 dB provides a safety margin. For streaming, use -1.0 dB.

### 8.2 Using Threshold as "Drive"
Start with the threshold at 0.0 dB. Slowly lower it while listening to the mix. You will notice the overall volume increasing. Monitor the gain reduction meter; 2-3 dB of reduction is usually transparent. 6+ dB will start to change the character of your transients.

### 8.3 Matching the Release to the Tempo
If the song has a fast, rhythmic beat, use a faster release (50-100ms) to ensure the limiter recovers between hits. For slow ballads or ambient textures, a slower release (200-500ms) will sound more natural.

---

## 9. Common Troubleshooting
- **Distortion on Bass:** If the low end sounds "fuzzy," increase the release time. Low-frequency waves are long; a very fast release can attempt to track the wave's shape itself rather than its envelope, creating harmonic distortion.
- **Pumping:** If the whole mix seems to "breathe" or dip in volume unnaturally, you are likely over-limiting. Raise the threshold or slow down the release.
- **High Latency:** If you notice a delay when playing an instrument through Sonic Forge, reduce the **Lookahead** parameter to 0 or 1ms.

---

## 10. Technical Specifications Summary
- **Algorithm:** Lookahead Peak Limiter with Exponential Release.
- **Oversampling:** None (Internal processing at system sample rate).
- **Latency:** Equal to the `lookahead` parameter value.
- **Supported Channels:** Mono, Stereo, and Multi-channel (Dynamic allocation).
- **Standard Compliance:** EBU R128 (when paired with the Loudness Meter module).
