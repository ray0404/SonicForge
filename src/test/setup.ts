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

// Mock AudioContext (Global fallback if not mocked in specific tests)
// Note: Specific tests might override this with stubGlobal
if (!global.AudioContext) {
    global.AudioContext = class {
        state = 'suspended';
        createGain = () => ({ connect: () => {}, disconnect: () => {}, gain: { value: 1 } });
        createAnalyser = () => ({ connect: () => {}, disconnect: () => {}, fftSize: 2048 });
        createChannelSplitter = () => ({ connect: () => {}, disconnect: () => {} });
        createBufferSource = () => ({ connect: () => {}, disconnect: () => {}, start: () => {}, stop: () => {} });
        createConvolver = () => ({ connect: () => {}, disconnect: () => {} });
        audioWorklet = { addModule: async () => {} };
    } as any;
}
