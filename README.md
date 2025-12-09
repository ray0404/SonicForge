# Sonic Forge 

![Status](https://img.shields.io/badge/status-production_ready-green)
![Tech](https://img.shields.io/badge/stack-React_Vite_Worklet-blue)

**Sonic Forge** is a high-performance, local-first web audio template designed for building professional-grade audio tools. It features a modular "Rack" architecture, a shared DSP library, asset management for samples, and offline persistence, making it the perfect starting point for DAWs, Synthesizers, and Audio Effect plugins.

## 🚀 Features

*   **Modular Effects Rack:** Drag-and-drop style architecture (under the hood) supporting arbitrary chains of effects.
*   **Audio Worklet Engine:** All signal processing runs on a dedicated high-priority audio thread, ensuring glitch-free playback.
*   **Asset Management:** Drag-and-drop support for audio files (WAV/MP3), persisted locally via `IndexedDB`.
*   **Included Modules:**
    *   **Dynamic EQ:** A 5-band equalizer with sidechain compression and real-time frequency response visualization.
    *   **Transient Shaper:** Precision tool for shaping the attack and sustain of percussive sounds.
    *   **Lookahead Limiter:** Mastering-grade limiter with lookahead, ceiling control, and gain reduction metering.
    *   **Mid/Side EQ:** Independent processing for Mid (L+R) and Side (L-R) channels for stereo widening and mastering.
    *   **Cab Sim / IR Loader:** Convolution engine for loading Impulse Responses (IRs) with wet/dry mix.
    *   **Loudness Meter:** EBU R128 compliant LUFS metering (Momentary & Short-term) for broadcast-ready level monitoring.
*   **Local-First & Offline:** Sessions and assets are saved automatically. Works without an internet connection (PWA).
*   **Mobile Ready:** Optimized for touch interfaces and runs smoothly on Android (via Termux/Chrome).

## 🛠️ Architecture

Sonic Forge enforces a strict separation of concerns:

1.  **DSP Layer (`src/audio/worklets/`):** Pure JavaScript processing logic. Contains a shared `dsp-helpers.js` library with Biquads, Envelope Followers, Delay Lines, and K-Weighting filters.
2.  **Audio Engine (`src/audio/context.ts`):** A singleton that manages the Web Audio Graph, routes signals, and handles asset decoding.
3.  **Application State (`src/store/`):** A Zustand store that acts as the "Source of Truth" for the rack configuration and asset registry.
4.  **UI Layer (`src/components/`):** React components that visualize state, render Canvas meters, and dispatch updates.

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
3.  **Register:** Add the module to `AudioEngine` (init, factory) and `useAudioStore` (types, defaults).
4.  **UI:** Create a component in `src/components/rack/` and add it to `EffectsRack.tsx`.

## 📄 License

MIT