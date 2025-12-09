# Sonic Forge 

![Status](https://img.shields.io/badge/status-production_ready-green)
![Tech](https://img.shields.io/badge/stack-React_Vite_Worklet-blue)

**Sonic Forge** is a high-performance, local-first web audio template designed for building professional-grade audio tools. It features a modular "Rack" architecture, a shared DSP library, asset management, and offline rendering, making it the perfect starting point for DAWs, Mastering Suites, and Audio Effect plugins.

## 🚀 Features

*   **Modular Effects Rack:** Drag-and-drop style architecture (under the hood) supporting arbitrary chains of effects.
*   **Audio Worklet Engine:** All signal processing runs on a dedicated high-priority audio thread, ensuring glitch-free playback.
*   **Asset Management:** Drag-and-drop support for audio files (WAV/MP3), persisted locally via `IndexedDB`.
*   **Transport & Playback:** Load reference tracks, seek, play/pause, and visualize playback progress.
*   **Analysis Suite:**
    *   **Spectrum Analyzer:** Logarithmic frequency visualization (20Hz - 20kHz).
    *   **Goniometer:** (Placeholder) Stereo field visualization.
    *   **Loudness Meter:** EBU R128 compliant LUFS metering (Momentary & Short-term).
*   **Included Modules:**
    *   **Dynamic EQ:** 5-band equalizer with sidechain compression.
    *   **Transient Shaper:** Attack/Sustain envelope shaping.
    *   **Lookahead Limiter:** Mastering-grade limiter with lookahead.
    *   **Mid/Side EQ:** Independent processing for Mid and Side channels.
    *   **Cab Sim / IR Loader:** Convolution engine for Impulse Responses.
*   **Offline Export:** Render your processed track to a high-quality WAV file directly in the browser.
*   **Local-First & Offline:** Sessions and assets are saved automatically. Works without an internet connection (PWA).

## 🛠️ Architecture

Sonic Forge enforces a strict separation of concerns:

1.  **DSP Layer (`src/audio/worklets/`):** Pure JavaScript processing logic.
2.  **Audio Engine (`src/audio/context.ts`):** Singleton managing the `AudioContext` (realtime) and `OfflineAudioContext` (export).
3.  **Application State (`src/store/`):** Zustand store managing rack configuration, assets, and playback state.
4.  **UI Layer (`src/components/`):** React components for visualization (`MasteringVisualizer`), control (`Transport`), and effects (`EffectsRack`).

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
# Start the development server (accessible via 0.0.0.0)
npm run dev
```

### Testing

```bash
# Run the test suite (Unit + Integration)
npm run test
```

### Building for Production

```bash
# compile TypeScript and bundle with Vite
npm run build
```

## 🧩 Adding New Effects

Sonic Forge is designed to be extensible. To add a new effect:

1.  **DSP:** Write your processor in `src/audio/worklets/my-effect-processor.js`.
2.  **Node:** Create a `MyEffectNode.ts` wrapper.
3.  **Register:** Add the module to `AudioEngine` (init, factory, offline render) and `useAudioStore`.
4.  **UI:** Create a component in `src/components/rack/` and add it to `EffectsRack.tsx`.

## 📄 License

MIT
