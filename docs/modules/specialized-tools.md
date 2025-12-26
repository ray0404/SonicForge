# Specialized Mastering & Analysis Tools

This document details the specialized processors in Sonic Forge used for multiband dynamics, corrective processing, stereo imaging, and technical analysis.

---

# 3-Band Multiband Compressor

The **Multiband Compressor** is a powerful dynamics processor that splits the audio into three independent frequency bands (Low, Mid, High) and applies compression to each separately.

## Purpose
- **Frequency-Specific Dynamics:** Controlling the boominess of a bass without affecting the clarity of the mid-range.
- **Tonal Balancing:** Acting as a "dynamic EQ" to smooth out tonal imbalances that only occur at high volumes.
- **Mastering Glue:** Adding consistency across the entire frequency spectrum.

## How it Works
1.  **Crossover Network:** Uses two cascaded Linkwitz-Riley 4th Order filters to split the signal into three bands. LR4 filters are used because they sum perfectly back to unity gain with no phase cancellation.
2.  **Independent Compression:** Each band has its own VCA-style compressor with dedicated Threshold, Ratio, Attack, and Release controls.
3.  **Summation:** The processed bands are mixed back together to form the final stereo signal.

## Band Parameters (x3 Bands)

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Threshold** | -60 to 0 dB | -24 dB | Level where compression starts for this band. |
| **Ratio** | 1:1 to 20:1 | 4:1 | Intensity of compression. |
| **Attack** | 0.1ms to 1s | 10ms | Response speed to peaks. |
| **Release** | 1ms to 2s | 100ms | Recovery speed after peaks. |
| **Make-up** | 0 to 24 dB | 0 dB | Gain adjustment for the band. |

---

# Mastering De-Esser

The **DeEsser** is a specialized compressor designed specifically to reduce sibilance (harsh "s," "sh," or "ch" sounds) in vocals or high-frequency harshness in a full mix.

## Purpose
- **Sibilance Control:** Taming piercing high frequencies in the 4kHz to 8kHz range.
- **Harshness Reduction:** Smoothing out "brittle" sounding recordings.

## How it Works
1.  **Sidechain Filtering:** The detection path is passed through a sharp band-pass filter centered on the harsh frequency.
2.  **Detection:** An envelope follower monitors only the amplitude of the harsh frequency range.
3.  **Broadband Compression:** When sibilance is detected, the gain of the entire signal (or just the high frequencies, depending on mode) is reduced.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Frequency** | 2k to 10k Hz | 6000 Hz | The target "sibilance" frequency. |
| **Threshold** | -60 to 0 dB | -20 dB | Sensitivity of the de-esser. |
| **Monitor** | Toggle | Off | Allows the user to hear only the frequencies being detected. |

---

# Multi-Band Stereo Imager

The **Stereo Imager** allows for frequency-dependent control over the width of the stereo field.

## Purpose
- **Mono Bass:** Ensuring low frequencies (below 150Hz) are 100% mono for punch and phase compatibility.
- **High-End Width:** Adding "sparkle" and "air" by widening the high frequencies.
- **Space Creation:** Carving out or emphasizing space in the mid-range.

## How it Works
1.  **Crossover:** Splits the signal into Low, Mid, and High bands.
2.  **M/S Processing:** For each band, the signal is converted to Mid/Side. The "Side" component is scaled by the **Width** parameter.
    - Width = 0: 100% Mono.
    - Width = 1: Original stereo width.
    - Width = 2: Super-stereo (Side component doubled).
3.  **Reconstruction:** Decodes back to L/R and sums the bands.

---

# Cab Sim / IR Loader (Convolution)

The **Cab Sim** uses **Convolution** to replicate the sonic characteristics of guitar cabinets, acoustic spaces, or vintage hardware.

## Purpose
- **Speaker Emulation:** Applying the frequency and phase response of a real guitar speaker.
- **Reverb:** Loading Impulse Responses (IRs) of real rooms.
- **Tone Shaping:** Using "surgical" IRs to match the tone of a reference recording.

## How it Works
The module uses a Mathematical **Convolution** algorithm to "multiply" the incoming audio by an Impulse Response (a recording of a short spark or pop in a space). This effectively imposes the space's character onto the audio.

---

# EBU R128 LUFS Meter

The **LUFS Meter** provides technical loudness measurements according to the ITU-R BS.1770-4 and EBU R128 standards.

## Purpose
- **Loudness Standards:** Ensuring a master meets the target loudness for streaming platforms (e.g., -14 LUFS for Spotify).
- **Dynamic Range Monitoring:** Visualizing the difference between peak and average levels.

## Measurements
1.  **Momentary (M):** Measured over a 400ms sliding window. Captures immediate loudness spikes.
2.  **Short-term (S):** Measured over a 3-second sliding window. Useful for checking the loudness of specific sections (verses/choruses).
3.  **K-Weighting:** Applies a specialized EQ curve that mimics human hearing (boosting highs and cutting extreme lows) before measuring energy.
