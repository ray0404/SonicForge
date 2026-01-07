import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Define the mock class
class AudioWorkletProcessor {
  port: any;
  constructor() {
    this.port = { postMessage: vi.fn() };
  }
}

// Assign to global manually to ensure it is present
// @ts-expect-error - Manual global assignment for test environment
global.AudioWorkletProcessor = AudioWorkletProcessor;

describe('SaturationProcessor', () => {
    let ProcessorClass: any;

    beforeEach(async () => {
        vi.resetModules();

        // Ensure global is set
        // @ts-expect-error - Manual global assignment for test environment
        global.AudioWorkletProcessor = AudioWorkletProcessor;

        const registerProcessor = vi.fn((name, cls) => {
            ProcessorClass = cls;
        });
        vi.stubGlobal('registerProcessor', registerProcessor);

        await import('./saturation-processor.js');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should be registered', () => {
        expect(ProcessorClass).toBeDefined();
    });

    it('processes Tape mode (tanh) correctly', () => {
        const processor = new ProcessorClass();
        const inputChannel = new Float32Array([0.5, -0.5, 0.0]);
        const outputChannel = new Float32Array(3);

        const inputs = [[inputChannel]];
        const outputs = [[outputChannel]];

        // Params: drive=0, type=0 (Tape), gain=0, mix=1
        const params = {
            drive: new Float32Array([0]),
            type: new Float32Array([0]),
            outputGain: new Float32Array([0]),
            mix: new Float32Array([1])
        };

        processor.process(inputs, outputs, params);

        expect(outputChannel[0]).toBeCloseTo(Math.tanh(0.5), 5);
        expect(outputChannel[1]).toBeCloseTo(Math.tanh(-0.5), 5);
        expect(outputChannel[2]).toBeCloseTo(Math.tanh(0.0), 5);
    });

    it('processes Tube mode (asymmetric) correctly', () => {
        const processor = new ProcessorClass();
        const inputChannel = new Float32Array([0.5, -0.5]);
        const outputChannel = new Float32Array(2);

        const inputs = [[inputChannel]];
        const outputs = [[outputChannel]];

        const params = {
            drive: new Float32Array([0]),
            type: new Float32Array([1]),
            outputGain: new Float32Array([0]),
            mix: new Float32Array([1])
        };

        processor.process(inputs, outputs, params);

        expect(outputChannel[0]).toBeCloseTo(Math.tanh(0.5), 5);
        expect(outputChannel[1]).toBeCloseTo(-0.5 / (1 + 0.5), 5);
    });

    it('processes Fuzz mode (hard clip) correctly', () => {
        const processor = new ProcessorClass();
        const inputChannel = new Float32Array([0.6, -0.6, 0.4]);

        const outputChannel = new Float32Array(3);
        const inputs = [[inputChannel]];
        const outputs = [[outputChannel]];

        const params = {
            drive: new Float32Array([1.0]), // input * 2
            type: new Float32Array([2]), // Fuzz
            outputGain: new Float32Array([0]),
            mix: new Float32Array([1])
        };

        processor.process(inputs, outputs, params);

        expect(outputChannel[0]).toBeCloseTo(1.0, 5);
        expect(outputChannel[1]).toBeCloseTo(-1.0, 5);
        expect(outputChannel[2]).toBeCloseTo(0.8, 5);
    });

    it('applies output gain correctly', () => {
        const processor = new ProcessorClass();
        const inputChannel = new Float32Array([0.5]);
        const outputChannel = new Float32Array(1);

        const inputs = [[inputChannel]];
        const outputs = [[outputChannel]];

        const params = {
            drive: new Float32Array([0]),
            type: new Float32Array([0]),
            outputGain: new Float32Array([6.0]),
            mix: new Float32Array([1])
        };

        processor.process(inputs, outputs, params);

        const saturated = Math.tanh(0.5);
        const expectedGain = Math.pow(10, 6.0 / 20);

        expect(outputChannel[0]).toBeCloseTo(saturated * expectedGain, 4);
    });
});
