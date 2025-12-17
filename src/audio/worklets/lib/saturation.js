/**
 * Saturation/Distortion DSP
 * Provides various analog-modeled saturation types.
 */
export class Saturator {
    constructor() {
        // No state needed for memory-less waveshaping
    }

    /**
     * Process a single sample with saturation.
     *
     * @param {number} input - The input sample (-1.0 to 1.0 nominally, but can be anything)
     * @param {number} drive - Linear gain multiplier (>= 0)
     * @param {string} type - 'Tube', 'Tape', or 'Fuzz'
     * @returns {number} Saturated output
     */
    process(input, drive, type) {
        // Apply drive (linear gain)
        const x = input * drive;

        switch (type) {
            case 'Tube':
                // Asymmetric Transfer Function
                // Positive: Harder knee (tanh)
                // Negative: Softer knee (x / (1 + |x|))
                // This generates even harmonics
                if (x >= 0) {
                    return Math.tanh(x);
                } else {
                    return x / (1 + Math.abs(x));
                }

            case 'Fuzz':
                // Hard Clipping
                // Strict clamping at +/- 1.0
                if (x > 1.0) return 1.0;
                if (x < -1.0) return -1.0;
                return x;

            case 'Tape':
            default:
                // Symmetric Soft Clipping
                // Standard tanh saturator
                // Generates odd harmonics
                return Math.tanh(x);
        }
    }
}
