import { LinkwitzRiley4 } from './lib/crossover.js';

class StereoImagerProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'lowFreq', defaultValue: 150, minValue: 20, maxValue: 1000 },
            { name: 'highFreq', defaultValue: 2500, minValue: 1000, maxValue: 10000 },
            { name: 'widthLow', defaultValue: 0.0, minValue: 0.0, maxValue: 2.0 },
            { name: 'widthMid', defaultValue: 1.0, minValue: 0.0, maxValue: 2.0 },
            { name: 'widthHigh', defaultValue: 1.2, minValue: 0.0, maxValue: 2.0 },
            { name: 'bypass', defaultValue: 0, minValue: 0, maxValue: 1 }
        ];
    }

    constructor() {
        super();
        this.channelState = [];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output) return true;

        const bypass = parameters.bypass.length > 1 ? parameters.bypass[0] : parameters.bypass[0];
        if (bypass > 0.5) {
            for (let ch = 0; ch < input.length; ch++) {
                output[ch].set(input[ch]);
            }
            return true;
        }

        // Initialize crossover state per channel
        // We need 2 crossovers per channel to split into 3 bands?
        // Actually, crossover is usually mono-in -> low/high out.
        // For stereo input, we need a crossover for Left and a crossover for Right.
        
        // 3-Band Split Logic:
        // Signal -> Crossover1 (Low / MidHigh)
        // MidHigh -> Crossover2 (Mid / High)
        
        if (this.channelState.length < input.length) {
            for (let i = this.channelState.length; i < input.length; i++) {
                this.channelState.push({
                    xover1: new LinkwitzRiley4(sampleRate, 150),
                    xover2: new LinkwitzRiley4(sampleRate, 2500)
                });
            }
        }

        const lowFreq = parameters.lowFreq[0];
        const highFreq = parameters.highFreq[0];
        const widthLow = parameters.widthLow[0];
        const widthMid = parameters.widthMid[0];
        const widthHigh = parameters.widthHigh[0];

        // Prepare temporary buffers for bands (Low L/R, Mid L/R, High L/R)
        // We process sample-by-sample for stability with these IIR filters
        
        const L = input[0];
        const R = input[1];
        const outL = output[0];
        const outR = output[1];

        // Safety for Mono inputs (though mastering is usually stereo)
        if (!R) {
            outL.set(L);
            return true;
        }

        const stateL = this.channelState[0];
        const stateR = this.channelState[1];

        // Update Cutoffs
        if (stateL.xover1.cutoffFrequency !== lowFreq) {
            stateL.xover1.setCutoff(lowFreq);
            stateR.xover1.setCutoff(lowFreq);
        }
        if (stateL.xover2.cutoffFrequency !== highFreq) {
            stateL.xover2.setCutoff(highFreq);
            stateR.xover2.setCutoff(highFreq);
        }

        for (let i = 0; i < L.length; i++) {
            const lIn = L[i];
            const rIn = R[i];

            // 1. Split Bands
            const splitL1 = stateL.xover1.process(lIn); // low, high (midhigh)
            const splitR1 = stateR.xover1.process(rIn);

            const splitL2 = stateL.xover2.process(splitL1.high); // low (mid), high
            const splitR2 = stateR.xover2.process(splitR1.high);

            const lLow = splitL1.low;
            const rLow = splitR1.low;

            const lMid = splitL2.low;
            const rMid = splitR2.low;

            const lHigh = splitL2.high;
            const rHigh = splitR2.high;

            // 2. M/S Processing per Band
            
            // Helper for Width
            const processWidth = (l, r, width) => {
                if (width === 1.0) return [l, r];
                const m = (l + r) * 0.5;
                const s = (l - r) * 0.5;
                const sNew = s * width;
                return [m + sNew, m - sNew];
            };

            const [lL, lR] = processWidth(lLow, rLow, widthLow);
            const [mL, mR] = processWidth(lMid, rMid, widthMid);
            const [hL, hR] = processWidth(lHigh, rHigh, widthHigh);

            // 3. Summation
            outL[i] = lL + mL + hL;
            outR[i] = lR + mR + hR;
        }

        return true;
    }
}

registerProcessor('stereo-imager-processor', StereoImagerProcessor);
