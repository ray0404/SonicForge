import { Saturator } from './lib/saturation.js';

class SaturationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.saturator = new Saturator();
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

    for (let channel = 0; channel < channelCount; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      const length = inputChannel.length;

      // Optimization: if parameters are constant (length 1), read once.
      // Otherwise read per sample.
      const isDriveConst = drive.length === 1;
      const isTypeConst = typeParam.length === 1;
      const isGainConst = outGain.length === 1;
      const isMixConst = mixParam.length === 1;

      let currentDrive = drive[0];
      let currentTypeIdx = typeParam[0]; // Float index
      let currentGainDb = outGain[0];
      let currentMix = mixParam[0];
      let currentType = 'Tube';

      // Optimization: Pre-calculate linear gain if constant
      const constLinearGain = Math.pow(10, currentGainDb / 20);

      if (isTypeConst) {
         const idx = Math.round(currentTypeIdx);
         if (idx === 0) currentType = 'Tape';
         else if (idx === 2) currentType = 'Fuzz';
      }

      for (let i = 0; i < length; i++) {
        if (!isDriveConst) currentDrive = drive[i];

        let linearGain = constLinearGain;
        if (!isGainConst) {
            currentGainDb = outGain[i];
            linearGain = Math.pow(10, currentGainDb / 20);
        }

        if (!isMixConst) currentMix = mixParam[i];
        
        if (!isTypeConst) {
            const idx = Math.round(typeParam[i]);
            if (idx === 0) currentType = 'Tape';
            else if (idx === 2) currentType = 'Fuzz';
            else currentType = 'Tube';
        }

        // Apply input gain (Drive)
        // Saturator.process(input, drive, type)
        // Note: The logic in Saturator applies 'drive' inside. 
        // We pass 1.0 + drive to make 0.0 be unity? 
        // Looking at lib/saturation.js: "x = input * drive". 
        // So drive=1.0 is unity. The parameter is 0-10.
        // Let's assume user knob 0 = unity (1.0) for better UX? 
        // Or knob 0 = 0 (silence)? 
        // "Drive: 0.0 to 10.0". Usually drive adds to unity.
        // Let's interpret Parameter 0 as unity gain (1x). 
        // Actually, standard distortion plugins: Drive 0 = clean.
        // So we'll pass (1.0 + currentDrive).
        
        const saturated = this.saturator.process(inputChannel[i], 1.0 + currentDrive, currentType);

        // Apply Output Gain (using pre-calculated linearGain)
        const wet = saturated * linearGain;
        outputChannel[i] = inputChannel[i] * (1 - currentMix) + wet * currentMix;
      }
    }

    return true;
  }
}

registerProcessor('saturation-processor', SaturationProcessor);
