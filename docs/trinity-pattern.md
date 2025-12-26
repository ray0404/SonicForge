# The Trinity Pattern

The **Trinity Pattern** is the core architectural principle of Sonic Forge. It ensures a strict separation of concerns between audio processing, main-thread control, and the user interface. Every audio module in Sonic Forge must be implemented as three distinct layers.

## 1. The Processor (DSP Layer)
**Location:** `src/audio/worklets/[name]-processor.js`

The Processor runs on the high-priority **Audio Thread**. It performs the actual mathematical signal processing.

### Key Requirements:
- **Dependency-Free:** Must be pure JavaScript. No imports from the main thread.
- **Memory Efficient:** Avoid object allocation in the `process()` loop to prevent Garbage Collection pauses.
- **Sample-Accurate:** Use `AudioParam` values for smooth, glitch-free automation.

### Example:
```javascript
class MyGainProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{ name: 'gain', defaultValue: 1.0 }];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const gain = parameters.gain;

        for (let channel = 0; i < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            
            for (let i = 0; i < inputChannel.length; i++) {
                // If gain is automated, gain.length > 1
                const g = gain.length > 1 ? gain[i] : gain[0];
                outputChannel[i] = inputChannel[i] * g;
            }
        }
        return true;
    }
}
registerProcessor('my-gain-processor', MyGainProcessor);
```

---

## 2. The Node (Interface Layer)
**Location:** `src/audio/worklets/[Name]Node.ts`

The Node runs on the **Main Thread**. It acts as the bridge between the React UI and the AudioWorkletProcessor.

### Key Requirements:
- **Type Safety:** Extends `AudioWorkletNode` and defines parameter interfaces.
- **Communication:** Handles `port.postMessage` for non-AudioParam data (like meters or IR buffers).
- **Abstraction:** Provides a clean `setParam()` method for the Audio Engine to call.

### Example:
```typescript
import { AudioWorkletNode, IAudioContext } from "standardized-audio-context";

export class MyGainNode extends AudioWorkletNode<IAudioContext> {
    constructor(context: IAudioContext) {
        super(context, 'my-gain-processor');
    }

    setParam(name: string, value: number) {
        const param = this.parameters.get(name);
        if (param) {
            param.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
```

---

## 3. The Unit (UI Layer)
**Location:** `src/components/rack/[Name]Unit.tsx`

The Unit is a **React Component**. It provides the controls and visualizations for the module.

### Key Requirements:
- **Reactive:** Uses `useAudioStore` to read and update parameters.
- **Consistent:** Wraps controls in a `ModuleShell` for a unified look.
- **Decoupled:** Never interacts with the `AudioWorkletNode` directly; always goes through the Store.

### Example:
```tsx
import { ModuleShell } from "../ui/ModuleShell";
import { Knob } from "../ui/Knob";
import { useAudioStore } from "@/store/useAudioStore";

export const MyGainUnit = ({ id }: { id: string }) => {
    const { parameters, updateModuleParam } = useAudioStore();
    const gain = parameters.gain ?? 1.0;

    return (
        <ModuleShell id={id} title="My Gain">
            <Knob 
                label="Gain"
                value={gain}
                onChange={(v) => updateModuleParam(id, 'gain', v)}
                min={0}
                max={2}
            />
        </ModuleShell>
    );
};
```

## Summary of Data Flow
1. **User** turns a knob in the **Unit (UI)**.
2. **Unit** calls `updateModuleParam()` in the **Zustand Store**.
3. **Store** updates the state and calls `audioEngine.updateModuleParam()`.
4. **AudioEngine** finds the **Node (Interface)** and calls `node.setParam()`.
5. **Node** schedules an automation on the `AudioParam`.
6. **Processor (DSP)** receives the new value on the next audio block.
