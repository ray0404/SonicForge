# Sonic Forge: Instructional Context

Sonic Forge is a high-performance, local-first Web Audio application designed for professional-grade audio mastering and processing. It leverages the Web Audio API's **AudioWorklets** for low-latency DSP and **React** for a modular, responsive UI.

## 🚀 Project Overview

*   **Core Technology:** React 18, Vite, TypeScript, Zustand, Tailwind CSS.
*   **Audio Engine:** Built on `standardized-audio-context` to ensure cross-browser stability. Signal processing runs on a dedicated high-priority audio thread.
*   **Architecture Pattern:** **"The Trinity Pattern"**. Every audio module must consist of three distinct layers:
    1.  **DSP Layer (Processor):** Pure JS logic running in an `AudioWorkletProcessor` (`src/audio/worklets/*-processor.js`).
    2.  **Node Layer (Interface):** TS class extending `AudioWorkletNode` or `IAudioNode` (`src/audio/worklets/*Node.ts`).
    3.  **UI Layer (Component):** React component for control and visualization (`src/components/rack/*Unit.tsx`).

## 🛠️ Key Commands

*   **Development:** `npm run dev` (Starts Vite server on port 3000).
*   **Build:** `npm run build` (Compiles TS and bundles via Vite).
*   **Test:** `npm run test` (Runs Vitest suite for DSP and UI components).
*   **Lint:** `npm run lint` (Executes ESLint with strict rules).

## 📐 Development Conventions

### 1. Adding New Effects
To add a new effect, strictly follow the Trinity Pattern:
*   Define the algorithm in a `*-processor.js` file.
*   Create a TS Node wrapper that handles parameter mapping and communication.
*   Register the new module in `src/audio/context.ts` (`createModuleNode` and `updateModuleParam`).
*   Define initial parameters in `src/store/useAudioStore.ts`.
*   Create the UI Unit and add it to the `EffectsRack.tsx` switch.

### 2. Audio Graph Management
The `AudioEngine` (`src/audio/context.ts`) uses a **diff-based patching** system (`rebuildGraph`). It attempts to perform surgical connections/disconnections to avoid audio dropouts when reordering or toggling modules. 

### 3. State Management
*   **Zustand (`useAudioStore`):** Central source of truth for the Rack configuration, assets, and playback state.
*   **Sidechain Routing:** Supports advanced routing where modules (like Compressor or Dynamic EQ) can accept a secondary input for gain detection.

### 4. Persistence
User sessions and assets (audio files, Impulse Responses) are persisted locally via `IndexedDB` (`idb-keyval`).

## 🔍 Important Directories

*   `src/audio/worklets/`: DSP Processors and Node wrappers.
*   `src/audio/worklets/lib/`: Shared DSP helpers (filters, crossovers, etc.).
*   `src/components/rack/`: Modular UI units for the effects rack.
*   `src/store/`: Zustand store definitions.
*   `blueprints/`: Detailed technical specifications and implementation plans.
