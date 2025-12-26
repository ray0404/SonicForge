# Concepts & Abstraction Layers

## 1. Introduction
Sonic Forge is designed around a rigorous set of architectural principles that prioritize performance, type safety, and maintainability. Audio programming is unique in that it requires synchronizing two completely different execution contexts: the **Main Thread** (User Interface, Logic, State) and the **Audio Thread** (Signal Processing).

A failure to respect the boundaries between these threads results in glitches, audio dropouts, and a frozen UI. This document outlines the abstraction layers Sonic Forge uses to bridge this gap safely and efficiently.

---

## 2. The Three-Layer Hierarchy
The application is structured into three vertical layers of abstraction, moving from high-level user intent to low-level signal math.

### Layer 1: The "Intent" Layer (State & UI)
**Context:** Main Thread
**Technologies:** React, Zustand, TypeScript

This layer represents the *user's desire*. It is purely descriptive.
- **State as Truth:** The Zustand store (`useAudioStore`) is the single source of truth for the application. It holds a JSON-serializable description of the entire project (e.g., "There is a Limiter at position 1 with a threshold of -6dB").
- **Decoupling:** This layer knows *nothing* about the Web Audio API. It does not hold references to `AudioContext`, `AudioNode`, or `ArrayBuffer`. It only deals with IDs, strings, and numbers.
- **Optimistic Updates:** When a user turns a knob, the state updates immediately to ensure the UI feels responsive (60fps), regardless of how busy the underlying audio engine is.

### Layer 2: The "Orchestration" Layer (Audio Engine)
**Context:** Main Thread (Bridging to Native C++)
**Technologies:** `standardized-audio-context`, `AudioEngine` Class

This layer translates *intent* into *imperative commands*.
- **The Graph Manager:** The `AudioEngine` singleton monitors the Zustand state. When the state changes (e.g., a module is added), the engine calculates the minimum number of graph operations required to reflect that change.
- **Node Lifecycle:** It manages the creation, connection, and destruction of `AudioNode` instances. It ensures that nodes are not garbage collected while in use and are properly cleaned up when removed.
- **Automation Scheduling:** It converts simple parameter values (e.g., "Gain = 0.5") into time-based audio events (`gain.setTargetAtTime(0.5, currentTime, 0.01)`), ensuring smooth, click-free transitions.

### Layer 3: The "Processing" Layer (DSP)
**Context:** AudioWorklet Thread
**Technologies:** Pure JavaScript (ES6), Web Assembly (Future)

This layer executes the *physics* of the sound.
- **Real-Time Constraint:** This code runs in a high-priority thread that must calculate 128 samples every ~2.9ms (at 44.1kHz). If it misses this deadline, the audio glitches (buffer underrun).
- **Isolation:** It has no access to the DOM, `console.log` (mostly), or the main heap. It communicates with the outside world strictly through `AudioParam` arrays (for sample-accurate automation) and the `MessagePort` (for asynchronous data like metering).
- **Math-Heavy:** This is where the actual Biquad Filters, FFTs, and delay lines live.

---

## 3. Data Flow Architecture

### 3.1 Unidirectional Control Flow
Control signals flow strictly **Down**.
> UI Event -> Store Update -> Engine Trigger -> Node Parameter -> DSP Processor

This prevents feedback loops where the UI waits for the audio engine, causing lag.

### 3.2 Asynchronous Feedback Flow
Analysis data flows **Up** asynchronously.
> DSP Processor -> MessagePort (PostMessage) -> Node Event Listener -> React State (Throttled) -> UI Render

Crucially, the DSP thread *never* blocks waiting for the UI. It "fire and forgets" metering data. The UI picks up this data when it can, often throttled to 30fps or 60fps to save main-thread CPU.

---

## 4. Key Abstractions

### 4.1 The "Rack" Metaphor
Sonic Forge treats the signal chain as a linear "Rack" of modules.
- **Abstraction:** An array of `RackModule` objects.
- **Implementation:** A series chain of `AudioWorkletNode`s connected Input -> Output.
- **Benefit:** Simplifies the mental model for the user and the routing logic for the developer.

### 4.2 The "Trinity" Pattern
To manage the complexity of the three layers, we enforce the **Trinity Pattern** for every module type.
- **Unit (UI):** Visual component.
- **Node (Orchestrator):** Interface class.
- **Processor (DSP):** Worker logic.
(See `docs/trinity-pattern.md` for a deep dive).

### 4.3 Asset Management
- **Description:** Audio files (IRs, Samples) are heavy resources.
- **Abstraction:** The Store holds light references (UUIDs). The `AudioEngine` maintains a `Map<UUID, AudioBuffer>`.
- **Loading:** Assets are loaded asynchronously from IndexedDB, decoded, and cached in the Engine. The Engine then "injects" the buffer into the relevant Node (e.g., `ConvolutionNode`).

---

## 5. Thread Safety Principles
1.  **Immutability:** The Store state is immutable. This allows the Engine to quickly compare `oldState` vs `newState` (Reference Equality) to determine if a re-render of the graph is needed.
2.  **No Shared Mutable State:** The Main Thread and Audio Thread share *no* memory (except for specific `SharedArrayBuffer` implementations which we currently avoid for compatibility). All communication is via message passing.
3.  **Parameter Smoothing:** Never set a value instantly (`setValueAtTime`). Always use `setTargetAtTime` to smooth the transition. This acts as a low-pass filter on the control signal, preventing "zipper noise" caused by the stepping of digital values.
