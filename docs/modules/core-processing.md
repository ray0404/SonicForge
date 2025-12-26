# Transient Shaper

The **Transient Shaper** is a dynamics processor that allows for independent control over the "Attack" (initial hit) and "Sustain" (tail) parts of a sound. Unlike a compressor, which is level-dependent, a transient shaper is level-independent, reacting only to the speed of gain changes.

## Purpose
- **Drum Shaping:** Adding "snap" to a kick drum or reducing the "ring" of a snare.
- **Articulation:** Emphasizing the pick attack of a guitar or the hammer strike of a piano.
- **Room Control:** Shortening the sustain of a track to reduce excessive room reverb without using a gate.

## How it Works
The processor uses two parallel envelope followers with different time constants:
1.  **Fast Envelope:** Follows the signal very closely (10ms).
2.  **Slow Envelope:** Follows the signal more loosely (100ms).

The difference between these two envelopes ($\Delta = Fast - Slow$) identifies the transients. A positive $\Delta$ indicates the signal is rising (Attack phase), while a negative $\Delta$ indicates it is falling (Sustain phase).

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Attack Gain** | -24 to +24 dB | 0 dB | Boosts or cuts the detected initial transients. |
| **Sustain Gain**| -24 to +24 dB | 0 dB | Boosts or cuts the tail of the signal. |
| **Mix** | 0 to 100% | 100% | Dry/Wet blend. |

## Implementation Details

### DSP Logic (`transient-processor.js`)
1.  **Delta Calculation:** $\Delta = Env_{fast} - Env_{slow}$.
2.  **Gain Mapping:** 
    - If $\Delta > 0$: $Gain_{dB} = \Delta * AttackGain * 2.0$.
    - If $\Delta < 0$: $Gain_{dB} = |\Delta| * SustainGain * 2.0$.
3.  **Application:** The resulting gain is converted to a linear factor and applied to the input sample.

---

# Mid/Side EQ

The **Mid/Side EQ** is a specialized equalizer that allows for independent tonal control over the center (Mid) and the edges (Side) of a stereo image.

## Purpose
- **Mono Compatibility:** Boosting the bass in the "Mid" channel to ensure it stays centered and mono-compatible.
- **Stereo Width:** Boosting high frequencies in the "Side" channel to add "air" and perceived width to a mix.
- **Clarity:** Cutting mud from the "Side" channel while leaving the "Mid" channel (vocals/leads) intact.

## How it Works
The signal is converted from standard Left/Right (L/R) stereo into Mid/Side (M/S) representation using the following matrix:
- **Mid** = $(Left + Right) * 0.5$ (The sum/mono part).
- **Side** = $(Left - Right) * 0.5$ (The difference/stereo part).

Independent peaking filters are applied to each channel, and the signal is then decoded back to L/R.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Mid Gain** | -15 to +15 dB | 0 dB | Gain for the center-channel peaking filter. |
| **Mid Freq** | 20 to 20k Hz | 1000 Hz | Center frequency for the Mid filter. |
| **Side Gain** | -15 to +15 dB | 0 dB | Gain for the edge-channel peaking filter. |
| **Side Freq** | 20 to 20k Hz | 1000 Hz | Center frequency for the Side filter. |

---

# Analog Saturation

The **Analog Saturation** module emulates the non-linear harmonic distortion characteristic of analog hardware such as tape machines, vacuum tubes, and vintage consoles.

## Purpose
- **Harmonic Excitement:** Adding "warmth" and "thickness" to digital signals.
- **Soft Clipping:** Taming harsh peaks in a more musical way than a digital limiter.
- **Glue:** Helping tracks sit together by adding subtle, consistent distortion.

## Emulation Types
1.  **Tape:** Soft, subtle saturation with a focus on odd-order harmonics.
2.  **Tube:** Warmer, asymmetric distortion with significant even-order harmonics.
3.  **Fuzz:** Aggressive, hard-clipping distortion.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Drive** | 0 to 10 | 0 | The amount of input gain driven into the saturator. |
| **Type** | Tape/Tube/Fuzz| Tube | The algorithm used for the non-linear transfer function. |
| **Output Gain**| -12 to +12 dB | 0 dB | Post-distortion volume adjustment. |
| **Mix** | 0 to 100% | 100% | Parallel processing blend. |

---

# TPDF Dithering

**TPDF (Triangular Probability Density Function) Dithering** is a technical process used when reducing the bit-depth of an audio signal (e.g., from 32-bit float to 16-bit) to prevent quantization distortion.

## Purpose
- **Quantization Error Masking:** Replaces harsh, correlated digital distortion with a low-level, uncorrelated white noise floor.
- **Preserving Detail:** Allows for the perception of signals below the theoretical noise floor of the target bit-depth.

## How it Works
When a signal is rounded to a lower bit-depth, the "error" (the difference between the original and rounded value) is usually correlated to the signal, causing audible distortion. Dithering adds a small amount of random noise *before* rounding, which breaks this correlation. 

TPDF dither specifically uses noise with a triangular distribution, which is mathematically optimal for eliminating distortion and noise-modulation.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Bit Depth** | 8 to 32 bits | 24 bits | The target bit-depth for the output. 32-bit effectively bypasses the dithering. |
