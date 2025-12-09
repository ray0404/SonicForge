export class LimiterNode extends AudioWorkletNode {
    public currentGainReduction: number = 0;
  
    constructor(context: AudioContext) {
      super(context, 'limiter-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2], // Stereo
        parameterData: {
          threshold: -0.5,
          ceiling: -0.1,
          release: 0.1,
          lookahead: 5
        }
      });
  
      this.port.onmessage = (event) => {
        if (event.data.type === 'debug') {
          this.currentGainReduction = event.data.gainReduction;
        }
      };
    }
  
    setParam(paramName: 'threshold' | 'ceiling' | 'release' | 'lookahead', value: number) {
      const param = this.parameters.get(paramName);
      if (param) {
        param.setTargetAtTime(value, this.context.currentTime, 0.01);
      }
    }
  }
