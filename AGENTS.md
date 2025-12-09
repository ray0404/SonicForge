# AI Agent Directives: Sonic Forge

This document outlines the rules and patterns for AI agents modifying the Sonic Forge codebase.

## 1. Architectural Integrity
*   **The Trinity Pattern:** Every audio effect requires three distinct parts:
    1.  **DSP (Worklet):** Raw JS in `src/audio/worklets/`. Must rely on `dsp-helpers.js` for math.
    2.  **Interface (Node):** TypeScript class extending `AudioWorkletNode` (or Native Node wrapper). Exposes typed parameters.
    3.  **Control (UI/Store):** A Zustand module type definition and a React component.
*   **Unidirectional Data Flow:**
    *   `UI` -> `Zustand Store` -> `AudioEngine` -> `AudioNode` -> `AudioWorklet`.
    *   *Never* modify AudioNodes directly from React components.

## 2. DSP Implementation Guidelines
*   **No WASM (Yet):** Stick to pure JavaScript classes in `dsp-helpers.js`.
*   **Parameter Smoothing:** All `AudioParam` updates should use `setTargetAtTime` (k-rate) or `setValueAtTime` (immediate).
*   **Memory Safety:** Do not create objects inside the `process()` loop. Pre-allocate arrays in the constructor.
*   **Offline Compatibility:** All Worklets and Nodes must be capable of running in an `OfflineAudioContext`.

## 3. Testing Strategy
*   **Unit Tests:** Test DSP math in `dsp-helpers.test.js`.
*   **Integration Tests:** Test the *Store* (`useAudioStore.test.ts`) to verify rack state updates.
*   **UI Tests:** Test `EffectsRack.tsx` to verify module rendering. *Mock `AudioContext` and `AnalyserNode` methods* to prevent Canvas/Web Audio crashes in JSDOM.

## 4. How to Add a New Effect (Checklist)
1.  [ ] **DSP:** Create `src/audio/worklets/my-effect-processor.js`. Register it.
2.  [ ] **Node:** Create `src/audio/worklets/MyEffectNode.ts`.
3.  [ ] **Engine:**
    *   Import worklet URL in `src/audio/context.ts`.
    *   Add to `init()` (Realtime Context).
    *   Add case in `createModuleNode()` (Factory).
    *   Add case in `updateModuleParam()` (Realtime Update).
    *   **Crucial:** Add to `renderOffline()` (Offline Export Logic) - verify parameters and worklet loading.
4.  [ ] **Store:**
    *   Add type to `RackModuleType`.
    *   Add default parameters in `addModule()`.
5.  [ ] **UI:**
    *   Create component in `src/components/rack/`.
    *   Add button and rendering logic in `EffectsRack.tsx`.

## 5. Common Pitfalls
*   **Source Management:** Always check `useAudioStore.getState().assets` for blobs (IRs) or `sourceBuffer` for the main track.
*   **Offline Context:** `OfflineAudioContext` is separate from `AudioContext`. You must `addModule()` to *both* and recreate nodes for *both*.
*   **Type Safety:** Use `RackModuleType` union to ensure exhaustive checks in factories.