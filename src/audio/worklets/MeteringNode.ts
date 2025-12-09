export class MeteringNode extends AudioWorkletNode {
    public momentary: number = -100;
    public shortTerm: number = -100;
  
    constructor(context: AudioContext) {
      super(context, 'lufs-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
  
      this.port.onmessage = (event) => {
        if (event.data.type === 'meter') {
          this.momentary = event.data.momentary;
          this.shortTerm = event.data.shortTerm;
        }
      };
    }
  }
