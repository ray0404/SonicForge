# SoundForge Audio Suite

The 'idea' behind SoundForge is a cross-compatible suite of powerful audio processing tools, built within a robust integrated framework which primes individual components, as well as SoundForge as a whole, to be ran individually, in complex routing chains/"racks", or to be implemented in other audio-related projects; high-level tools and processing, developed with readily available 'resources'.

## First 'Dev Run'

Here is a robust, high-level implementation plan designed for the `sonic-forge-template` environment, specifically tailored for Termux/mobile workflow (heavy logging, no GUI devtools dependence).

- This file blueprints the design and implementation of the first couple of audio processing components (dynamic EQ and transient shaper), along with the necessary logic, handling, and DSP engine needed to implement subsequent processing modules/tools. 

### Phase 1: The "Audio Suite" Architecture (Foundation)

Before building the Dynamic EQ, we must refactor the template's single-node graph into a modular "Rack" system. This ensures continuity for future plugins.

**1. Define the Rack Data Structure**
In `src/store/useAudioStore.ts`, replace the singular `dspGain` with a robust node list.

  * **Goal:** Allow arbitrary ordering of effects (e.g., DynEQ -\> TransientShaper).
  * **Implementation:**
    ```typescript
    type RackModuleType = 'DYNAMIC_EQ' | 'TRANSIENT_SHAPER' | 'LIMITER';

    interface RackModule {
        id: string;
        type: RackModuleType;
        bypass: boolean;
        parameters: Record<string, number>; // Generic param storage
    }

    // Update Store State
    interface AudioState {
        rack: RackModule[];
        addModule: (type: RackModuleType) => void;
        removeModule: (id: string) => void;
        updateModuleParam: (id: string, param: string, value: number) => void;
        // ... keep existing transport state (isPlaying, etc)
    }
    ```

**2. Dynamic Audio Graph Manager**
Refactor `AudioEngine` in `src/audio/context.ts` to support hot-swapping nodes.

  * **Concept:** Instead of a hardcoded `connect()`, implement a `rebuildGraph()` method that iterates through the Zustand `rack` state and connects the AudioNodes in series.
  * **Why:** This allows you to add Project 1, 2, 3 later without rewriting the engine core.

-----

### Phase 2: The Shared DSP Library (The "Math" Layer)

Professional audio requires precise math. Since `AudioWorklet` imports can be tricky in some bundlers without extra config, the most robust path for Termux dev is to create a **Shared DSP Header** that you paste/inject into your processor files, or load as a separate module if your Vite config supports it.

**Create `src/audio/worklets/lib/dsp-helpers.js`:**
Implement these classes in raw JavaScript (ES6 class syntax):

1.  **`BiquadFilter`**: A pure JS implementation of a biquad filter (LowPass, HighPass, Peaking, BandPass).
      * *Why:* You need this *inside* the Worklet to filter the sidechain signal for the Dynamic EQ without latency. Native nodes can't easily feed back into Worklet logic sample-by-sample.
2.  **`EnvelopeFollower`**: A class with `attackTime`, `releaseTime`, and a `process(input)` method.
      * *Math:* `y[n] = x[n] + alpha * (y[n-1] - x[n])`.
      * *Usage:* Used by **both** Dynamic EQ (to detect band volume) and Transient Shaper (to detect transients).

-----

### Phase 3: Project 6 - Dynamic EQ Implementation

This is the flagship processor. It combines filtering and dynamics.

**1. The Worklet Processor (`dynamic-eq-processor.js`)**

  * **Parameters:** `frequency`, `Q`, `gain`, `threshold`, `ratio`, `attack`, `release`.
  * **Internal Logic (The `process` loop):**
    1.  **Split:** Duplicate the input sample.
    2.  **Sidechain Path:**
          * Run copy through `BiquadFilter` (BandPass mode) at the target frequency.
          * Run result through `EnvelopeFollower`.
          * Compare Envelope vs `Threshold`.
          * Calculate `GainReduction` factor based on `Ratio`.
    3.  **Main Path:**
          * Run original input through a `BiquadFilter` (Peaking mode).
          * **Crucial Step:** Modulate the `gain` of this peaking filter *per sample* using the `GainReduction` calculated in the sidechain path.
    4.  **Output:** Mix to output.

**2. The Node Wrapper (`DynamicEQNode.ts`)**

  * Extend `AudioWorkletNode`.
  * Map the UI frequency (20Hz - 20kHz) to the Worklet parameters.
  * **Termux Tip:** Add a `debug` port message that sends the current "Gain Reduction" value back to the main thread every 60 frames. This lets you verify it's working via `logger.info()` without needing to hear it perfectly yet.

-----

### Phase 4: Project 5 - Transient Shaper Integration

Because you built the **Shared DSP Library** in Phase 2, this becomes very fast to build.

**1. The Worklet Processor (`transient-processor.js`)**

  * **Parameters:** `attackGain`, `sustainGain`.
  * **Internal Logic:**
    1.  Instantiate **two** `EnvelopeFollower` objects from your library: `fastEnv` (e.g., 10ms) and `slowEnv` (e.g., 100ms).
    2.  `delta = fastEnv.process(input) - slowEnv.process(input)`.
    3.  If `delta > 0`, it's a transient -\> apply `attackGain`.
    4.  If `delta < 0`, it's the body -\> apply `sustainGain`.

-----

### Phase 5: UI Integration & Persistence

**1. The "Rack" Component**

  * Modify `EffectsRack.tsx` to render a list of components based on the `rack` array in the Store.
  * Create `DynamicEQUnit.tsx`:
      * Use the HTML5 Canvas to draw the EQ curve (use the standard biquad frequency response formula).
      * Overlay a dynamic line showing the "Gain Reduction" (received via the debug message set up in Phase 3).

**2. Persistence**

  * The `useProjectPersistence` hook in your template handles Blobs (audio files), but for a "Suite," you need to save **Presets**.
  * Add a `savePreset()` function that serializes the `rack` state to a JSON file and uses `idb-keyval` to save it as `current_session_state`.

### Why this path is "Robust"

1.  **No Native Node Dependencies for Logic:** By implementing filters in JS (inside the Worklet), you avoid the "feedback loop latency" issue of Web Audio API. This ensures your Dynamic EQ is snappy and artifact-free.
2.  **Modular DSP:** If you want to build the **Limiter (Project 1)** later, you just reuse the `EnvelopeFollower` from Phase 2.
3.  **Console-First Debugging:** By baking messaging into the Node wrappers, you can tune your DSP algorithms using text logs in Termux, which is far easier than trying to inspect a compiled WASM module on a phone screen.
