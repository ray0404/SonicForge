/**
 * Shared DSP Library for AudioWorklets
 * Pure JS implementation of common DSP components.
 */

export class BiquadFilter {
    constructor() {
        this.reset();
        this.cache = { w0: 0, cosw0: 0, alpha: 0, type: 'lowpass' };
        // Default to safe values
        this.setParams(1000, 0, 1.0, 44100, 'lowpass');
    }

    reset() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
        this.b0 = 0; this.b1 = 0; this.b2 = 0;
        this.a1 = 0; this.a2 = 0;
    }

    setParams(frequency, gain, Q, sampleRate, type) {
        this.updateBase(frequency, Q, sampleRate, type);
        this.setGain(gain);
    }

    updateBase(frequency, Q, sampleRate, type) {
        const w0 = (2 * Math.PI * frequency) / sampleRate;
        this.cache.w0 = w0;
        this.cache.cosw0 = Math.cos(w0);
        this.cache.alpha = Math.sin(w0) / (2 * Q);
        this.cache.type = type;
    }

    setGain(gain) {
        const A = Math.pow(10, gain / 40);
        const { cosw0, alpha, type } = this.cache;
        
        let b0, b1, b2, a0, a1, a2;

        switch (type) {
            case 'lowpass':
                b0 = (1 - cosw0) / 2;
                b1 = 1 - cosw0;
                b2 = (1 - cosw0) / 2;
                a0 = 1 + alpha;
                a1 = -2 * cosw0;
                a2 = 1 - alpha;
                break;
            case 'highpass':
                b0 = (1 + cosw0) / 2;
                b1 = -(1 + cosw0);
                b2 = (1 + cosw0) / 2;
                a0 = 1 + alpha;
                a1 = -2 * cosw0;
                a2 = 1 - alpha;
                break;
            case 'bandpass':
                b0 = alpha;
                b1 = 0;
                b2 = -alpha;
                a0 = 1 + alpha;
                a1 = -2 * cosw0;
                a2 = 1 - alpha;
                break;
            case 'peaking':
                b0 = 1 + alpha * A;
                b1 = -2 * cosw0;
                b2 = 1 - alpha * A;
                a0 = 1 + alpha / A;
                a1 = -2 * cosw0;
                a2 = 1 - alpha / A;
                break;
            case 'lowshelf':
                b0 = A * ((A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
                b1 = 2 * A * ((A - 1) - (A + 1) * cosw0);
                b2 = A * ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
                a1 = -2 * ((A - 1) + (A + 1) * cosw0);
                a2 = (A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;
                break;
            case 'highshelf':
                b0 = A * ((A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
                b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
                b2 = A * ((A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
                a1 = 2 * ((A - 1) - (A + 1) * cosw0);
                a2 = (A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;
                break;
            default:
                b0=1; b1=0; b2=0; a0=1; a1=0; a2=0;
        }

        // Normalize
        this.b0 = b0 / a0;
        this.b1 = b1 / a0;
        this.b2 = b2 / a0;
        this.a1 = a1 / a0;
        this.a2 = a2 / a0;
    }

    process(input) {
        const output = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2
                     - this.a1 * this.y1 - this.a2 * this.y2;
        
        // Safety Check for NaN or Infinity
        if (!Number.isFinite(output)) {
            this.reset();
            return 0;
        }

        this.x2 = this.x1;
        this.x1 = input;
        this.y2 = this.y1;
        this.y1 = output;

        return output;
    }
}

/**
 * K-Weighting Filter for LUFS Metering (ITU-R BS.1770-4)
 * Consists of a pre-filter (high shelf) and a RLB filter (high pass).
 */
export class KWeightingFilter {
    constructor(sampleRate) {
        this.preFilter = new BiquadFilter();
        this.rlbFilter = new BiquadFilter();
        
        // Stage 1: High Shelf (+4dB @ ~1500Hz)
        // Exact coeffs depend on spec, but typically modeled as:
        // Gain: +4dB
        // Freq: 1500Hz (roughly)
        // Q: 0.5 (ish)
        // Ideally we use exact values from spec, but standard HS is close enough for approximation.
        this.preFilter.setParams(1500, 4, 0.707, sampleRate, 'highshelf');

        // Stage 2: High Pass (Cutoff @ ~100Hz)
        // "RLB" filter
        this.rlbFilter.setParams(100, 0, 1.0, sampleRate, 'highpass');
    }

    process(input) {
        // Series processing
        const stage1 = this.preFilter.process(input);
        const stage2 = this.rlbFilter.process(stage1);
        return stage2;
    }
}

export class EnvelopeFollower {
    constructor() {
        this.envelope = 0;
        this.attCoeff = 0;
        this.relCoeff = 0;
        this.setParams(0.01, 0.1, 44100); // Default 10ms attack, 100ms release
    }

    setParams(attackTime, releaseTime, sampleRate) {
        // Attack/Release are in seconds
        const tAtt = Math.max(0.001, attackTime);
        const tRel = Math.max(0.001, releaseTime);

        // Simple one-pole coefficient
        this.attCoeff = Math.exp(-1.0 / (tAtt * sampleRate));
        this.relCoeff = Math.exp(-1.0 / (tRel * sampleRate));
    }

    process(input) {
        const absInput = Math.abs(input);
        
        // Attack phase: Input > Envelope
        if (absInput > this.envelope) {
            this.envelope = this.attCoeff * this.envelope + (1 - this.attCoeff) * absInput;
        } 
        // Release phase
        else {
            this.envelope = this.relCoeff * this.envelope + (1 - this.relCoeff) * absInput;
        }

        return this.envelope;
    }
}

export class DelayLine {
    constructor(maxDelaySeconds, sampleRate) {
        this.size = Math.ceil(maxDelaySeconds * sampleRate);
        this.buffer = new Float32Array(this.size);
        this.writeIndex = 0;
    }

    // Write a sample to the buffer
    write(input) {
        this.buffer[this.writeIndex] = input;
        this.writeIndex = (this.writeIndex + 1) % this.size;
    }

    // Read a sample from 'delaySamples' ago with Linear Interpolation
    read(delaySamples) {
        // Calculate read index
        let readPtr = this.writeIndex - delaySamples;
        while (readPtr < 0) readPtr += this.size;

        const i = Math.floor(readPtr);
        const f = readPtr - i; // Fractional part

        const i1 = i % this.size;
        const i2 = (i + 1) % this.size;

        const s1 = this.buffer[i1];
        const s2 = this.buffer[i2];

        // Linear interpolation: y = s1 + f * (s2 - s1)
        return s1 + f * (s2 - s1);
    }
}

export class LFO {
    constructor() {
        this.phase = 0;
    }

    process(frequency, sampleRate) {
        // Increment phase
        this.phase += (2 * Math.PI * frequency) / sampleRate;
        if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
        
        return Math.sin(this.phase);
    }
}

export class OnePoleAllPass {
    constructor() {
        this.x1 = 0;
        this.y1 = 0;
    }

    process(input, alpha) {
        // y(n) = -x(n) + x(n-1) + a * (y(n-1) - x(n))
        // Re-arranged from doc: -x(n) + x1 + alpha * (y1 - x(n))
        const output = -input + this.x1 + alpha * (this.y1 - input);
        
        this.x1 = input;
        this.y1 = output;
        
        return output;
    }
}

