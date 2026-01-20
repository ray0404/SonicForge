# Sonic Forge

![Status](https://img.shields.io/badge/status-production_ready-green)
![Tech](https://img.shields.io/badge/stack-React_Vite_Worklet-blue)
![PWA](https://img.shields.io/badge/platform-PWA_Local--First-purple)

**Sonic Forge** is a high-performance, local-first web audio application designed for professional audio mastering and processing. It bridges the gap between the convenience of a browser-based tool and the fidelity of a desktop DAW. By leveraging **AudioWorklets**, **WebAssembly** (future), and a **Zero-Latency DSP Engine**, it offers a fully offline-capable production environment that runs entirely on your device.

## 🚀 Key Features

*   **Modular Effects Rack:** A flexible signal chain that supports hot-swapping, reordering, and bypassing modules without audio dropouts (thanks to an intelligent **Diff-Based Graph Patching** algorithm).
*   **Professional DSP Suite:** A collection of 20+ mastering-grade audio processors, including:
    *   **Dynamics:** Lookahead Limiter, Multiband Compressor, Transient Shaper, DeEsser.
    *   **EQ & Filters:** Dynamic EQ, Mid/Side EQ, Parametric EQ, AutoWah.
    *   **Coloration:** Analog Saturation (Tape/Tube/Fuzz), Soft-Clip Distortion, Bitcrusher.
    *   **Time & Space:** Convolution Reverb (Cab Sim), Feedback Delay, Chorus, Phaser, Tremolo.
*   **Precision Analysis:**
    *   **LUFS Meter:** ITU-R BS.1770-4 compliant loudness metering (Momentary & Short-Term).
    *   **Spectrum Analyzer:** High-resolution FFT visualization.
    *   **Goniometer:** Real-time stereo field analysis for checking phase compatibility.
*   **Local-First Architecture:**
    *   **Zero Uploads:** Your audio files are processed locally. No server costs, no privacy risks.
    *   **Offline Support:** Fully functional PWA that works without an internet connection.
    *   **Asset Persistence:** Drag-and-drop IRs and source files are saved to `IndexedDB`, restoring your session exactly as you left it.
*   **Offline Export:** Render your final master to a 32-bit Float WAV file at faster-than-realtime speeds using the `OfflineAudioContext`.

## 📚 Documentation

We maintain extensive documentation for both users and developers:

*   **[User Guide](docs/guide.md):** How to use the interface, load audio, and export projects.
*   **[Module Reference](docs/modules/):** In-depth technical manuals for every effect unit (DSP theory, parameters, use cases).
*   **[Architecture](docs/architecture.md):** Deep dives into the system design:
    *   [Concepts & Abstraction Layers](docs/architecture/concept-abstraction.md)
    *   [Data & State Flow](docs/architecture/state-flow.md)
    *   [The Audio Graph](docs/architecture/audio-graph.md)
*   **[The Trinity Pattern](docs/trinity-pattern.md):** Our core design philosophy for separating UI, Control, and DSP.

## 🛠️ Technical Architecture

Sonic Forge is built on a strict **Three-Layer Architecture** designed to respect the thread boundaries of the Web Audio API.

### 1. The "Intent" Layer (React + Zustand)
*   **Role:** User Interface & State Management.
*   **Context:** Main Thread.
*   **Responsibility:** Maintains a JSON-serializable description of the "Rack." Updates are optimistic and run at 60fps.

### 2. The "Orchestration" Layer (AudioEngine)
*   **Role:** Graph Management.
*   **Context:** Main Thread.
*   **Responsibility:** Translates state changes into imperative Web Audio API calls. It manages `AudioNode` lifecycles and schedules parameter automation (`setTargetAtTime`) to ensure click-free transitions.

### 3. The "Processing" Layer (AudioWorklet)
*   **Role:** Signal Processing (DSP).
*   **Context:** Audio Thread (Real-time priority).
*   **Responsibility:** Executes pure JavaScript math on audio buffers. Isolated from the DOM and Garbage Collector to prevent audio glitches.

## 📂 Project Structure

```bash
/
├── cli/                # Headless CLI tool implementation
├── docs/               # Architecture and User documentation
├── public/             # Static assets (images, manifest)
├── src/
│   ├── audio/          # The Audio Engine Core
│   │   ├── worklets/   # AudioWorkletProcessors (DSP logic)
│   │   ├── lib/        # Shared DSP math libraries
│   │   └── context.ts  # AudioContext orchestration
│   ├── components/     # React UI Components
│   ├── hooks/          # Custom React Hooks
│   ├── store/          # Zustand State Stores
│   └── utils/          # Shared Utilities (logging, formatting)
└── ...
```

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

#### Web Application
```bash
# Start the development server (Vite)
npm run dev
# Open http://localhost:5173
```

#### CLI Tool
Sonic Forge includes a CLI for headless processing and automation.
```bash
# Run CLI in dev mode
npm run dev:cli
```

### Testing

We use **Vitest** for rigorous unit and integration testing of the DSP logic.

```bash
# Run all tests
npm test

# Run tests with UI
npm run test -- --ui
```

### Building for Production

```bash
# Compile TypeScript and bundle with Vite
npm run build
# Preview the production build locally
npm run preview
```

## 🧩 Adding New Effects

Sonic Forge is designed to be extensible. To add a new effect, you must implement the **Trinity Pattern**:

1.  **DSP:** Write your processor in `src/audio/worklets/my-effect-processor.js`.
2.  **Node:** Create a `MyEffectNode.ts` wrapper extending `AudioWorkletNode`.
3.  **UI:** Create a `MyEffectUnit.tsx` component using our atomic UI library.
4.  **Register:** Add the module to the `AudioEngine` factory and the `useAudioStore` types.

See `docs/trinity-pattern.md` for a step-by-step tutorial.

## 🌐 Browser Support

Sonic Forge relies on modern Web Audio API features, specifically `AudioWorklet`.

*   **Chrome / Edge:** 66+ (Best Performance)
*   **Firefox:** 76+
*   **Safari:** 14.1+

## 📄 License

MIT