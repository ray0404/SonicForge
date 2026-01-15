import { describe, it, expect } from 'vitest';
import { BiquadFilter, EnvelopeFollower, dbToLinear, linearToDb } from './dsp-helpers';

describe('DSP Helpers', () => {
    describe('Conversions', () => {
        it('dbToLinear should be accurate', () => {
             // 0dB -> 1.0
             expect(dbToLinear(0)).toBeCloseTo(1.0, 5);
             // -6dB -> ~0.501
             expect(dbToLinear(-6)).toBeCloseTo(0.501187, 4);
             // -20dB -> 0.1
             expect(dbToLinear(-20)).toBeCloseTo(0.1, 5);
        });

        it('linearToDb should be accurate', () => {
             // 1.0 -> 0dB
             expect(linearToDb(1.0)).toBeCloseTo(0, 5);
             // 0.5 -> ~-6.02dB
             expect(linearToDb(0.5)).toBeCloseTo(-6.0206, 4);
             // 0.1 -> -20dB
             expect(linearToDb(0.1)).toBeCloseTo(-20, 5);
        });

        it('linearToDb should handle zero/negative', () => {
             expect(linearToDb(0)).toBe(-1000);
             expect(linearToDb(-1)).toBe(-1000);
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
