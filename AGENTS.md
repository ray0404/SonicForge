# AI Agent Directives: Sonic Forge

**Current State:** Phase 3 (Documentation & Hardening) Complete.
**Active Track:** `hardening_20251225`

This document serves as the operational manual for Autonomous AI Agents working on the Sonic Forge repository.

## 1. Core Directives

### Directive Alpha: "Respect the Trinity"
*   **The Law:** Every audio effect functions as a triad of **Processor (DSP)**, **Node (Interface)**, and **Unit (UI)**.
*   **Constraint:** You MUST NOT merge these responsibilities. 
    *   Do NOT put DSP logic in the Node.
    *   Do NOT put DOM access in the Processor.
    *   Do NOT put Audio API calls in the UI (use the Store).
*   **Reference:** See `docs/trinity-pattern.md` before writing any module code.

### Directive Beta: "Do No Harm"
*   **Audio Engine:** The `src/audio/context.ts` file is critical infrastructure. Do not modify the `rebuildGraph` logic unless you understand the "Diff-Based Patching" algorithm (see `docs/architecture/audio-graph.md`).
*   **Type Safety:** Stick to `standardized-audio-context` interfaces. Do not bypass the type checker with `any`.

## 2. Architectural Integrity

### The Store as Source of Truth
*   The UI reads from `useAudioStore`.
*   The Engine subscribes to `useAudioStore`.
*   Therefore, **Updating the Store** is the only way to change the Audio.

### Thread Isolation
*   **Audio Thread:** `src/audio/worklets/*.js`. NO DOM ACCESS. NO ALLOCATIONS inside `process()`.
*   **Main Thread:** Everything else. 
*   **Communication:** Use `port.postMessage` for analysis data (meters), but throttle UI updates to 30/60fps to avoid main-thread jank.

## 3. Implementation Protocols

### Adding a New Effect
1.  **DSP:** Create `src/audio/worklets/[name]-processor.js`.
2.  **Node:** Create `src/audio/worklets/[Name]Node.ts`.
3.  **UI:** Create `src/components/rack/[Name]Unit.tsx`.
4.  **Register:**
    *   `src/store/useAudioStore.ts` (Types & Defaults).
    *   `src/audio/context.ts` (`createModuleNode` & `renderOffline`).
    *   `src/components/rack/EffectsRack.tsx` (Menu).

### Testing Strategy
*   **DSP Tests:** `src/audio/worklets/lib/*.test.js`. Verify math logic.
*   **Integration Tests:** `src/audio/context.test.ts`. Verify graph construction.
*   **Benchmark:** `src/audio/benchmarks/rebuild-graph.test.ts`. Verify performance regressions.

## 4. Documentation Standards
*   **Code:** JSDoc is mandatory for all `AudioWorkletNode` classes and `dsp-helpers` functions.
*   **Docs:** Update `docs/modules/` when modifying DSP behavior. Ensure the "Technical Specifications" section matches the code.

## 5. Current Priorities
*   **Documentation Maintenance:** Keep the `docs/` folder in sync with code changes.
*   **DSP Optimization:** Identifying heavy processors and optimizing their loops.
*   **WASM:** Preparing the architecture for future WebAssembly modules.