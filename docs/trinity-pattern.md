# The Trinity Pattern: A Design Philosophy

## 1. Introduction
The **Trinity Pattern** is the defining architectural constraint of the Sonic Forge codebase. It is not just a folder structure; it is a rigorous contract that enforces the separation of **UI** (View), **Control** (Controller), and **DSP** (Model).

This pattern was born from the specific constraints of the Web Audio API:
1.  **Thread Boundaries:** Code runs in two separate worlds (Main Thread vs. Audio Thread).
2.  **Timing Constraints:** The UI operates at 60Hz (16ms), while Audio operates at sample rate (0.02ms).
3.  **Serialization:** Communication between threads requires serialization (postMessage), which is slow.

The Trinity Pattern creates a predictable, type-safe standard for crossing these boundaries.

---

## 2. The Three Pillars
Every "Module" in the application (e.g., Compressor, EQ, Delay) must consist of exactly three files.

### 2.1 The Processor (The "Brain")
**Context:** `AudioWorkletGlobalScope` (Audio Thread)
**Role:** Pure Signal Processing.

This is the physics engine. It receives a buffer of 128 samples and transforms them.
- **Rule #1:** No allocations. `new Float32Array` inside `process()` is forbidden. It causes Garbage Collection pauses which sound like "clicks."
- **Rule #2:** No closure state. All state must be stored in `this.channelState` to persist between blocks.
- **Rule #3:** Parameter Agnosticism. The processor doesn't know if a parameter is constant or automated; it just iterates the array.

### 2.2 The Node (The "Bridge")
**Context:** `Window` (Main Thread)
**Role:** API Abstraction.

This class wraps the raw `AudioWorkletNode` to provide a friendly, typed API for the Audio Engine.
- **Rule #1:** Type Safety. It must strictly define the parameters it accepts.
- **Rule #2:** Parameter Smoothing. It is responsible for calling `setTargetAtTime` to prevent zipper noise when the UI changes a value.
- **Rule #3:** Message Handling. It translates low-level `port.onmessage` events (like "gain reduction: 0.5") into clean properties or events that the UI can poll.

### 2.3 The Unit (The "Face")
**Context:** React Render Tree (Main Thread)
**Role:** User Interaction.

This is the visual representation.
- **Rule #1:** Store-Driven. It reads its configuration strictly from the Zustand store, never from the Node directly.
- **Rule #2:** Atomic Design. It is composed of reusable atoms (`Knob`, `Toggle`, `Meter`) to ensure visual consistency.
- **Rule #3:** High Performance. Meters and Visualizers must use `canvas` or `requestAnimationFrame` to avoid React render cycles.

---

## 3. Implementation Guide: Creating a New Module

### Step 1: The DSP (`src/audio/worklets/my-effect-processor.js`)
```javascript
import { AudioWorkletProcessor } from "./lib/processor-base"; // Hypothetical

class MyEffectProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'drive', defaultValue: 0 }];
  }

  process(inputs, outputs, parameters) {
    // 1. Get buffers
    const input = inputs[0];
    const output = outputs[0];
    const drive = parameters.drive;
    
    // 2. Process (Optimization: Check if mono/stereo)
    for (let channel = 0; channel < input.length; channel++) {
        // ... DSP math ...
    }
    return true; // Keep alive
  }
}
registerProcessor('my-effect-processor', MyEffectProcessor);
```

### Step 2: The Node (`src/audio/worklets/MyEffectNode.ts`)
```typescript
export class MyEffectNode extends AudioWorkletNode {
  constructor(context: BaseAudioContext) {
    super(context, 'my-effect-processor');
  }

  // The Engine calls this. 
  // We handle the "how" (smoothing).
  setParam(key: string, value: number) {
    const param = this.parameters.get(key);
    if (param) {
      // 10ms smoothing to prevent clicks
      param.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
  }
}
```

### Step 3: The Unit (`src/components/rack/MyEffectUnit.tsx`)
```tsx
export const MyEffectUnit = ({ id, parameters }: Props) => {
    const { updateParam } = useAudioStore();
    
    return (
        <ModuleShell title="Distortion">
            <Knob 
                value={parameters.drive} 
                onChange={v => updateParam(id, 'drive', v)} 
            />
        </ModuleShell>
    );
};
```

---

## 4. Why This Matters
Without this pattern, audio code tends to become "Spaghetti Code":
- **UI Code touching Audio Nodes:** Leads to memory leaks (nodes not disconnecting) and race conditions (UI updating a node that hasn't loaded yet).
- **DSP Logic in Main Thread:** Using `ScriptProcessorNode` (deprecated) causes the audio to stutter whenever the UI re-renders or the browser scrolls.
- **Hardcoded Parameters:** Making it impossible to create presets or save/load projects.

The Trinity Pattern solves all of these by strictly enforcing boundaries.