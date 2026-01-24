// import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Canvas getContext
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn();
}

// Mock URL.createObjectURL
if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
}

const mocks = vi.hoisted(() => {
  class AudioWorkletNodeMock {
    constructor() {}
    connect() {}
    disconnect() {}
    parameters = { get: () => ({ value: 0, setTargetAtTime: () => {}, setValueAtTime: () => {} }) };
    port = { postMessage: () => {}, onmessage: null };
  }

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
    createConvolver = vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        buffer: null,
        normalize: false
    }));
    createChannelSplitter = vi.fn((_channels) => ({
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

  return { AudioWorkletNodeMock, AudioContextMock };
});

vi.stubGlobal('AudioWorkletNode', mocks.AudioWorkletNodeMock);
vi.stubGlobal('AudioNode', class AudioNodeMock {
    connect() {}
    disconnect() {}
});

vi.stubGlobal('AudioContext', mocks.AudioContextMock);
if (typeof window !== 'undefined') {
    vi.stubGlobal('AudioContext', mocks.AudioContextMock);
    // @ts-ignore
    window.AudioContext = mocks.AudioContextMock;
}

// Mock standardized-audio-context
vi.mock('standardized-audio-context', () => {
    return {
        AudioContext: mocks.AudioContextMock,
        OfflineAudioContext: mocks.AudioContextMock,
        AudioWorkletNode: mocks.AudioWorkletNodeMock,
        // Add other exports if needed
    };
});
