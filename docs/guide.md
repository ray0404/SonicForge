# Sonic Forge: User Manual

## 1. Welcome
**Sonic Forge** is a high-performance, local-first Digital Audio Workstation (DAW) tailored for mastering and audio processing. It combines the fidelity of professional DSP with the convenience of a web application.

Because it runs entirely in your browser (using WebAssembly and AudioWorklets), your audio never leaves your device. This ensures zero latency, absolute privacy, and offline capability.

---

## 2. Getting Started

### 2.1 The Interface
The interface is divided into three main sections:
1.  **The Transport Bar (Top):** Contains global controls (Play/Pause, Stop, Loop), the Master Clock (Time/Beats), and the Master Volume.
2.  **The Rack (Center):** This is your workspace. It holds the chain of effects modules you add to your project. Signal flows from Top to Bottom.
3.  **The Visualizer (Bottom/Overlay):** Provides real-time analysis of your signal, including a Spectrum Analyzer, Goniometer (Stereo Field), and LUFS Meter.

### 2.2 Loading Audio
To begin, you need a source file.
- **Drag & Drop:** Simply drag a WAV, MP3, or FLAC file anywhere onto the window.
- **Load Button:** Click the "Load Audio" button in the Transport Bar to open a file picker.

*Note: Large files are decoded in memory. On mobile devices with limited RAM, try to keep files under 10 minutes in length.*

---

## 3. Working with Modules

### 3.1 Adding Effects
Click the **"+" (Add Module)** button at the bottom of the rack. A menu will appear with available processors categorized by type (Dynamics, EQ, Modulation, etc.).
- *Tip: Start with a "Parametric EQ" to shape the tone, followed by a "Compressor" to control dynamics.*

### 3.2 Adjusting Parameters
- **Knobs:** Click and drag vertically (up to increase, down to decrease). Hold `Shift` while dragging for fine-tuned precision. Double-click a knob to reset it to its default value.
- **Toggles:** Click once to switch On/Off.
- **Bypass:** The power icon in the top-right of every module bypasses that specific effect, allowing you to A/B compare the processed and unprocessed sound.

### 3.3 Reordering the Chain
The order of effects matters! (e.g., Distortion *before* Reverb sounds very different from Reverb *before* Distortion).
- Use the **Up/Down Arrows** in the module header to move an effect earlier or later in the signal chain.
- The audio engine effectively rewires the connections instantly without dropouts.

---

## 4. Saving and Exporting

### 4.1 Saving Projects (.sfg)
Click the **Save** icon to download a `.sfg` (Sonic Forge) project file. This file contains:
- The exact arrangement of your rack.
- Every parameter setting.
- *Note: Currently, the source audio file itself is NOT embedded. You must reload the same audio file when you open the project.*

### 4.2 Exporting Audio (WAV)
When your master is ready:
1.  Click the **Export / Bounce** button.
2.  The engine will perform an "Offline Render." This processes the audio as fast as your CPU allows (often 20x faster than real-time).
3.  A high-quality 32-bit Float WAV file will be downloaded to your device.

---

## 5. Developer Guide (For Contributors)

### 5.1 Environment Setup
Sonic Forge is a standard Vite/React project.
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 5.2 Key Technologies
- **Vite:** Build tool and dev server.
- **React 18:** UI Framework.
- **TypeScript:** Type safety.
- **Standardized Audio Context:** Cross-browser Web Audio wrapper.
- **Zustand:** State management.
- **Tailwind CSS:** Styling.

### 5.3 Adding a New Module
Follow the **Trinity Pattern** (see `docs/trinity-pattern.md`). You must create:
1.  **Processor:** `src/audio/worklets/[name]-processor.js` (The Math).
2.  **Node:** `src/audio/worklets/[Name]Node.ts` (The Bridge).
3.  **Unit:** `src/components/rack/[Name]Unit.tsx` (The UI).

Then register the module in `useAudioStore.ts` and `EffectsRack.tsx`.

### 5.4 Testing
Run the comprehensive test suite to ensure DSP logic integrity.
```bash
npm test
```
See `src/audio/worklets/lib/dsp-helpers.test.js` for examples of how to unit test signal processing code.