# Sonic Forge 

![Status](https://img.shields.io/badge/status-production_ready-green)
![Tech](https://img.shields.io/badge/stack-React_Vite_Worklet-blue)

**Sonic Forge** is a high-performance, local-first web audio template designed for building professional-grade audio tools. It features a modular "Rack" architecture, a shared DSP library, asset management, and offline rendering, making it the perfect starting point for DAWs, Mastering Suites, and Audio Effect plugins.

## 🚀 Features

*   **Modular Effects Rack:** High-performance architecture with **diff-based graph patching**, ensuring glitch-free module reordering and hot-swapping.
*   **Audio Worklet Engine:** All signal processing runs on a dedicated high-priority audio thread, leveraged via `standardized-audio-context` for cross-browser stability.
*   **Asset Management:** Drag-and-drop support for audio files (WAV/MP3) and Impulse Responses (IRs), persisted locally via `IndexedDB`.
*   **Transport & Playback:** Accessible controls with ARIA support, load reference tracks, seek, and play/pause.
*   **Analysis Suite:**
    *   **Spectrum Analyzer:** Logarithmic frequency visualization (20Hz - 20kHz).
    *   **Goniometer:** Real-time stereo field visualization (Lissajous figure) via dedicated L/R analysers.
    *   **Loudness Meter:** EBU R128 compliant LUFS metering (Momentary & Short-term).
*   **Included Modules:**
    *   **Compressor:** VCA, FET, Opto, and VarMu topologies with **Sidechain Routing**.
    *   **Multiband Dynamics:** 3-band independent compression with crossover control.
    *   **De-Esser:** Frequency-selective sidechain compression for sibilance control.
    *   **Multiband Stereo Imager:** Independent width control for Low, Mid, and High bands.
    *   **Dynamic EQ:** 5-band equalizer with sidechain-driven gain reduction.
    *   **Lookahead Limiter:** Mastering-grade limiter with lookahead.
    *   **Transient Shaper:** Attack/Sustain envelope shaping.
    *   **Mid/Side EQ:** Independent processing for Mid and Side channels.
    *   **Cab Sim / IR Loader:** Convolution engine for Impulse Responses.
    *   **Analog Saturation:** Harmonic distortion and warmth.
    *   **TPDF Dithering:** High-quality bit-depth reduction.
*   **Advanced Routing:** Support for **External Sidechaining**, allowing modules to use arbitrary signals from the rack for detection.
*   **Offline Export:** Render your processed track to a high-quality WAV file directly in the browser.
*   **Local-First & Offline:** Sessions and assets are saved automatically. Works without an internet connection (PWA).

## 🛠️ Architecture

Sonic Forge enforces a strict separation of concerns, often referred to as **"The Trinity Pattern"**:

1.  **DSP Layer (`src/audio/worklets/`):** 
    *   The "Brain". Pure JavaScript processing logic that runs on the Audio Thread. 
2.  **Node Layer (`src/audio/worklets/`):** 
    *   The "Bridge". TypeScript classes extending `AudioWorkletNode`. 
    *   Manages parameter mapping using `standardized-audio-context` interfaces.
3.  **UI Layer (`src/components/`):** 
    *   The "Face". React components for visualization and control.
    *   Interacts with the `AudioEngine` via public methods (e.g., `getModuleNode`) and `Zustand` store.

**Supporting Infrastructure:**
*   **Audio Engine (`src/audio/context.ts`):** Singleton managing the audio graph, intelligent patching, and offline rendering.
*   **Application State (`src/store/`):** `Zustand` store managing rack configuration, assets, and playback state.

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sonic-forge.git
cd sonic-forge

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

### Testing

```bash
# Run the test suite (Unit + Integration + UI)
npm run test
```

### Building for Production

```bash
# Compile TypeScript and bundle with Vite
npm run build
```

## 🧩 Adding New Effects

Sonic Forge is designed to be extensible. To add a new effect, follow the **Trinity Pattern**:

1.  **DSP:** Write your processor in `src/audio/worklets/my-effect-processor.js`.
2.  **Node:** Create a `MyEffectNode.ts` wrapper.
3.  **Register:** 
    *   Add to `AudioEngine.createModuleNode()` and `updateModuleParam()`.
    *   Register in `AudioEngine.renderOffline()` for export support.
    *   Define default parameters in `useAudioStore.ts`.
4.  **UI:** Create a component in `src/components/rack/` and add it to `EffectsRack.tsx`.

## 📄 License

MIT