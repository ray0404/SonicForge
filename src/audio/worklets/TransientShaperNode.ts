export class TransientShaperNode extends AudioWorkletNode {
    constructor(context: AudioContext) {
        super(context, 'transient-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: {
                attackGain: 0,
                sustainGain: 0,
            },
        });
    }

    setParam(param: 'attackGain' | 'sustainGain', value: number) {
        const paramNode = this.parameters.get(param);
        if (paramNode) {
            paramNode.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
