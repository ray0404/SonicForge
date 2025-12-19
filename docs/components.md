# Component Deep Dive

SonicForge is built on the **Trinity Pattern**, ensuring separation of concerns between UI, Control Logic, and DSP.

## The Trinity Pattern

Every audio effect module consists of three distinct files:

| Layer | File Example | Responsibility |
| :--- | :--- | :--- |
| **DSP (Worker)** | `limiter-processor.js` | Runs on Audio Thread. Performs math on samples. Extends `AudioWorkletProcessor`. |
| **Bridge (Node)** | `LimiterNode.ts` | Runs on Main Thread. Bridges UI and DSP. Extends `AudioWorkletNode`. |
| **UI (React)** | `LimiterUnit.tsx` | Visual representation. Handles user input. Renders Knobs/Meters. |

### 1. DSP Layer (`*-processor.js`)

Located in `src/audio/worklets/`. This is raw JavaScript (no DOM access).

*   **Inputs:** `inputs[][]` (Channels -> Samples)
*   **Parameters:** `parameters` (AudioParams like Threshold, Gain)
*   **Output:** `process()` returns `true` to keep alive.

**Example (Limiter Logic):**
> The limiter uses a **Lookahead Buffer** (`DelayLine`) and an **Envelope Follower**. It analyzes the input signal `N` milliseconds in the future (relative to the output) to ramp down gain *before* a peak occurs, preventing clipping.

### 2. Bridge Layer (`*Node.ts`)

Located in `src/audio/worklets/`.

*   **Purpose:** Typed wrapper around the `AudioWorkletNode`.
*   **Key Method:** `setParam(key, value)` - interpolates values using `setTargetAtTime` to prevent clicking (zipper noise).
*   **Communication:** Listens to `this.port.onmessage` for debug data (e.g., gain reduction meters) from the processor.

### 3. UI Layer (`*Unit.tsx`)

Located in `src/components/rack/`.

*   **State:** Controlled via props (`module.parameters`).
*   **Updates:** Calls `onUpdate` which dispatches to Zustand.
*   **Visuals:** Often includes a `<canvas>` loop for real-time visualization (e.g., GR meter).

## Audio Engine (`src/audio/context.ts`)

The `AudioEngine` class is a **Singleton**.

*   **Initialization:** Lazy loaded via `init()`. Loads all Worklet modules via `addModule`.
*   **Routing:** Manages `nodeMap` (Map<ModuleID, AudioNode>).
*   **RebuildGraph:** A critical method that:
    1.  Disconnects `RackInput`.
    2.  Iterates through the `Rack` state.
    3.  Instantiates missing nodes or reuses existing ones.
    4.  Chains them together: `PrevNode.connect(CurrentNode)`.
    5.  Connects the tail to `RackOutput`.

**Offline Rendering:**
The engine supports `renderOffline`. It spawns a temporary `OfflineAudioContext`, re-instantiates the entire graph (mirroring the real-time one), and processes the audio faster-than-realtime to generate a WAV file.
