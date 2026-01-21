import { describe, it, expect } from 'vitest';
import { dbToLinear, linearToDb } from './dsp-helpers';

describe('DSP Helpers', () => {
    describe('dbToLinear', () => {
        it('should approximate Math.pow(10, db/20)', () => {
            const values = [-100, -60, -20, -10, -6, -3, 0, 3, 6, 10, 20];
            for (const db of values) {
                const expected = Math.pow(10, db / 20);
                const actual = dbToLinear(db);
                // The approximation error should be extremely small
                expect(actual).toBeCloseTo(expected, 10);
            }
        });
    });

    describe('linearToDb', () => {
        it('should approximate 20 * Math.log10(x)', () => {
            const values = [0.0001, 0.001, 0.01, 0.1, 0.5, 1, 2, 4, 10, 100];
            for (const linear of values) {
                const expected = 20 * Math.log10(linear);
                const actual = linearToDb(linear);
                expect(actual).toBeCloseTo(expected, 10);
            }
        });
    });
});
