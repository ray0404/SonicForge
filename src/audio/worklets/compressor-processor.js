import { dbToLinear, linearToDb } from './lib/dsp-helpers.js';

class CompressorProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: -24, minValue: -60, maxValue: 0 },
            { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.01, minValue: 0.0001, maxValue: 1 }, // sec
            { name: 'release', defaultValue: 0.1, minValue: 0.001, maxValue: 2 }, // sec
            { name: 'knee', defaultValue: 5, minValue: 0, maxValue: 20 }, // dB or Factor for VarMu
            { name: 'makeupGain', defaultValue: 0, minValue: 0, maxValue: 24 }, // dB
            { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 3 }, // 0=VCA, 1=FET, 2=Opto, 3=VarMu
            { name: 'mix', defaultValue: 1.0, minValue: 0, maxValue: 1 }
        ];
    }

    constructor() {
        super();
        this.channels = [];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output) return true;

        const threshP = parameters.threshold;
        const ratioP = parameters.ratio;
        const attP = parameters.attack;
        const relP = parameters.release;
        const kneeP = parameters.knee;
        const gainP = parameters.makeupGain;
        const modeP = parameters.mode;
        const mixP = parameters.mix;

        // Check for constant parameters (k-rate) optimization
        const isThreshConst = threshP.length === 1;
        const isRatioConst = ratioP.length === 1;
        const isAttConst = attP.length === 1;
        const isRelConst = relP.length === 1;
        const isKneeConst = kneeP.length === 1;
        const isGainConst = gainP.length === 1;
        const isMixConst = mixP.length === 1;

        // Mode is treated as k-rate
        const mode = modeP[0];

        // Hoist constants
        const threshConst = isThreshConst ? threshP[0] : 0;
        const ratioConst = isRatioConst ? ratioP[0] : 0;
        const kneeConst = isKneeConst ? kneeP[0] : 0;
        const gainConst = isGainConst ? dbToLinear(gainP[0]) : 0;
        const mixConst = isMixConst ? mixP[0] : 0;

        // Pre-calculate coefficients if constant
        let attCoeffConst = 0;
        let baseRelCoeffConst = 0;

        if (isAttConst) {
            attCoeffConst = Math.exp(-1.0 / (Math.max(0.0001, attP[0]) * sampleRate));
        }
        if (isRelConst) {
            baseRelCoeffConst = Math.exp(-1.0 / (Math.max(0.001, relP[0]) * sampleRate));
        }

        // Init State
        if (this.channels.length < input.length) {
            for (let i = this.channels.length; i < input.length; i++) {
                this.channels.push({
                    gr: 0, // Current Gain Reduction in dB
                    lastOutput: 0 // For FET feedback
                });
            }
        }

        // Processing
        for (let ch = 0; ch < input.length; ch++) {
            const state = this.channels[ch];
            const inCh = input[ch];
            const outCh = output[ch];

            for (let i = 0; i < inCh.length; i++) {
                const x = inCh[i];

                // 1. Resolve Parameters
                const thresh = isThreshConst ? threshConst : threshP[i];
                const ratioBase = isRatioConst ? ratioConst : ratioP[i];
                const knee = isKneeConst ? kneeConst : kneeP[i];
                const makeup = isGainConst ? gainConst : dbToLinear(gainP[i]);
                const mix = isMixConst ? mixConst : mixP[i];

                let attCoeff = attCoeffConst;
                if (!isAttConst) {
                     attCoeff = Math.exp(-1.0 / (Math.max(0.0001, attP[i]) * sampleRate));
                }

                let baseRelCoeff = baseRelCoeffConst;
                if (!isRelConst) {
                    baseRelCoeff = Math.exp(-1.0 / (Math.max(0.001, relP[i]) * sampleRate));
                }

                // 2. Detection Source
                let detectorIn = x;
                if (mode === 1) { // FET: Feedback
                    detectorIn = state.lastOutput;
                }

                // 3. Level Detection (Peak)
                const absIn = Math.abs(detectorIn);
                const envDb = linearToDb(absIn + 1e-6);

                // 4. Gain Calculation
                let overshoot = envDb - thresh;
                let targetGR = 0;

                if (overshoot > 0) {
                    let r = ratioBase;
                    
                    if (mode === 3) { // VarMu
                        // Ratio_effective = 1.0 + (Overshoot_dB * KneeFactor)
                        r = 1.0 + (overshoot * (knee * 0.1));
                    }
                    
                    // GR = (Input - Thresh) * (1 - 1/R)
                    targetGR = overshoot * (1 - 1 / Math.max(1, r));
                }

                // 5. Ballistics (Attack/Release)
                let relCoeff = baseRelCoeff;

                if (mode === 2) { // Opto: Program Dependent Release
                    // relCoeff = baseRelCoeff * (1 - Envelope(t))
                    const factor = absIn > 1 ? 1 : absIn;
                    relCoeff = baseRelCoeff * (1 - factor);
                }

                // Apply Ballistics
                if (targetGR > state.gr) {
                    // Attack
                    state.gr = attCoeff * state.gr + (1 - attCoeff) * targetGR;
                } else {
                    // Release
                    state.gr = relCoeff * state.gr + (1 - relCoeff) * targetGR;
                }

                // 6. Apply
                // Gain = -GR dB
                const gain = dbToLinear(-state.gr);
                
                const processed = x * gain * makeup;
                outCh[i] = x * (1 - mix) + processed * mix;
                state.lastOutput = processed; // For FET
            }
        }

        return true;
    }
}

registerProcessor('compressor-processor', CompressorProcessor);
