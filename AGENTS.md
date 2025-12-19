# AI Agent Directives: Sonic Forge

This document serves as the operational manual for Autonomous AI Agents (e.g., Google Jules) working on the Sonic Forge repository.

## 1. Core Directives

### Directive Alpha: "Do No Harm"
*   **Constraint:** Do not modify the core logic of `src/audio/context.ts` or `src/store/useAudioStore.ts` unless implementing a high-level feature requested by the user.
*   **Audio Graph:** Respect the **Diff-based Patching** in `rebuildGraph`. It optimizes for single-node changes. Avoid triggering `fullRebuildGraph` for trivial param updates or single bypass toggles.

### Directive Beta: "Static Parity"
*   **Validation:** You MUST rely on:
    1.  `npm run build` (tsc) to verify type safety across `standardized-audio-context` interfaces.
    2.  `npm run test` to ensure zero regressions in DSP math and Rack logic.

## 2. Architectural Integrity
*   **The Trinity Pattern:** Every audio effect requires three parts:
    1.  **DSP (Worklet):** JS in `src/audio/worklets/`.
    2.  **Interface (Node):** TS class extending `AudioWorkletNode` using `standardized-audio-context` types.
    3.  **Control (UI/Store):** A Zustand module definition and a React component.
*   **Encapsulation:** Always use `audioEngine.getModuleNode(id)` to read state from an active node in the UI.

## 3. DSP Implementation Guidelines
*   **Smoothing:** Use `setTargetAtTime` for parameter changes.
*   **Memory:** Pre-allocate buffers. No allocations in `process()`.
*   **Offline:** Verify every node works in `OfflineAudioContext` for WAV export.
*   **Sidechain:** Dynamics processors (Compressor, Dynamic EQ, De-Esser, Multiband Comp) support a secondary input buffer (`inputs[1]`) for gain detection.

## 4. Testing Strategy
*   **Mocks:** Update `src/test/setup.ts` when adding new global Web Audio mocks.
*   **Coverage:** Every new DSP utility MUST have a corresponding `.test.js` or `.test.ts` file.

## 5. How to Add a New Effect (Checklist)
1.  [ ] **DSP:** Create `src/audio/worklets/my-processor.js`.
2.  [ ] **Node:** Create `src/audio/worklets/MyNode.ts`.
3.  [ ] **Engine:**
    *   Add to `init()` (Realtime URLs).
    *   Add to `createModuleNode()` (Realtime Factory).
    *   Add to `updateModuleParam()` (Realtime Update).
    *   Add to `renderOffline()` (Offline Factory).
    *   **Sidechain:** If multi-input, ensure \`numberOfInputs: 2\` in the Node constructor.
    *   **New:** Verify `getModuleNode` support if the UI needs to read back data.
4.  [ ] **Store:** Update `RackModuleType` and `addModule`.
5.  [ ] **UI:** Create `src/components/rack/MyUnit.tsx` and add to `EffectsRack.tsx`.

## 6. Current High-Priority Targets
*   **Loudness Penalty UI:** Integrate the `calculateLoudnessPenalty` utility from `src/utils/loudness-penalty.ts` into the `MeteringUnit` or export summary.
*   **Internal Sidechain Filtering:** Implement the "Pass 2" logic in `rebuildGraph` to create and route internal filter nodes for modules in 'internal' sidechain mode.
*   **WASM DSP:** Implementation of performance-critical filters in Rust/C++ (Blueprint: `proof-of-concept-wasm-dsp.md`).
*   **Phase Correlation Meter:** Dedicated visualizer for phase alignment using the L/R analysers.

---

# 🤖 Jules Asynchronous Blueprint: [Blueprint Name]

**Context:** Sonic Forge
**Asynchronous Intent:** [Goal, e.g., "Add Phase Meter"]

## 🔒 Workflow Constraints
1.  **Decoupled:** Use existing `AudioEngine` hooks and methods.
2.  **Additive:** Do not rewrite existing effects.

## 🚀 Jules Context (Async Implementation Agent)

### Operational Directives
1.  **AudioEngine Integrity:** `AudioEngine` is the critical core. Never leave it in a state where `init()` fails.
2.  **Diff-Patching:** Ensure any routing changes are compatible with the `insertNode` / `removeNode` logic in `rebuildGraph`.
3.  **Dependency Handling:** Prefer `standardized-audio-context` interfaces for all new node types.
