import { describe, it, expect } from 'vitest';
import { BiquadFilter, EnvelopeFollower, dbToLinear, linearToDb } from './dsp-helpers';

describe('DSP Helpers', () => {
    describe('dB Conversion', () => {
        it('should correctly convert dB to linear', () => {
            // 0 dB = 1.0
            expect(dbToLinear(0)).toBeCloseTo(1.0, 5);
            // 20 dB = 10.0
            expect(dbToLinear(20)).toBeCloseTo(10.0, 5);
            // -6 dB = 0.5 (approx)
            expect(dbToLinear(-6.0206)).toBeCloseTo(0.5, 3);
        });

        it('should correctly convert linear to dB', () => {
             // 1.0 = 0 dB
             expect(linearToDb(1.0)).toBeCloseTo(0, 5);
             // 10.0 = 20 dB
             expect(linearToDb(10.0)).toBeCloseTo(20, 5);
             // 0.5 = -6 dB
             expect(linearToDb(0.5)).toBeCloseTo(-6.0206, 3);
        });

        it('should match Math.pow/log10 accuracy', () => {
            for (let db = -100; db <= 20; db += 0.5) {
                 const expected = Math.pow(10, db / 20);
                 const actual = dbToLinear(db);
                 expect(actual).toBeCloseTo(expected, 10);
            }
        });

        it('should handle small linear values safely', () => {
             expect(linearToDb(0)).toBe(-1000);
             expect(linearToDb(-5)).toBe(-1000);
        });
    });

    describe('BiquadFilter', () => {
        it('should initialize with default parameters', () => {
            const filter = new BiquadFilter();
            expect(filter.b0).toBeDefined();
            expect(filter.a1).toBeDefined();
        });

        it('should process audio without NaN', () => {
            const filter = new BiquadFilter();
            filter.setParams(1000, 0, 1, 44100, 'lowpass');
            const out = filter.process(0.5);
            expect(out).not.toBeNaN();
        });
        
        it('should implement all filter types', () => {
             const filter = new BiquadFilter();
             const types = ['lowpass', 'highpass', 'bandpass', 'peaking'];
             types.forEach(type => {
                 filter.setParams(1000, 0, 1, 44100, type);
                 expect(filter.process(0.5)).not.toBeNaN();
             });
        });
    });

    describe('EnvelopeFollower', () => {
        it('should attack when input increases', () => {
            const env = new EnvelopeFollower();
            env.setParams(0.01, 0.1, 44100);
            
            // Initial state
            expect(env.envelope).toBe(0);
            
            // Process high input
            const out = env.process(1.0);
            expect(out).toBeGreaterThan(0);
            expect(out).toBeLessThan(1.0); // Should lag behind due to attack
        });

        it('should release when input decreases', () => {
             const env = new EnvelopeFollower();
             env.setParams(0.001, 0.1, 44100);
             env.envelope = 1.0; // Force high
             
             const out = env.process(0.0);
             expect(out).toBeLessThan(1.0); // Should decay
             expect(out).toBeGreaterThan(0.9); // Should decay slowly (release > attack)
        });
    });
});
