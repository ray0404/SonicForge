# Cab Sim / IR Loader (Convolution): Technical Reference

## 1. Introduction
The **Convolution Node** (often labeled as Cab Sim in the UI) is a processor that captures the acoustic "fingerprint" of a linear system—such as a guitar speaker cabinet, a concert hall, or a vintage EQ—and imposes that character onto any audio signal passed through it.

It works by loading an **Impulse Response (IR)**, which is a recording of how the system responds to a single, infinitely short spike of energy.

---

## 2. Fundamental Purpose and Use Cases
Convolution provides the most realistic simulation of physical spaces and speakers.

### Use Cases:
- **Guitar Cab Simulation:** Placing a raw "amp head" signal into a virtual 4x12 cabinet. Without this, distortion sounds harsh, fizzy, and unnatural.
- **Reverb:** Loading an IR of a cathedral, bathroom, or plate reverb unit.
- **Hardware EQ Matching:** Loading an IR that captures the frequency curve of a rare console channel strip.

---

## 3. How it Works: The Math of Convolution
Mathematically, convolution is the integration of two signals: the Input $x(t)$ and the Impulse Response $h(t)$.
$$(x * h)[n] = \sum_{m=-\infty}^{\infty} x[m] \cdot h[n-m]$$

In simpler terms: Every single sample of the input triggers the *entire* Impulse Response to play back. The output is the sum of all these overlapping IRs.

If the IR is a 1-second reverb tail (44,100 samples), the processor must perform 44,100 multiplications and additions *for every single input sample*. This is incredibly CPU intensive.

---

## 4. Parameters and Controls

### 4.1 Impulse Response (File)
- **Format:** WAV / AIFF (loaded via Buffer).
- **Function:** The "preset" that defines the sound. Changing the file changes the effect entirely (e.g., from "Small Room" to "Marshall 1960A").

### 4.2 Mix (%)
- **Range:** 0 to 100%.
- **Default:** 100% (for Cab Sims).
- **Function:**
    - **Cab Sim:** Usually 100% Wet (you don't want to hear the fizzy direct signal).
    - **Reverb:** Mixed to taste (e.g., 20% Wet).

---

## 5. DSP Implementation Analysis (`ConvolutionNode.ts`)

### 5.1 Native Web Audio Implementation
Unlike the other processors in Sonic Forge which are custom `AudioWorkletProcessors`, convolution is so computationally heavy that doing it in JavaScript is inefficient. Sonic Forge leverages the browser's native **`ConvolverNode`**.
- This native node uses highly optimized C++ code and FFT-based (Fast Fourier Transform) convolution algorithms (like Overlap-Add) to perform the math in the frequency domain, which is orders of magnitude faster than the time-domain summation described above.

### 5.2 Node Wrapper
The `ConvolutionNode` class wraps the native `ConvolverNode` to provide a consistent interface (Trinity Pattern) and adds input/output Gain nodes for Wet/Dry routing, which the native node lacks.

```typescript
// Input -> Convolver -> WetNode -> Output
this.input.connect(this.convolver);
this.convolver.connect(this.wetNode);
this.wetNode.connect(this.output);
```

---

## 6. Trinity Pattern Integration

### 6.1 DSP Layer
Handled by the browser (Native).

### 6.2 Node Layer
Provides `setBuffer()` to load the IR data and `setMix()` to handle routing.

### 6.3 UI Layer (`CabSimUnit.tsx`)
The UI needs a file picker or a dropdown menu of factory IRs. It is responsible for fetching the WAV file, decoding it into an `AudioBuffer`, and passing it to the Node.

---

## 7. Practical Engineering Guide

### 7.1 "Reamping" a Synth
1.  Take a boring saw-wave synth lead.
2.  Load a Guitar Cabinet IR (e.g., "Vintage 30 4x12").
3.  The IR acts as a complex Low-Pass filter with multiple resonant peaks, making the synth sound organic and "air-pushed."

### 7.2 Creating Depth
1.  Load a "Room" IR (0.5s).
2.  Set Mix to 15%.
3.  This places the dry signal in a realistic space without washing it out.

---

## 8. Common Troubleshooting
- **Latency:** Convolution can introduce latency depending on the browser's implementation and buffer size.
- **Normalization:** Some IRs are very quiet; others are normalized to 0dB. The volume might jump drastically when switching IRs. The system should ideally auto-normalize IRs upon loading.
- **Stereo Width:** Loading a Mono IR into a Stereo Convolver usually results in a Mono output (collapsing the stereo image). Ensure you use Stereo IRs for stereo sources.

---

## 9. Technical Specifications Summary
- **Algorithm:** FFT-based Partitioned Convolution (Native).
- **Latency:** Implementation dependent (usually one block).
- **Supported Formats:** Any AudioBuffer (WAV, MP3, etc. decoded by browser).
