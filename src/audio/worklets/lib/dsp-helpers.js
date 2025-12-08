/**
 * Shared DSP Library for AudioWorklets
 * Pure JS implementation of common DSP components.
 */

export class BiquadFilter {
    constructor() {
        this.reset();
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
        // Basic biquad coefficient calculation
        // Based on Audio EQ Cookbook
        const w0 = (2 * Math.PI * frequency) / sampleRate;
        const alpha = Math.sin(w0) / (2 * Q);
        const A = Math.pow(10, gain / 40);
        const cosw0 = Math.cos(w0);

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
            default:
                // Pass through
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
        
        // DANGER: Denormal handling might be needed for very low numbers in JS?
        // Usually strictly typed arrays handle this, but JS numbers are doubles.
        // For simplicity, we assume standard behavior.

        this.x2 = this.x1;
        this.x1 = input;
        this.y2 = this.y1;
        this.y1 = output;

        return output;
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
