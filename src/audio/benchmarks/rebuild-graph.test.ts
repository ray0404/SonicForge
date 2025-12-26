import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioEngine } from '../context';

// Mock the standardized-audio-context because we are in JSDOM/Node
vi.mock('standardized-audio-context', () => {
    class MockNode {
        connect = vi.fn();
        disconnect = vi.fn();
        port = {
            onmessage: null,
            postMessage: vi.fn(),
            start: vi.fn(),
            close: vi.fn()
        };
    }
    return {
        AudioContext: vi.fn().mockImplementation(function() {
            return {
                createGain: () => ({
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    gain: { value: 0 }
                }),
                createAnalyser: () => ({
                    connect: vi.fn(),
                    disconnect: vi.fn(),
                    fftSize: 0
                }),
                createChannelSplitter: () => ({
                    connect: vi.fn(),
                    disconnect: vi.fn()
                }),
                destination: {},
                audioWorklet: {
                    addModule: vi.fn().mockResolvedValue(true)
                }
            };
        }),
        OfflineAudioContext: vi.fn(),
        AudioWorkletNode: vi.fn().mockImplementation(function() {
            return new MockNode();
        })
    };
});

describe('AudioEngine Rebuild Performance', () => {
    beforeEach(async () => {
        await audioEngine.init();
    });

    const createMockRack = (count: number) => {
        return Array.from({ length: count }, (_, i) => ({
            id: `module-${i}`,
            type: 'LIMITER',
            bypass: false,
            parameters: {}
        }));
    };

    it('benchmarks full rebuild of 10 modules', () => {
        const rack = createMockRack(10);
        const start = performance.now();
        for(let i=0; i<100; i++) {
            audioEngine.fullRebuildGraph(rack);
        }
        const end = performance.now();
        console.log(`Full Rebuild (10 modules) x 100: ${end - start}ms`);
    });

    it('benchmarks partial rebuild (no change) of 10 modules', () => {
        const rack = createMockRack(10);
        audioEngine.rebuildGraph(rack); // warm up
        const start = performance.now();
        for(let i=0; i<100; i++) {
            audioEngine.rebuildGraph(rack);
        }
        const end = performance.now();
        console.log(`No-op Rebuild (10 modules) x 100: ${end - start}ms`);
    });

    it('benchmarks single module change (reordering)', () => {
        const rack = createMockRack(10);
        audioEngine.rebuildGraph(rack);
        
        // Swap first two
        const swappedRack = [...rack];
        [swappedRack[0], swappedRack[1]] = [swappedRack[1], swappedRack[0]];

        const start = performance.now();
        for(let i=0; i<100; i++) {
            audioEngine.rebuildGraph(swappedRack);
        }
        const end = performance.now();
        console.log(`Reorder Rebuild (swap 0,1) x 100: ${end - start}ms`);
    });
});
