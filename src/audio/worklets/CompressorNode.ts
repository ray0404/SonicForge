import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export class CompressorNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'compressor-processor', {
            numberOfInputs: 2,
            numberOfOutputs: 1,
            parameterData: { threshold: -24, ratio: 4, attack: 0.01, release: 0.1, knee: 5, makeupGain: 0, mode: 0, mix: 1 }
        });
    }
    setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
