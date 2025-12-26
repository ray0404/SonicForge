# Core Mixing & Creative Effects

This document details the core mixing and creative processors in Sonic Forge, including Parametric EQ, Distortion, Bitcrusher, and AutoWah.

---

# 3-Band Parametric EQ

The **Parametric EQ** is a standard mixing tool used to adjust the tonal balance of a track across three critical frequency ranges.

## Purpose
- **Corrective EQ:** Removing unwanted resonance or "mud."
- **Tonal Shaping:** Adding brightness to a vocal or punch to a kick drum.
- **Filtering:** Using the shelving bands to gently slope off extreme highs or lows.

## How it Works
The module cascades three independent biquad filters in series:
1.  **Low Band:** A Low-Shelf filter for controlling the bass foundation.
2.  **Mid Band:** A Peaking filter with adjustable Q (bandwidth) for precise frequency control.
3.  **High Band:** A High-Shelf filter for adding "air" or controlling harshness.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Low Freq** | 20 to 1k Hz | 100 Hz | The shelf corner frequency for the low band. |
| **Low Gain** | -24 to +24 dB | 0 dB | Boost or cut for the low shelf. |
| **Mid Freq** | 200 to 5k Hz | 1000 Hz | The center frequency for the mid peaking band. |
| **Mid Gain** | -24 to +24 dB | 0 dB | Boost or cut for the mid band. |
| **Mid Q** | 0.1 to 10 | 0.707 | The width of the mid band. Higher = Narrower. |
| **High Freq** | 2k to 20k Hz | 5000 Hz | The shelf corner frequency for the high band. |
| **High Gain** | -24 to +24 dB | 0 dB | Boost or cut for the high shelf. |

---

# Soft-Clip Distortion

The **Distortion** module adds harmonic content and aggressive character by "shaping" the audio peaks using non-linear mathematical functions. It features **2x Oversampling** to minimize aliasing artifacts.

## Purpose
- **Saturating:** Adding subtle grit to drums or bass.
- **Aggressive Clipping:** Squashing peaks for an industrial or "lo-fi" sound.
- **Harmonic Excitement:** Using the Cubic or Tanh modes to add richness to sterile digital signals.

## Shaper Types
1.  **Tanh (Soft):** Smooth, musical clipping that rounds off peaks gently.
2.  **Atan (Hard):** More aggressive clipping with a faster transition into saturation.
3.  **Cubic:** A classic soft-clipping function ($x - x^3/3$) that produces strong odd-order harmonics.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Drive** | 1 to 100 | 1 | The amount of input gain driven into the shaper. |
| **Type** | Tanh/Atan/Cubic| Tanh | The mathematical function used for the distortion. |
| **Output Gain**| -24 to +24 dB | 0 dB | Compensate for volume changes caused by drive. |
| **Wet** | 0 to 100% | 100% | Dry/Wet blend. |

---

# Bitcrusher

The **Bitcrusher** is a digital-only effect that degrades audio quality by reducing the bit-depth and sample rate, creating "crushed," lo-fi textures.

## Purpose
- **Digital Grit:** Emulating the sound of vintage 8-bit or 12-bit samplers.
- **Texture:** Adding unique digital artifacts and "aliasing" noise to modern sounds.
- **Rhythmic Stuttering:** Using low sample rate settings for a "robotic" feel.

## How it Works
1.  **Bit-Depth Reduction (Quantization):** Reduces the number of levels available to represent the signal amplitude, creating quantization noise.
2.  **Sample Rate Reduction (Downsampling):** Uses a "sample and hold" mechanism to keep the signal at a specific value for multiple samples, creating aliasing distortion.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Bits** | 1 to 16 | 8 | The target bit-depth. Lower = More noise/grit. |
| **Norm Freq** | 0.001 to 1.0 | 1.0 | Normalized target sample rate. 0.1 means the sample is held for 10 cycles. |
| **Mix** | 0 to 100% | 100% | Dry/Wet blend. |

---

# AutoWah

The **AutoWah** (Envelope Filter) is a rhythmic filter effect where the cutoff frequency of a band-pass filter is modulated by the amplitude of the incoming signal.

## Purpose
- **Funk/Rhythmic Textures:** Creating the classic "quack" sound commonly heard on funk guitars.
- **Dynamic Movement:** Adding life to synth pads or bass lines that reacts to the player's intensity.

## How it Works
1.  **Envelope Detection:** An envelope follower tracks the volume of the input signal.
2.  **Frequency Mapping:** The detected volume is mapped to a frequency range: $Cutoff = Base * 2^{(Env * Sens * Octaves)}$.
3.  **Band-Pass Filtering:** The signal is passed through a band-pass filter that "sweeps" up and down as the volume changes.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Base Freq** | 20 to 5k Hz | 100 Hz | The starting frequency of the filter when silent. |
| **Sensitivity**| 0 to 10 | 0.5 | How much the volume affects the filter sweep. |
| **Octaves** | 0 to 8 | 4 | The maximum range of the sweep. |
| **Q** | 0.1 to 20 | 2.0 | The resonance of the filter. Higher = Sharper "quack." |
| **Attack** | 1ms to 1s | 10ms | Speed of the upward sweep. |
| **Release** | 1ms to 1s | 100ms | Speed of the downward sweep. |
