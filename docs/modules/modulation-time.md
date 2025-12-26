# Modulation & Time-Based Effects

This document details the modulation and time-based processors in Sonic Forge, including Chorus, Phaser, Tremolo, and Feedback Delay.

---

# Multi-Voice Chorus

The **Chorus** module creates a thicker, richer sound by simulating multiple sound sources playing the same part with slight variations in pitch and timing.

## Purpose
- **Stereo Widening:** Turning a mono sound into a wide stereo field.
- **Ensemble Effect:** Making a single vocal or instrument sound like a group.
- **Lush Textures:** Adding movement and "shimmer" to synths and guitars.

## How it Works
The processor uses a short **Delay Line** modulated by a Low-Frequency Oscillator (**LFO**). By varying the delay time, the signal's pitch is slightly shifted (the Doppler effect). Mixing this modulated signal with the original dry signal creates the classic chorus sound.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **LFO Rate** | 0.1 to 10 Hz | 1.5 Hz | The speed of the pitch modulation. |
| **Delay Time** | 0 to 100 ms | 30 ms | The base delay between the dry and wet signals. |
| **Depth** | 0 to 10 ms | 2 ms | The width of the delay modulation. |
| **Feedback** | 0 to 95% | 0% | Feed the output back into the input for a more "flanger-like" sound. |
| **Wet** | 0 to 100% | 50% | Dry/Wet blend. |

---

# Multi-Stage Phaser

The **Phaser** (Phase Shifter) creates sweeping, "whooshing" filter effects by passing the signal through a series of all-pass filters.

## Purpose
- **Movement:** Adding rhythmic or slow-sweeping movement to static sounds.
- **Vocal-like Textures:** Creating "formant-like" filtering through complex phase cancellations.

## How it Works
A series of **All-Pass Filters** shift the phase of the signal differently across the frequency spectrum. When the phase-shifted signal is mixed with the dry signal, certain frequencies cancel each other out, creating "notches." The LFO sweeps the center frequency of these filters, moving the notches up and down the spectrum.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Stages** | 2 to 8 | 4 | Number of all-pass stages. More stages create more notches. |
| **LFO Rate** | 0.1 to 10 Hz | 0.5 Hz | Speed of the frequency sweep. |
| **Center Freq** | 50 to 5k Hz | 1000 Hz | The midpoint of the sweep range. |
| **Range** | 0 to 5 Octaves| 2 Octaves | How wide the frequency sweep is. |

---

# Stereo Tremolo

The **Tremolo** module provides rhythmic volume modulation, varying the amplitude of the signal over time.

## Purpose
- **Vintage Character:** Emulating the volume-pulsing circuits of classic guitar amplifiers.
- **Rhythmic Pulsing:** Creating "stutter" or "throbbing" effects.
- **Stereo Movement:** Using the "Spread" parameter to alternate volume between Left and Right channels.

## How it Works
A Low-Frequency Oscillator (**LFO**) directly modulates the gain of the signal. The "Spread" parameter offsets the LFO phase for the Right channel, allowing for "Ping-Pong" tremolo where the sound bounces between speakers.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Frequency** | 0.1 to 20 Hz | 4 Hz | The speed of the volume pulse. |
| **Depth** | 0 to 100% | 50% | The intensity of the volume reduction. |
| **Spread** | 0 to 100% | 0% | Phase offset between Left and Right channels. |

---

# Feedback Delay

The **Feedback Delay** is a classic echo effect that repeats the incoming signal at a specific interval.

## Purpose
- **Space & Depth:** Adding depth to a mix without the density of a reverb.
- **Rhythmic Echoes:** Creating repeats that sync with the tempo of a song.
- **Special Effects:** Using high feedback for self-oscillating, experimental textures.

## How it Works
The signal is written into a **Delay Line** and read back after a set time. A portion of the delayed signal is fed back into the input, creating a series of repeats that gradually decay in volume.

## Parameters

| Parameter | Range | Default | Description |
| :--- | :--- | :--- | :--- |
| **Delay Time** | 0 to 2 seconds | 0.5 s | The time between repeats. |
| **Feedback** | 0 to 95% | 30% | The number of audible repeats. |
| **Wet** | 0 to 100% | 50% | Dry/Wet blend. |
