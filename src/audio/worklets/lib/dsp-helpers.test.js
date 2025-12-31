import { describe, it, expect } from 'vitest';
import { BiquadFilter, EnvelopeFollower, DelayLine, LFO } from './dsp-helpers';

describe('DSP Helpers', () => {
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

    describe('DelayLine', () => {
        it('should write and read back correctly without delay', () => {
            const dl = new DelayLine(1.0, 44100); // 1 sec delay
            dl.write(0.5);
            // Read back with 0 delay (should match input mostly, depending on write ptr logic)
            // write() increments writeIndex *after* writing.
            // read(0) reads writeIndex - 0.
            // In circular buffer, buffer[writeIndex] is the *next* write slot (oldest value or empty).
            // But wait, if we write at i, then increment to i+1.
            // read(0) looks at i+1.
            // read(1) looks at i.
            // So to get the value we just wrote, we need delay=1 (sample).

            // Let's verify behavior.
            // writeIndex starts 0. write(0.5) -> buffer[0]=0.5, writeIndex=1.
            // read(1) -> ptr = 1 - 1 = 0. buffer[0] is 0.5.
            expect(dl.read(1)).toBeCloseTo(0.5);
        });

        it('should handle wrapping correctly', () => {
            const size = 10; // small size for testing
            const dl = new DelayLine(size / 1000, 1000); // 10 samples
            // size will be 10.

            // Fill buffer
            for(let i=0; i<15; i++) {
                dl.write(i);
            }
            // buffer size 10.
            // wrote 0..14.
            // 0..9 filled. 10 overwrites 0. 11 overwrites 1...
            // writeIndex should be 15 % 10 = 5.
            // buffer at 0 should be 10, at 1 should be 11, at 4 should be 14.

            // Read most recent (delay 1 sample) -> should be 14.
            expect(dl.read(1)).toBeCloseTo(14);

            // Read oldest (delay 10 samples) -> should be 5.
            // ptr = 5 - 10 = -5 -> wraps to 5. buffer[5] is 5.
            expect(dl.read(10)).toBeCloseTo(5);
        });

        it('should interpolate fractional delays', () => {
            const dl = new DelayLine(1.0, 44100);
            dl.write(0.0);
            dl.write(1.0);
            // buffer: [..., 0.0, 1.0]
            // writeIndex points after 1.0.
            // read(1) -> 1.0
            // read(2) -> 0.0
            // read(1.5) -> 0.5

            expect(dl.read(1)).toBeCloseTo(1.0);
            expect(dl.read(2)).toBeCloseTo(0.0);
            expect(dl.read(1.5)).toBeCloseTo(0.5);
        });
    });

    describe('LFO', () => {
        it('should generate sine wave', () => {
            const lfo = new LFO();
            const sampleRate = 100;
            const freq = 1; // 1 cycle per 100 samples

            // Phase starts at 0 -> sin(0) = 0.
            // But process() increments phase *before* sin usually? Or after?
            // Code: phase += ...; return sin(phase)
            // So first call: phase = 2PI/100. sin(small positive).

            const v1 = lfo.process(freq, sampleRate);
            expect(v1).toBeGreaterThan(0);

            // After 25 calls (1/4 cycle), should be near 1.0
            for(let i=0; i<24; i++) lfo.process(freq, sampleRate);
            expect(lfo.process(freq, sampleRate)).toBeCloseTo(1.0, 1);
        });

        it('should wrap phase', () => {
            const lfo = new LFO();
            // run for more than 1 cycle
            for(let i=0; i<150; i++) {
                const val = lfo.process(1, 100);
                expect(val).toBeGreaterThanOrEqual(-1);
                expect(val).toBeLessThanOrEqual(1);
            }
        });
    });
});
