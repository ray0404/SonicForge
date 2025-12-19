import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  });
});
