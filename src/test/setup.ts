import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver for Dnd-Kit
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock AudioContext
if (typeof window.AudioContext === 'undefined') {
  // @ts-ignore
  window.AudioContext = class AudioContext {
    state = 'suspended';
    createGain = () => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1, setTargetAtTime: vi.fn() } });
    createAnalyser = () => ({ connect: vi.fn(), disconnect: vi.fn(), fftSize: 2048 });
    createChannelSplitter = () => ({ connect: vi.fn(), disconnect: vi.fn() });
    createBufferSource = () => ({ connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() });
    decodeAudioData = vi.fn().mockResolvedValue({ duration: 10, length: 441000, sampleRate: 44100, getChannelData: () => new Float32Array(441000) });
    audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
    destination = {};
    currentTime = 0;
    resume = vi.fn();
    suspend = vi.fn();
  };
}

// Mock Canvas getContext
// @ts-ignore
HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
    if (type === '2d') {
        return {
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
            putImageData: vi.fn(),
            createImageData: vi.fn(() => []),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            arc: vi.fn(),
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 0 })),
            createLinearGradient: vi.fn(() => ({
                addColorStop: vi.fn()
            })),
            strokeStyle: '',
            fillStyle: '',
            lineWidth: 1,
            font: '',
        };
    }
    return null;
});
