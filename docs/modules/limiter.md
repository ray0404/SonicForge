# Lookahead Limiter

The **Lookahead Limiter** is a mastering-grade dynamics processor designed to prevent audio clipping while maximizing perceived loudness. It ensures that the output signal never exceeds a defined "ceiling" by proactively reducing the gain of incoming peaks.

## Purpose
- **Peak Protection:** Prevents digital clipping (0dBFS) during mastering.
- **Loudness Maximization:** Allows the user to "drive" the signal against a ceiling, increasing the average level (RMS/LUFS).
- **Final Stage Processing:** Typically the last module in an audio signal chain.

## How it Works
The Limiter uses a **Lookahead** mechanism to anticipate peaks before they happen. It splits the signal into two paths:
1.  **Analysis Path (Sidechain):** Monitors the incoming audio in real-time.
2.  **Audio Path (Delayed):** Delays the audio by a few milliseconds (the lookahead time).

When a peak exceeds the **Threshold** in the analysis path, the limiter begins reducing gain *before* that peak reaches the end of the delayed audio path. This allows for an effectively instantaneous attack time, ensuring "zero-overshoot" protection.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Threshold** | -60 to 0 dB | -0.5 dB | The level above which gain reduction is applied. In many limiters, lowering the threshold also increases the input gain. |
| **Ceiling** | -20 to 0 dB | -0.1 dB | The absolute maximum peak level allowed at the output. |
| **Release** | 1ms to 1s | 100ms | How quickly the gain returns to unity after a peak has passed. |
| **Lookahead** | 0 to 20 ms | 5ms | The duration of the audio delay used to anticipate incoming peaks. |

## Implementation Details

### DSP Logic (`limiter-processor.js`)
The processor utilizes an **Envelope Follower** and a **Delay Line** for each channel.

1.  **Envelope Detection:** The sidechain calculates the instantaneous amplitude of the input.
2.  **Gain Calculation:** 
    - If the envelope level ($E$) > Threshold ($T$), the required gain ($G$) is calculated as: $G = T / E$.
    - Otherwise, $G = 1.0$ (unity).
3.  **Makeup / Ceiling Adjustment:** The gain is scaled to match the defined ceiling ($C$): $FinalGain = G * (C / T)$.
4.  **Application:** The $FinalGain$ is applied to the sample currently exiting the **Delay Line**.

### Code Analysis
```javascript
// From limiter-processor.js
const envLevel = state.env.process(sample); // Detect Peak
let limitingGain = (envLevel > thresholdLinear) ? (thresholdLinear / envLevel) : 1.0;

const makeUp = ceilingLinear / thresholdLinear;
const finalGain = limitingGain * makeUp;

const delayedSample = state.delay.read(lookaheadSamples); // Read from delay buffer
outputData[i] = delayedSample * finalGain; // Apply gain early
```

### Trinity Pattern Roles
-   **Processor:** Handles the per-sample buffer management and peak detection. It reports real-time "Gain Reduction" (GR) values back to the UI every 60 frames for metering.
-   **Node:** Maps the `setParam` calls to `AudioParam` automations, ensuring smooth transitions when parameters are adjusted.
-   **Unit:** Displays the Threshold and Ceiling controls and visualizes the amount of gain reduction occurring.
