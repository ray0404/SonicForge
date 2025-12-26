# Context: Sonic Forge

## 1. Project Overview
**Sonic Forge** is a high-performance, local-first web audio application designed for audio mastering and processing. It leverages the Web Audio API (AudioWorklets) for low-latency DSP and React for a responsive, modular UI.

**Core Philosophy:**
- **Local-First:** All processing happens in the browser. Zero latency, full privacy.
- **Modular Rack Architecture:** Effects are hot-swappable nodes in a flexible signal chain.
- **"The Trinity" Pattern:** Every audio module consists of three distinct parts (DSP, Node, UI).
- **Offline Capable:** Full PWA support with IndexedDB persistence for projects and assets.

## 2. Technical Stack
| Layer | Technology | Key Usage |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript 5 | Component-based UI, Strict typing. |
| **Build Tool** | Vite | Fast HMR, optimized production builds. |
| **Styling** | Tailwind CSS | Utility-first styling, consistent design system. |
| **State** | Zustand | Global store for Rack state, Playback, and Assets. |
| **Audio** | standardized-audio-context | Cross-browser Web Audio API wrapper. |
| **Persistence** | IndexedDB (idb-keyval) | Storing large audio blobs and session state. |
| **Testing** | Vitest | Unit testing for Logic and DSP. |

## 3. The "Trinity" Architecture Pattern
All audio effects **MUST** follow this strict structure to ensure separation of concerns:

1.  **The Processor (DSP):**
    *   Location: `src/audio/worklets/[name]-processor.js`
    *   Role: Runs on the Audio Thread. Pure JS math. No DOM access.
    *   Key Class: Extends `AudioWorkletProcessor`.
2.  **The Node (Interface):**
    *   Location: `src/audio/worklets/[Name]Node.ts`
    *   Role: Runs on the Main Thread. Bridges React and the Audio Processor.
    *   Key Class: Extends `AudioWorkletNode`. Handles `parameters`.
3.  **The Component (UI):**
    *   Location: `src/components/rack/[Name]Unit.tsx`
    *   Role: React component. Visualizes state and controls the Node.
    *   Key Interactions: Reads from `useAudioStore`, writes to `node.parameters`.

## 4. Key Directory Structure
```
src/
├── audio/
│   ├── context.ts       # Singleton AudioContext wrapper (AudioEngine)
│   └── worklets/        # DSP Processors and Node definitions
├── components/
│   ├── rack/            # Effect Unit UI components
│   ├── transport/       # Playback controls
│   └── visualizers/     # Canvas-based audio analysis tools (Spectrum, Goniometer)
├── store/
│   └── useAudioStore.ts # The "Brain" - Zustand store managing the app state
└── hooks/
    └── useProjectPersistence.ts # Autosave and Project management logic
```

## 5. Coding Conventions
- **State Management:** Store *descriptions* of the graph (IDs, parameters) in Zustand. Do not store complex audio objects.
- **AudioEngine Access:** Use `audioEngine.getModuleNode(id)` to retrieve a node for real-time state reading (e.g., meters). Never access `nodeMap` directly.
- **Performance:** Use `requestAnimationFrame` for visualizers. Decouple UI rendering from audio processing.
- **Types:** Strict `noImplicitAny`. All AudioNodes must use `IAudioNode` and related interfaces from `standardized-audio-context`.
- **Testing:** Unit test all pure functions and store logic. Ensure mocks in `src/test/setup.ts` are updated for new audio features.

## 6. AI Agent Instructions
- **Graph Integrity:** `AudioEngine.rebuildGraph` uses **diff-based patching**. It optimizes for single-node insertions and removals to prevent dropouts. For complex changes, it falls back to a full rebuild. Do not break the diffing logic.
- **Stereo Analysis:** The engine provides `analyserL` and `analyserR` nodes via a `ChannelSplitter`. Use these for stereo-specific visualizers or processing logic.
- **Safe Refactoring:** When changing `src/audio/`, verify that `renderOffline` (used for WAV export) still has parity with the real-time path.
- **Accessibility:** Maintain ARIA labels and semantic markup in UI components, especially in `Transport.tsx`.

## 7. Optimization Strategies
- **Partial Graph Rebuild:** The engine compares the new Rack state with the old one. If only one node changed position, it re-routes the connections without tearing down the nodes. This preserves internal state (delay buffers, filter energy) and prevents audio glitches.
- **Canvas Bypass:** Visualizers do NOT use React state. They use `requestAnimationFrame` to query the Audio Node directly and draw to a canvas ref. This keeps the main thread free for UI interactions.
