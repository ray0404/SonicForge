export interface DitheringOptions {
    bitDepth?: number;
}
  
export class DitheringNode extends AudioWorkletNode {
    constructor(context: AudioContext) {
        super(context, 'dithering-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'bitDepth', defaultValue: 24, minValue: 8, maxValue: 32 }
        ];
    }

    setParam(param: keyof DitheringOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
