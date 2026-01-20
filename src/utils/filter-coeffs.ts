
export interface BiquadCoefficients {
    b0: number;
    b1: number;
    b2: number;
    a0: number;
    a1: number;
    a2: number;
}

/**
 * Calculates the coefficients for a Peaking EQ filter.
 * These depend only on the filter parameters, not the evaluation frequency.
 */
export function getPeakingCoefficients(f0: number, Q: number, gainDb: number, fs: number): BiquadCoefficients {
    const w0 = (2 * Math.PI * f0) / fs;
    const A = Math.pow(10, gainDb / 40);
    const alpha = Math.sin(w0) / (2 * Q);

    const cosw0 = Math.cos(w0);

    return {
        b0: 1 + alpha * A,
        b1: -2 * cosw0,
        b2: 1 - alpha * A,
        a0: 1 + alpha / A,
        a1: -2 * cosw0,
        a2: 1 - alpha / A
    };
}

/**
 * Calculates the magnitude response (in dB) of a biquad filter at a specific frequency.
 */
export function getMagnitudeResponse(f: number, fs: number, coeffs: BiquadCoefficients): number {
    const w = (2 * Math.PI * f) / fs;

    const cosw = Math.cos(w);
    const cos2w = Math.cos(2 * w);
    const sinw = Math.sin(w);
    const sin2w = Math.sin(2 * w);

    const { b0, b1, b2, a0, a1, a2 } = coeffs;

    // Evaluate numerator polynomial N(e^jw) = b0 + b1*e^-jw + b2*e^-2jw
    // Real part: b0 + b1*cos(w) + b2*cos(2w) (using cos(-x) = cos(x))
    // Imag part: -b1*sin(w) - b2*sin(2w)     (using sin(-x) = -sin(x))
    // Wait, e^-jw = cos(w) - j*sin(w).
    // So b1*e^-jw = b1*cos(w) - j*b1*sin(w).
    // Correct.

    const numReal = b0 + b1 * cosw + b2 * cos2w;
    const numImag = -b1 * sinw - b2 * sin2w;

    const denReal = a0 + a1 * cosw + a2 * cos2w;
    const denImag = -a1 * sinw - a2 * sin2w;

    const numMagSq = numReal * numReal + numImag * numImag;
    const denMagSq = denReal * denReal + denImag * denImag;

    // Avoid division by zero (though usually unlikely with stable filters)
    if (denMagSq < 1e-20) return -100; // arbitrary low value

    const mag = Math.sqrt(numMagSq / denMagSq);

    // Use optimized log10 conversion: 20 * log10(x) = 8.685889638065037 * ln(x)
    return 8.685889638065037 * Math.log(mag);
}
