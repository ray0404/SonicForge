// Remove import as we inline logic
// import { Saturator } from './lib/saturation.js';

class SaturationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // this.saturator = new Saturator(); // Removed wrapper
  }

  static get parameterDescriptors() {
    return [
      { name: 'drive', defaultValue: 0.0, minValue: 0.0, maxValue: 10.0 },
      { name: 'type', defaultValue: 1, minValue: 0, maxValue: 2 }, // 0: Tape, 1: Tube, 2: Fuzz
      { name: 'outputGain', defaultValue: 0.0, minValue: -12.0, maxValue: 12.0 },
      { name: 'mix', defaultValue: 1.0, minValue: 0.0, maxValue: 1.0 }
    ];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const drive = parameters.drive;
    const typeParam = parameters.type;
    const outGain = parameters.outputGain;
    const mixParam = parameters.mix;

    if (!input || !input[0] || !output) return true;

    const channelCount = input.length;

    // Pre-calculate constants for optimization
    // ln(10) / 20 ≈ 0.115129
    const DB_TO_LINEAR_COEFF = 0.11512925464970228;

    for (let channel = 0; channel < channelCount; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      const length = inputChannel.length;

      const isDriveConst = drive.length === 1;
      const isTypeConst = typeParam.length === 1;
      const isGainConst = outGain.length === 1;
      const isMixConst = mixParam.length === 1;

      // Initialize base variables
      let currentDrive = drive[0];
      let currentGainDb = outGain[0];
      let currentMix = mixParam[0];
      let currentTypeInt = 1; // Default to Tube (1)

      // Pre-calculate constants outside the loop
      let linearGain = 1.0;
      if (isGainConst) {
        // Optimization: Use Math.exp instead of Math.pow(10, x/20)
        linearGain = Math.exp(currentGainDb * DB_TO_LINEAR_COEFF);
      }

      if (isTypeConst) {
         currentTypeInt = Math.round(typeParam[0]);
      }

      // Optimization: Hoist mode check if constant to specialized loops?
      // For now, inlining inside one loop is a big enough win over function call overhead.
      // Doing 3 separate loops might be faster but increases code size significantly.

      for (let i = 0; i < length; i++) {
        // Update per-sample parameters if not constant
        if (!isDriveConst) currentDrive = drive[i];
        if (!isMixConst) currentMix = mixParam[i];
        
        if (!isGainConst) {
           currentGainDb = outGain[i];
           // Optimization: Math.exp is faster than Math.pow
           linearGain = Math.exp(currentGainDb * DB_TO_LINEAR_COEFF);
        }

        if (!isTypeConst) {
            currentTypeInt = Math.round(typeParam[i]);
        }

        // Apply input gain (Drive)
        // input * (1.0 + drive) so 0 drive = unity gain
        const x = inputChannel[i] * (1.0 + currentDrive);
        let saturated;

        // Inlined Saturation Logic (replaces Saturator.process)
        if (currentTypeInt === 1) { // Tube
            if (x >= 0) {
                saturated = Math.tanh(x);
            } else {
                saturated = x / (1 + Math.abs(x));
            }
        } else if (currentTypeInt === 2) { // Fuzz
            if (x > 1.0) saturated = 1.0;
            else if (x < -1.0) saturated = -1.0;
            else saturated = x;
        } else { // Tape (0) or default
            saturated = Math.tanh(x);
        }

        const wet = saturated * linearGain;
        outputChannel[i] = inputChannel[i] * (1 - currentMix) + wet * currentMix;
      }
    }

    return true;
  }
}

registerProcessor('saturation-processor', SaturationProcessor);
