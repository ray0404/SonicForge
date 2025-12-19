import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioEngine } from './context';

describe('AudioEngine', () => {
  beforeEach(() => {
    // Reset singleton properties
    (audioEngine as any).isInitialized = false;
    (audioEngine as any).context = null;
    (audioEngine as any).analyserL = null;
    (audioEngine as any).analyserR = null;
    (audioEngine as any).splitter = null;
  });

  it('should initialize with L/R analysers', async () => {
    await audioEngine.init();

    expect(audioEngine.context).toBeDefined();
    expect(audioEngine.analyserL).toBeDefined();
    expect(audioEngine.analyserR).toBeDefined();
    expect(audioEngine.splitter).toBeDefined();

    // Verify connections
    // We need to spy on the created nodes to verify connections.
    // Since `audioEngine.init` creates new instances from `new AudioContext()`,
    // the methods we want to spy on are on those instances.

    // However, `audioEngine` properties hold the references.

    const rackOutput = audioEngine.rackOutput;
    const splitter = audioEngine.splitter;
    const analyserL = audioEngine.analyserL;
    const analyserR = audioEngine.analyserR;

    // Check if connect was called on rackOutput with splitter
    // Note: Our mock in setup.ts uses vi.fn() for connect, so we can check it.
    expect(rackOutput?.connect).toHaveBeenCalledWith(splitter);

    // Check splitter connections
    expect(splitter?.connect).toHaveBeenCalledWith(analyserL, 0);
    expect(splitter?.connect).toHaveBeenCalledWith(analyserR, 1);
  });
});
