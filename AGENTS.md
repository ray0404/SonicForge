# AI Agent Directives: Sonic Forge

This document serves as the operational manual for Autonomous AI Agents (e.g., Google Jules) working on the Sonic Forge repository.

## 1. Core Directives

### Directive Alpha: "Do No Harm"
*   **Constraint:** Do not modify `src/audio/context.ts` or `src/store/useAudioStore.ts` unless the task explicitly requires a fundamental architectural change. These are the stability backbones.
*   **Approach:** Prefer **additive** changes. Create new Worklets, new Nodes, and new Components rather than rewriting existing functional ones.

### Directive Beta: "The Temporal Void"
*   **Assumption:** You are working in an environment where the dev server is **NOT** running. You cannot "see" the app running.
*   **Consequence:** You must rely entirely on static analysis, code reading, and mental models of the "Trinity" architecture.
*   **Validation:** You cannot visually verify changes. You MUST rely on:
    1.  `npm run typecheck` (if available) or checking for TS errors.
    2.  Writing and running unit tests (`npm run test`).

## 2. Architectural Integrity
*   **The Trinity Pattern:** Every audio effect requires three distinct parts:
    1.  **DSP (Worklet):** Raw JS in `src/audio/worklets/`. Must rely on `dsp-helpers.js` for math.
    2.  **Interface (Node):** TypeScript class extending `AudioWorkletNode` (or Native Node wrapper). Exposes typed parameters.
    3.  **Control (UI/Store):** A Zustand module type definition and a React component.
*   **Unidirectional Data Flow:**
    *   `UI` -> `Zustand Store` -> `AudioEngine` -> `AudioNode` -> `AudioWorklet`.
    *   *Never* modify AudioNodes directly from React components.

## 3. DSP Implementation Guidelines
*   **No WASM (Yet):** Stick to pure JavaScript classes in `dsp-helpers.js`.
*   **Parameter Smoothing:** All `AudioParam` updates should use `setTargetAtTime` (k-rate) or `setValueAtTime` (immediate).
*   **Memory Safety:** Do not create objects inside the `process()` loop. Pre-allocate arrays in the constructor.
*   **Offline Compatibility:** All Worklets and Nodes must be capable of running in an `OfflineAudioContext`.

## 4. Testing Strategy
*   **Unit Tests:** Test DSP math in `dsp-helpers.test.js`.
*   **Integration Tests:** Test the *Store* (`useAudioStore.test.ts`) to verify rack state updates.
*   **UI Tests:** Test `EffectsRack.tsx` to verify module rendering. *Mock `AudioContext` and `AnalyserNode` methods* to prevent Canvas/Web Audio crashes in JSDOM.

## 5. How to Add a New Effect (Checklist)
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

## 6. Common Pitfalls
*   **Source Management:** Always check `useAudioStore.getState().assets` for blobs (IRs) or `sourceBuffer` for the main track.
*   **Offline Context:** `OfflineAudioContext` is separate from `AudioContext`. You must `addModule()` to *both* and recreate nodes for *both*.
*   **Type Safety:** Use `RackModuleType` union to ensure exhaustive checks in factories.

---

> This *rough*  blueprint "template" is to be used as reference for creating and/or implementing project updates from Jules blueprint .md files.
> Outlined is workflow specifications to assist Jules asynchronous AI coding agent in implementing project updates, due to its asynchronous nature.
> for blueprint as input: "Workflow Constraints" outlined are **non-negotiable**. Other aspects of blueprint are open to interpretation.

# 🤖 Jules Asynchronous Blueprint: [Blueprint Name]

**Context:** [Project Name]
**Current Agenda:** [Reference to main Roadmap Phase]
**Asynchronous Intent:** [The specific goal of this batch, e.g., "Rapid Scaffolding", "Content Gen"]

## 🔒 Workflow Constraints
1.  **Temporal Void:** Tasks must be implementable *now* or *later* with zero friction.
2.  **Decoupled:** No direct dependencies on active feature branches or volatile React state.
3.  **Additive:** Code should exist in new files/folders (`lib/`, `utils/`, `assets/`) or standalone classes.

## 📋 Task Manifest

### Category [X]: [Category Name]
*(Description of category focus)*

**[Task #] - [Task Name]**
* **The Ask:** [Specific instruction on what to code/generate. e.g., "Write a standalone class..."]
* **The Hook:** [Explanation of where/how this integrates into the User Roadmap later. "Essential for Phase X..."]
* **Artifact:** [Expected file output, e.g., `src/utils/math.ts`]

*(Repeat for 10 tasks)*

## 🚀 Selection Guide
* **For Immediate User Value:** Pick tasks [X, Y, Z].
* **For Long-term Architecture:** Pick tasks [A, B, C].

## Jules Context (Async Implementation Agent)

### Role
You are the implementation specialist for **Sonic Forge**. Your primary focus is executing "Blueprints" found in `blueprints/jules/`.

### Operational Directives
1.  **Read the Blueprints:** Before starting any task, look for relevant `.md` files in `blueprints/jules/`. These contain the architecture and step-by-step plans.
2.  **Trinity Pattern Compliance:** When modifying audio modules, you MUST update all three layers:
    *   **DSP:** `src/audio/worklets/*-processor.js`
    *   **Node:** `src/audio/worklets/*Node.ts`
    *   **UI:** `src/components/rack/*Unit.tsx`
3.  **AudioEngine Integrity:** The `AudioEngine` (src/audio/context.ts) is the critical core.
    *   **Never** leave the engine in a broken state where `init()` fails.
    *   **Always** verify `rebuildGraph` logic if you touch connection routing.
4.  **Dependency Handling:** If a blueprint requires a new package (e.g., `standardized-audio-context`), install it immediately and update `package.json` context.

### Current High-Priority Targets
*   **Refactor Audio Graph:** Move from "stop-the-world" rebuilding to smart diffing/patching (Blueprint: `refactor-audio-graph-logic.md`).
*   **Standardize Audio Context:** Improve browser compatibility (Blueprint: `integrate-standardized-audio-context.md`).
*   **WASM DSP:** Explore performance improvements (Blueprint: `proof-of-concept-wasm-dsp.md`).