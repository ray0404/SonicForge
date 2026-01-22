import { describe, it, expect } from 'vitest';
import { BiquadFilter, EnvelopeFollower, dbToLinear, linearToDb } from './dsp-helpers';

describe('DSP Helpers', () => {
    describe('Math Helpers', () => {
        it('should convert dB to linear correctly', () => {
            expect(dbToLinear(0)).toBeCloseTo(1.0);
            expect(dbToLinear(20)).toBeCloseTo(10.0);
            expect(dbToLinear(-20)).toBeCloseTo(0.1);
            expect(dbToLinear(6)).toBeCloseTo(1.9952623149688795);
        });

        it('should convert linear to dB correctly', () => {
            expect(linearToDb(1.0)).toBeCloseTo(0);
            expect(linearToDb(10.0)).toBeCloseTo(20);
            expect(linearToDb(0.1)).toBeCloseTo(-20);
            expect(linearToDb(2.0)).toBeCloseTo(6.020599913279624);
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
