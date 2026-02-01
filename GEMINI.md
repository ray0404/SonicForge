# Sonic Forge - Project Context

## Project Overview

**Sonic Forge** is a high-performance, local-first web audio application (PWA) designed for professional audio mastering and processing. It aims to bridge the gap between browser-based tools and desktop DAWs by leveraging **AudioWorklets** and a **Zero-Latency DSP Engine**.

### Core Architecture
The project follows a strict **Three-Layer Architecture** to respect Web Audio API thread boundaries:

1.  **Intent Layer (UI & State):**
    *   **Tech:** React, Zustand.
    *   **Role:** Maintains a JSON-serializable description of the "Rack". Runs on the Main Thread.
    *   **Key Files:** `src/store/`, `src/components/`

2.  **Orchestration Layer (AudioEngine):**
    *   **Tech:** TypeScript, Web Audio API (standardized-audio-context).
    *   **Role:** Translates state changes into imperative Web Audio API calls (`AudioNode` lifecycle, `setTargetAtTime`).
    *   **Key Files:** `src/audio/context.ts`

3.  **Processing Layer (DSP):**
    *   **Tech:** AudioWorklet (Pure JavaScript) & **Zig (WebAssembly)**.
    *   **Role:** Executes DSP logic on audio buffers in the Audio Thread.
    *   **Key Files:** `src/audio/worklets/`, `src/audio/lib/`, `src/audio/dsp/zig/`

### Key Technologies
*   **Framework:** React + Vite
*   **Language:** TypeScript, **Zig**
*   **Audio:** Web Audio API (AudioWorklet), `standardized-audio-context`, **WebAssembly (WASM)**
*   **State Management:** Zustand
*   **Styling:** Tailwind CSS
*   **Testing:** Vitest
*   **PWA:** `vite-plugin-pwa`
*   **CLI:** `ink`, `commander`, `puppeteer-core` (for headless audio processing)

## New Features: Smart Processing (Zig/WASM)

A new high-performance offline processing module has been integrated, powered by Zig and WebAssembly.

*   **Location:** `src/audio/dsp/zig/` (Source), `public/wasm/dsp.wasm` (Compiled)
*   **Processors:**
    *   **Loudness Normalization:** EBU R128 style normalization with custom target LUFS.
    *   **Phase Rotation:** All-pass filter chain to recover headroom by smearing transients.
    *   **De-Clipper:** Cubic interpolation to repair digital clipping.
    *   **Adaptive Spectral Denoise:** FFT-based noise reduction.
    *   **Mono Bass:** Linkwitz-Riley crossover to mono-sum low frequencies.

### Workflow
The Smart Processing panel (`BatchProcessMenu`) supports two modes:
1.  **Project Track:** Processes audio directly within the Sonic Forge multi-track environment. Includes Undo/Redo history.
2.  **External File:** Allows users to upload, process, preview (with scrubbable timeline), and download audio files independently of the project.

## Building and Running

### Web Application

*   **Development Server:**
    ```bash
    npm run dev
    ```
    Starts Vite dev server at `http://localhost:5173`. Includes Eruda for mobile debugging in dev mode.

*   **Production Build:**
    ```bash
    npm run build
    ```
    Compiles TypeScript and bundles with Vite. Output is in `dist/`.

*   **Build WASM DSP:**
    ```bash
    npm run build:wasm
    ```
    Compiles the Zig DSP code to WebAssembly. Requires Zig 0.13.0+ installed and in PATH.

*   **Preview Production Build:**
    ```bash
    npm run preview
    ```

### CLI Tool

The project includes a CLI counterpart that uses a headless browser for audio processing.

*   **Development Mode:**
    ```bash
    npm run dev:cli -- [command]
    ```
    Uses `tsx` to run the CLI directly from source.

*   **Build CLI:**
    ```bash
    npm run build:cli
    ```
    Builds the web assets first, then compiles the CLI TypeScript code.

*   **Preview CLI:**
    ```bash
    npm run preview:cli -- [command]
    ```
    Runs the built CLI from `dist/cli/index.js`.

### Testing

*   **Run All Tests:**
    ```bash
    npm test
    ```
    Uses Vitest.

*   **Run Tests with UI:**
    ```bash
    npm run test -- --ui
    ```

## Development Conventions

### The "Trinity Pattern"
To add a new audio effect, you must implement three distinct parts:
1.  **DSP Processor:** `src/audio/worklets/[name]-processor.js` (Audio Thread logic).
2.  **Audio Node:** `src/audio/[Name]Node.ts` (Main Thread wrapper extending `AudioWorkletNode`).
3.  **UI Component:** `src/components/rack/[Name]Unit.tsx` (React component for user interaction).

### Code Organization
*   **`src/audio/`**: Core audio engine.
    *   `worklets/`: Raw JS AudioWorklet processors.
    *   `dsp/zig/`: Zig source code for WASM modules.
    *   `workers/`: Web Workers for offline processing.
*   **`src/store/`**: Application state. `useAudioStore.ts` is the source of truth for the audio graph.
*   **`src/components/rack/`**: UI components for individual effects modules.
*   **`src/hooks/`**: Custom React hooks, including `useProjectPersistence` for IndexedDB storage.
*   **`cli/`**: Source code for the CLI tool (`ink` based UI).

### Path Aliases
*   `@/*`: Maps to `./src/*`

### Documentation
*   Documentation is located in `docs/` and copied to `public/docs` during build.
*   Architecture details can be found in `docs/architecture/`.

## Important Files
*   `vite.config.ts`: Vite configuration, including PWA and build settings.
*   `src/audio/context.ts`: The `AudioEngine` class, responsible for managing the Web Audio graph.
*   `src/store/useAudioStore.ts`: Zustand store managing the application state.
*   `src/main.tsx`: Entry point for the React application.
*   `src/sw.js`: Service Worker for PWA functionality.
*   `headless.html`: Entry point for the headless browser used by the CLI.
*   `src/audio/dsp/zig/main.zig`: Entry point for the Zig DSP engine.