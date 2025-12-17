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
| **Audio** | Web Audio API | `AudioContext`, `AudioWorklet`, `OfflineAudioContext`. |
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
│   ├── context.ts       # Singleton AudioContext wrapper
│   └── worklets/        # DSP Processors and Node definitions (The First Two of the Trinity)
├── components/
│   ├── rack/            # Effect Unit UI components (The Third of the Trinity)
│   ├── transport/       # Playback controls
│   └── visualizers/     # Canvas-based audio analysis tools
├── store/
│   └── useAudioStore.ts # The "Brain" - Zustand store managing the app state
└── hooks/
    └── useProjectPersistence.ts # Autosave and Project management logic
```

## 5. Coding Conventions
- **State Management:** Do not store complex audio objects (Nodes) in Zustand if possible. Store *descriptions* of the graph (IDs, parameter values) and reconstruct the graph from that state.
- **Performance:** Avoid React re-renders during audio playback loops. Use `requestAnimationFrame` for visualizers, decoupled from React state updates.
- **Types:** strict `noImplicitAny`. All AudioNodes must have defined parameter interfaces.
- **Testing:** Unit test pure functions and store logic.

## 6. AI Agent Instructions
- **Context is King:** Always read `src/audio/context.ts` and `src/store/useAudioStore.ts` before modifying the signal flow.
- **Respect the Blueprint:** If a `blueprints/` file exists for a feature, follow it.
- **Safe Refactoring:** When changing `src/audio/`, ensure you are not breaking the `OfflineAudioContext` rendering path (used for export).
