// src/audio/worklets/{{PascalName}}Node.ts

import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export class {{PascalName}}Node extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, '{{kebab-name}}-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: {
                mix: 1,
                // Add defaults for other parameters here
            }
        });
    }

    /** Updates a module parameter with smoothing to prevent clicking. */
    setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            // 10ms smoothing time constant
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
