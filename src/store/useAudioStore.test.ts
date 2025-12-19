import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAudioStore } from './useAudioStore';
import { act } from '@testing-library/react';

// Mock the AudioEngine singleton
vi.mock('@/audio/context', () => ({
  audioEngine: {
    init: vi.fn(),
    resume: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    rebuildGraph: vi.fn(),
    updateModuleParam: vi.fn(),
    context: { currentTime: 0, decodeAudioData: vi.fn(() => Promise.resolve({})) },
    masterGain: { gain: { setTargetAtTime: vi.fn() } }
  }
}));

// Mock idb-keyval for persistence
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const createMockFile = () => new File([''], 'track.wav', { type: 'audio/wav' });

describe('useAudioStore', () => {
  beforeEach(() => {
    act(() => {
      useAudioStore.setState({
        isInitialized: false,
        isPlaying: false,
        masterVolume: 1.0,
        masterRack: [],
        tracks: [],
        assets: {},
        sourceDuration: 0,
        currentTime: 0,
      });
    });
    vi.clearAllMocks();
  });

  it('should add a module to the master rack', () => {
    act(() => {
      useAudioStore.getState().addModule('DYNAMIC_EQ');
    });
    const state = useAudioStore.getState();
    expect(state.masterRack).toHaveLength(1);
    expect(state.masterRack[0].type).toBe('DYNAMIC_EQ');
  });

  it('should add a new track', async () => {
    const mockFile = createMockFile();
    await act(async () => {
      await useAudioStore.getState().addTrack(mockFile);
    });
    const state = useAudioStore.getState();
    expect(state.tracks).toHaveLength(1);
    expect(state.tracks[0].name).toBe('track');
  });

  it('should add a module to a specific track', async () => {
    const mockFile = createMockFile();
    await act(async () => {
      await useAudioStore.getState().addTrack(mockFile);
    });
    const trackId = useAudioStore.getState().tracks[0].id;
    act(() => {
      useAudioStore.getState().addModule('LIMITER', trackId);
    });
    const state = useAudioStore.getState();
    expect(state.tracks[0].rack).toHaveLength(1);
    expect(state.tracks[0].rack[0].type).toBe('LIMITER');
  });
});
