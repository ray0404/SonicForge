# Context: Sonic Forge

## 1. Project Overview
**Sonic Forge** is a production-ready, local-first web audio application template ("Golden Path"). It provides a modular rack architecture for building high-performance audio tools (DAWs, Mastering Suites) that run seamlessly on desktop and mobile.

**Core Philosophy:**
- **Modular Rack:** Effects are hot-swappable nodes in a chain.
- **Audio Worklet First:** DSP happens off the main thread.
- **Offline Capable:** Full PWA support with IndexedDB persistence.
- **Export Ready:** Built-in engine for offline rendering to WAV.

## 2. Technical Stack
| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Functional Components, Hooks, Canvas Vis |
| **Language** | TypeScript 5 | Strict Mode, Path Aliases (`@/*`) |
| **State** | Zustand | Playback state, Rack Module management, Assets |
| **Audio** | Web Audio API | `AudioWorklet`, `OfflineAudioContext`, `BiquadFilter` |
| **Persistence** | IndexedDB | `idb-keyval` for assets and sessions |

## 3. Architecture & Key Files

### Audio Engine (`src/audio/`)
The `AudioEngine` singleton (`context.ts`) manages both Realtime and Offline contexts.
- **`context.ts`**:
    - `init()`: Loads worklets.
    - `loadSource()`: Decodes user files.
    - `play()/pause()`: Manages `AudioBufferSourceNode`.
    - `renderOffline()`: Reconstructs the graph in `OfflineAudioContext` for export.
- **`worklets/`**: DSP logic (Limiter, EQ, LUFS, etc.).

### State Management (`src/store/`)
- **`useAudioStore.ts`**:
    - `rack`: Array of modules.
    - `assets`: Registry of loaded IRs and source files.
    - `playback`: `isPlaying`, `currentTime`, `sourceDuration`.

### UI Components (`src/components/`)
- **`Transport.tsx`**: Playback controls, seeking, file loader, export button.
- **`visualizers/MasteringVisualizer.tsx`**: Spectrum Analyzer & Goniometer.
- **`rack/EffectsRack.tsx`**: Main effect chain container.

## 4. Development Workflow
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start dev server (host: 0.0.0.0) |
| `npm run build` | Full production build (TSC + Vite) |
| `npm run test` | Run Vitest suite (Unit + Integration) |

## 5. Coding Conventions
- **DSP:** Keep logic in `src/audio/worklets/`. Use `dsp-helpers.js`.
- **Nodes:** Every processor must have a matching `Node` class.
- **Offline:** Every effect MUST be supported in `renderOffline`.