import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock AudioWorkletNode
class AudioWorkletNodeMock {
  constructor() {}
  connect() {}
  disconnect() {}
  parameters = { get: () => ({ value: 0 }) };
  port = { postMessage: () => {}, onmessage: null };
}
vi.stubGlobal('AudioWorkletNode', AudioWorkletNodeMock);

// Mock AudioNode
class AudioNodeMock {
  connect() {}
  disconnect() {}
}
vi.stubGlobal('AudioNode', AudioNodeMock);

// Mock AudioContext
class AudioContextMock {
  state = 'suspended';
  resume = vi.fn();
  createGain = vi.fn(() => ({
    gain: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  createStereoPanner = vi.fn(() => ({
    pan: { value: 0, setTargetAtTime: vi.fn() },
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
  }));
  createChannelSplitter = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  decodeAudioData = vi.fn(() => Promise.resolve({}));
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  destination = new AudioNodeMock();
  currentTime = 0;
}
vi.stubGlobal('AudioContext', AudioContextMock);
