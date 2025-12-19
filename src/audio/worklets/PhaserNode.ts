import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export class PhaserNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'phaser-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { stages: 4, frequency: 0.5, baseFrequency: 1000, octaves: 2, wet: 0.5 }
        });
    }
    setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
