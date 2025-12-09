# Context: Sonic Forge

## 1. Project Overview
**Sonic Forge** is a production-ready, local-first web audio application template ("Golden Path"). It provides a modular rack architecture for building high-performance audio tools (DAWs, processors) that run seamlessly on desktop and mobile (Termux/Android).

**Core Philosophy:**
- **Modular Rack:** Effects are hot-swappable nodes in a chain.
- **Audio Worklet First:** All DSP happens off the main thread.
- **Strict Typing:** TypeScript 5+ with full strict mode.
- **Offline Capable:** Full PWA support with IndexedDB persistence.

## 2. Technical Stack
| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Functional Components, Hooks, Canvas Vis |
| **Language** | TypeScript 5 | Strict Mode, Path Aliases (`@/*`) |
| **State** | Zustand | Transient UI state, Rack Module management |
| **Audio** | Web Audio API | `AudioWorklet`, `BiquadFilter` (Custom JS implementation) |
| **Build** | Vite 5 | HMR, PWA Plugin, `0.0.0.0` Host |
| **Styling** | Tailwind CSS | Utility-first, `clsx` |
| **Persistence** | IndexedDB | `idb-keyval` for saving/loading rack presets |

## 3. Architecture & Key Files

### Audio Engine (`src/audio/`)
The `AudioEngine` singleton (`context.ts`) manages the Web Audio Graph.
- **`context.ts`**: Handles graph construction, module factory (`createModuleNode`), and routing.
- **`worklets/`**:
    - **`transient-processor.js`**: Transient Shaper DSP (detects attack/sustain).
    - **`dynamic-eq-processor.js`**: Dynamic EQ DSP (sidechain filtering).
    - **`lib/dsp-helpers.js`**: Shared DSP classes (`EnvelopeFollower`, `BiquadFilter`).
    - **`TransientShaperNode.ts` / `DynamicEQNode.ts`**: Main-thread wrappers.

### State Management (`src/store/`)
- **`useAudioStore.ts`**: Zustand store. Manages the `rack` array (order of effects) and module parameters.
- **Flow:** UI updates Store -> Store updates AudioEngine -> AudioEngine updates AudioNodes.

### UI Components (`src/components/rack/`)
- **`EffectsRack.tsx`**: Main container. Handles adding/removing modules and the output visualizer.
- **`DynamicEQUnit.tsx`**: Specialized component with Canvas-based frequency response and gain reduction visualization.

## 4. Development Workflow
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start dev server (host: 0.0.0.0) |
| `npm run build` | Full production build (TSC + Vite) |
| `npm run test` | Run Vitest suite (Unit + Integration) |

## 5. Coding Conventions
- **DSP:** Keep logic in `src/audio/worklets/`. Use `dsp-helpers.js` for shared math.
- **Nodes:** Every processor must have a matching `Node` class in TS.
- **State:** UI never talks to `AudioEngine` directly; it dispatches actions to `useAudioStore`.
- **Imports:** Use `@/` alias.
