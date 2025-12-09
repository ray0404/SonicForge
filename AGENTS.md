# AI Agent Directives: Sonic Forge

This document outlines the rules and patterns for AI agents modifying the Sonic Forge codebase.

## 1. Architectural Integrity
*   **The Trinity Pattern:** Every audio effect requires three distinct parts:
    1.  **DSP (Worklet):** Raw JS in `src/audio/worklets/`. Must rely on `dsp-helpers.js` for math.
    2.  **Interface (Node):** TypeScript class extending `AudioWorkletNode`. Exposes typed parameters.
    3.  **Control (UI/Store):** A Zustand module type definition and a React component.
*   **Unidirectional Data Flow:**
    *   `UI` -> `Zustand Store` -> `AudioEngine` -> `AudioNode` -> `AudioWorklet`.
    *   *Never* modify AudioNodes directly from React components.

## 2. DSP Implementation Guidelines
*   **No WASM (Yet):** Stick to pure JavaScript classes in `dsp-helpers.js`. It's fast enough for this scope and easier to debug in Termux.
*   **Parameter Smoothing:** All `AudioParam` updates should use `setTargetAtTime` (k-rate) or `setValueAtTime` (immediate) to prevent clicking.
*   **Memory Safety:** Do not create objects (garbage) inside the `process()` loop. Pre-allocate arrays and state in the `constructor`.

## 3. Testing Strategy
*   **Unit Tests:** Test DSP math in `dsp-helpers.test.js`.
*   **Integration Tests:** Test the *Store* (`useAudioStore.test.ts`) to verify that adding a module updates the rack state correctly.
*   **UI Tests:** Test `EffectsRack.tsx` to verify that the correct controls render for a given module type.

## 4. How to Add a New Effect (Checklist)
1.  [ ] **DSP:** Create `src/audio/worklets/my-effect-processor.js`. Register it.
2.  [ ] **Node:** Create `src/audio/worklets/MyEffectNode.ts`.
3.  [ ] **Engine:**
    *   Import the processor URL in `src/audio/context.ts`.
    *   Add `addModule` call in `init()`.
    *   Add case in `createModuleNode()`.
    *   Add case in `updateModuleParam()`.
4.  [ ] **Store:**
    *   Add type to `RackModuleType`.
    *   Add default parameters in `addModule()`.
5.  [ ] **UI:**
    *   (Optional) Create specialized component if Canvas vis is needed.
    *   Update `EffectsRack.tsx` to render it.

## 5. Common Pitfalls
*   **Module IDs:** Always use `crypto.randomUUID()` when creating new modules in the store.
*   **Audio Context State:** Always check if `context.state === 'suspended'` and resume it on the first user interaction.
*   **Worklet Loading:** Worklet paths must be imported with `?worker&url` suffix for Vite to bundle them correctly.
