import { describe, it, expect } from 'vitest';
import { Saturator } from './saturation.js';

describe('Saturator DSP', () => {
    const saturator = new Saturator();

    it('should pass through 0 without modification', () => {
        expect(saturator.process(0, 1.0, 'Tube')).toBe(0);
        expect(saturator.process(0, 1.0, 'Tape')).toBe(0);
        expect(saturator.process(0, 1.0, 'Fuzz')).toBe(0);
    });

    it('should hard clip Fuzz at +/- 1.0', () => {
        expect(saturator.process(1.5, 1.0, 'Fuzz')).toBe(1.0);
        expect(saturator.process(-1.5, 1.0, 'Fuzz')).toBe(-1.0);
    });

    it('should apply drive gain', () => {
        // Drive of 2.0 (1.0 passed as param effectively means 1x, so input * 2.0?)
        // In our processor logic we pass (1.0 + DriveKnob).
        // Saturator.process(input, drive, ...) does `x = input * drive`.
        // So input 0.5 * drive 2.0 = 1.0.
        // Fuzz should clip 1.0 at 1.0.
        expect(saturator.process(0.5, 2.0, 'Fuzz')).toBe(1.0);
    });

    it('should saturate asymmetrically for Tube (positive)', () => {
        const input = 0.5;
        const drive = 1.0;
        const output = saturator.process(input, drive, 'Tube');
        // tanh(0.5) = 0.4621
        expect(output).toBeCloseTo(Math.tanh(0.5), 4);
    });

    it('should saturate asymmetrically for Tube (negative)', () => {
        const input = -0.5;
        const drive = 1.0;
        const output = saturator.process(input, drive, 'Tube');
        // x / (1 + |x|) = -0.5 / 1.5 = -0.3333
        expect(output).toBeCloseTo(-0.3333, 4);
    });

    it('should saturate symmetrically for Tape', () => {
        const drive = 1.0;
        const pos = saturator.process(0.5, drive, 'Tape');
        const neg = saturator.process(-0.5, drive, 'Tape');
        // tanh(0.5) approx 0.4621
        // tanh(-0.5) approx -0.4621
        expect(pos).toBeCloseTo(Math.tanh(0.5), 4);
        expect(neg).toBeCloseTo(Math.tanh(-0.5), 4);
        expect(pos).toBeCloseTo(-neg, 4);
    });
});