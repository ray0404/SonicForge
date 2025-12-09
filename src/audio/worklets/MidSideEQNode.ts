export class MidSideEQNode extends AudioWorkletNode {
    constructor(context: AudioContext) {
      super(context, 'midside-eq-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2], // Stereo
        parameterData: {
          midGain: 0,
          midFreq: 1000,
          sideGain: 0,
          sideFreq: 1000
        }
      });
    }
  
    setParam(paramName: 'midGain' | 'midFreq' | 'sideGain' | 'sideFreq', value: number) {
      const param = this.parameters.get(paramName);
      if (param) {
        param.setTargetAtTime(value, this.context.currentTime, 0.01);
      }
    }
  }
