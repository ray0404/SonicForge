# Dynamic EQ

The **Dynamic EQ** is a hybrid processor that combines the precision of a parametric equalizer with the response of a compressor. Unlike a static EQ, which applies a fixed gain to a frequency band, a Dynamic EQ adjusts the gain of the band in real-time based on the amplitude of the signal within that frequency range.

## Purpose
- **Corrective Balancing:** Taming harsh frequencies that only become problematic at high volumes (e.g., "ess" sounds or resonance in a vocal).
- **Frequency-Specific Compression:** Compressing only the "boomy" part of a bass guitar without affecting the higher harmonics.
- **Sidechain Ducking:** Using one signal to carve out space in another (e.g., ducking the bass frequency of a synth when the kick drum hits).

## How it Works
The Dynamic EQ splits the internal processing into two paths for every band:
1.  **Detection Path (Sidechain):** The signal is passed through a band-pass filter (matching the target frequency and Q). An envelope follower then detects the amplitude of this filtered signal.
2.  **Processing Path (Peaking Filter):** A standard peaking EQ filter is applied to the audio. Its gain is modulated by the output of the detection path.

If the detected amplitude exceeds the **Threshold**, the filter gain is reduced (or increased, depending on the implementation) according to the **Ratio**.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Frequency** | 20 to 20k Hz | 1000 Hz | The center frequency of the band. |
| **Q** | 0.1 to 100 | 1.0 | The bandwidth of the filter. Higher values create narrower bands. |
| **Static Gain** | -40 to 40 dB | 0 dB | The base gain applied when the signal is below the threshold. |
| **Threshold** | -100 to 0 dB | -20 dB | The level in the detection path above which dynamic processing begins. |
| **Ratio** | 1 to 20 | 2 | Determines the intensity of the dynamic gain change. |
| **Attack** | 1ms to 1s | 10ms | How quickly the EQ reacts to signal exceeding the threshold. |
| **Release** | 1ms to 1s | 100ms | How quickly the EQ returns to its static gain after the signal falls below the threshold. |

## Implementation Details

### DSP Logic (`dynamic-eq-processor.js`)
The processor manages three main components per channel:
- `scFilter`: A `BiquadFilter` configured as a 'bandpass' for sidechain detection.
- `mainFilter`: A `BiquadFilter` configured as 'peaking' for the audio path.
- `envFollower`: An `EnvelopeFollower` to track the detection signal levels.

1.  **Filtering:** The input sample is processed by the `scFilter`.
2.  **Detection:** The absolute amplitude of the filtered sample is tracked by the `envFollower`.
3.  **dB Conversion:** The envelope level is converted to decibels: $Env_{dB} = 20 * \log_{10}(Level + \epsilon)$.
4.  **Gain Reduction:** If $Env_{dB} > Threshold$, we calculate: $GR = (Env_{dB} - Threshold) * (1 - 1/Ratio)$.
5.  **Dynamic Modulation:** $CurrentGain = StaticGain - GR$.
6.  **Application:** The `mainFilter.setGain(CurrentGain)` is updated, and the sample is processed.

### Code Analysis
```javascript
// Sidechain detection
const scSample = state.scFilter.process(sample);
const envLevel = state.envFollower.process(scSample);
const envDb = 20 * Math.log10(envLevel + 1e-6);

// Gain modulation
let gainReduction = 0;
if (envDb > thresh) {
     gainReduction = (envDb - thresh) * (1 - 1/ratio);
}
const dynamicGain = staticGain - gainReduction;

// Final process
state.mainFilter.setGain(dynamicGain);
outputData[i] = state.mainFilter.process(sample);
```

### Trinity Pattern Roles
-   **Processor:** Updates filter coefficients sample-by-sample (or block-by-sample for efficiency) based on the envelope.
-   **Node:** Provides a `setParam` interface that supports both immediate changes and smoothed transitions using `setTargetAtTime`.
-   **Unit:** Visualizes the dynamic movement of the gain, allowing the user to see the "ducking" in real-time.
