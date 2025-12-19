import { BiquadFilter, EnvelopeFollower } from './lib/dsp-helpers.js';

class DynamicEQProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000 },
      { name: 'Q', defaultValue: 1.0, minValue: 0.1, maxValue: 100 },
      { name: 'gain', defaultValue: 0, minValue: -40, maxValue: 40 }, 
      { name: 'threshold', defaultValue: -20, minValue: -100, maxValue: 0 },
      { name: 'ratio', defaultValue: 1, minValue: 1, maxValue: 20 },
      { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 1 },
      { name: 'release', defaultValue: 0.1, minValue: 0.001, maxValue: 1 }
    ];
  }

  constructor() {
    super();
    this.channelState = [];
    this.framesProcessed = 0;
  }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const scInput = inputs[1];
        const output = outputs[0];
        if (!input || !output) return true;

        if (this.channelState.length < input.length) {
            for (let i = this.channelState.length; i < input.length; i++) {
                this.channelState.push({
                    filterMain: new BiquadFilter(),
                    filterDetector: new BiquadFilter(),
                    envelope: new EnvelopeFollower()
                });
            }
        }

        const frequency = parameters.frequency[0];
        const gain = parameters.gain[0];
        const Q = parameters.Q[0];
        const threshold = parameters.threshold[0];
        const ratio = parameters.ratio[0];
        const attack = parameters.attack[0];
        const release = parameters.release[0];

        for (let ch = 0; ch < input.length; ch++) {
            const inCh = input[ch];
            const outCh = output[ch];
            const scCh = (scInput && scInput[ch] && scInput[ch].length > 0) ? scInput[ch] : inCh;
            const state = this.channelState[ch];

            state.filterMain.setParams(frequency, gain, Q, sampleRate, 'peaking');
            state.filterDetector.setParams(frequency, 0, Q, sampleRate, 'bandpass');
            state.envelope.setParams(attack, release, sampleRate);

            for (let i = 0; i < inCh.length; i++) {
                const sample = inCh[i];
                const scSample = scCh[i];

                // 1. Detection
                const detector = state.filterDetector.process(scSample);
                const env = state.envelope.process(detector);
                const envDb = 20 * Math.log10(env + 1e-6);

                // 2. Gain Calculation
                let reductionDb = 0;
                if (envDb > threshold) {
                    reductionDb = (envDb - threshold) * (1 - 1 / ratio);
                }

                const currentGain = gain - reductionDb;
                state.filterMain.setGain(currentGain);

                // 3. Apply
                outCh[i] = state.filterMain.process(sample);
            }
        }

        return true;
    }
}

registerProcessor('dynamic-eq-processor', DynamicEQProcessor);
