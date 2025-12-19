import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export class FeedbackDelayNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'feedback-delay-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { delayTime: 0.5, feedback: 0.3, wet: 0.5 }
        });
    }
    setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
