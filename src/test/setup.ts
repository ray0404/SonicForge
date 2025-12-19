import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global Web Audio API Mocks

// AudioWorkletNode
class AudioWorkletNodeMock {
  constructor() {}
  connect() {}
  disconnect() {}
  parameters = { get: () => ({ value: 0 }) };
  port = { postMessage: () => {}, onmessage: null };
}
vi.stubGlobal('AudioWorkletNode', AudioWorkletNodeMock);

// AudioNode (often needed if extending)
class AudioNodeMock {
  connect() {}
  disconnect() {}
}
vi.stubGlobal('AudioNode', AudioNodeMock);

// AudioContext (Basic Mock)
// Individual tests can override this if they need specific return values
class AudioContextMock {
  state = 'suspended';
  resume = vi.fn();
  createGain = vi.fn(() => ({
    gain: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }));
  createChannelSplitter = vi.fn((channels) => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  createBufferSource = vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      buffer: null,
      onended: null,
  }));
  decodeAudioData = vi.fn();
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  destination = {};
  currentTime = 0;
}
vi.stubGlobal('AudioContext', AudioContextMock);
vi.stubGlobal('window.AudioContext', AudioContextMock);
