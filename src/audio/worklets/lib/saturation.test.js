import { describe, it, expect } from 'vitest';
import { Saturator } from './saturation';

describe('Saturator', () => {
    const saturator = new Saturator();

    describe('Drive behavior', () => {
        it('should pass through signal linearly when drive is 1 and signal is small (approx linear region of tanh)', () => {
            // tanh(x) approx x for small x
            const input = 0.1;
            const output = saturator.process(input, 1.0, 'Tape');
            expect(output).toBeCloseTo(Math.tanh(0.1), 5);
        });

        it('should amplify signal before shaping', () => {
            // input 0.1, drive 2.0 -> effective input 0.2
            const output = saturator.process(0.1, 2.0, 'Tape');
            expect(output).toBeCloseTo(Math.tanh(0.2), 5);
        });
    });

    describe('Tape Mode (Default)', () => {
        it('should use tanh for both positive and negative inputs', () => {
            const pos = saturator.process(1.0, 1.0, 'Tape');
            const neg = saturator.process(-1.0, 1.0, 'Tape');

            expect(pos).toBeCloseTo(Math.tanh(1.0));
            expect(neg).toBeCloseTo(Math.tanh(-1.0));
            // Symmetric
            expect(pos).toBeCloseTo(-neg);
        });
    });

    describe('Fuzz Mode', () => {
        it('should hard clip signal above 1.0', () => {
            expect(saturator.process(0.5, 1.0, 'Fuzz')).toBe(0.5);
            expect(saturator.process(1.5, 1.0, 'Fuzz')).toBe(1.0);
            expect(saturator.process(100, 1.0, 'Fuzz')).toBe(1.0);
        });

        it('should hard clip signal below -1.0', () => {
            expect(saturator.process(-0.5, 1.0, 'Fuzz')).toBe(-0.5);
            expect(saturator.process(-1.5, 1.0, 'Fuzz')).toBe(-1.0);
            expect(saturator.process(-100, 1.0, 'Fuzz')).toBe(-1.0);
        });
    });

    describe('Tube Mode', () => {
        it('should behave like tanh for positive inputs', () => {
            const output = saturator.process(2.0, 1.0, 'Tube');
            expect(output).toBeCloseTo(Math.tanh(2.0));
        });

        it('should use softer curve for negative inputs', () => {
            // Formula: x / (1 + |x|)
            const input = -2.0;
            const output = saturator.process(input, 1.0, 'Tube');
            const expected = -2.0 / (1 + 2.0); // -2/3 = -0.666...

            expect(output).toBeCloseTo(expected);

            // Verify asymmetry compared to positive
            const posOutput = saturator.process(2.0, 1.0, 'Tube'); // tanh(2) ~= 0.964
            expect(Math.abs(output)).not.toBeCloseTo(posOutput);
        });

        it('should saturate towards -1.0 for large negative inputs', () => {
            const output = saturator.process(-1000, 1.0, 'Tube');
            expect(output).toBeGreaterThan(-1.0);
            expect(output).toBeCloseTo(-1.0, 2);
        });
    });
});
