import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export class TremoloNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'tremolo-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { frequency: 4, depth: 0.5, spread: 0, waveform: 0, mix: 1 }
        });
    }
    setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
