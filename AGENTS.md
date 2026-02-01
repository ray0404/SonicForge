# Agent Operational Guide - Sonic Forge

## 1. Project Identity
*   **Name:** Sonic Forge
*   **Type:** Progressive Web App (PWA) for Audio Mastering
*   **Stack:** React, TypeScript, Vite, Zustand, Tailwind, **Zig (WASM)**.
*   **Core Philosophy:** Zero-latency UI, AudioWorklet DSP, Local-first (IndexedDB).

## 2. Key Commands
*   **Dev:** `npm run dev`
*   **Build:** `npm run build`
*   **Build WASM:** `npm run build:wasm` (Requires Zig 0.13.0+)
*   **Test:** `npm test`
*   **CLI Dev:** `npm run dev:cli`

## 3. Architecture Highlights
*   **Three-Layer Audio:**
    1.  **Store (Zustand):** Truth.
    2.  **Engine (Context):** Orchestrator.
    3.  **DSP (Worklets/WASM):** Processor.
*   **Trinity Pattern:** New effects need a Processor (JS/WASM), a Node (TS), and a UI Component (React).
*   **Smart Processing:** Offline processing is handled by a Web Worker (`offline-processor.worker.ts`) which bridges to a compiled Zig WebAssembly module (`dsp.wasm`) for heavy-duty tasks like Loudness Normalization and Spectral Denoising.

## 4. State Management
*   **`useAudioStore`:** Manages the "Rack" (array of effects) and global playback state.
*   **`useProjectPersistence`:** Auto-saves to IndexedDB.

## 5. Testing
*   **Vitest:** Used for unit testing DSP logic and React components.
*   **Headless Browser:** The CLI uses Puppeteer to run the audio engine in a headless environment.

## 6. Zig Integration
*   **Source:** `src/audio/dsp/zig/`
*   **Compilation:** `npm run build:wasm` uses `zig build-exe` to create a standalone WASM file in `public/wasm/`.
*   **Bridge:** `WasmBridge` class in `offline-processor.worker.ts` handles memory allocation and function calls between JS and WASM.

## 7. Known Constraints
*   **AudioContext:** Must be resumed by user interaction.
*   **SharedArrayBuffer:** Not currently used to avoid COOP/COEP complexity, but may be needed for future threading.
*   **Zig Version:** Project is pinned to Zig 0.13.0.