import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectsRack } from './EffectsRack';
import { useAudioStore } from '@/store/useAudioStore';

// Mock dependencies
vi.mock('@/audio/context', () => ({
  audioEngine: {
    analyser: {
        frequencyBinCount: 128,
        getByteTimeDomainData: vi.fn(),
        getByteFrequencyData: vi.fn(),
    },
    rebuildGraph: vi.fn(),
    updateModuleParam: vi.fn(),
    getModuleNode: vi.fn(),
    loadSource: vi.fn().mockResolvedValue({ duration: 100 }), // Mock source loading
    renderOffline: vi.fn(),
    nodeMap: new Map() // Mock nodeMap for visualizers
  }
}));

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

// ResizeObserver is mocked in setup.ts

describe('EffectsRack', () => {
    beforeEach(() => {
        act(() => {
            useAudioStore.setState({
                isInitialized: true,
                isPlaying: false,
                masterVolume: 1.0,
                masterRack: []
            });
        });
    });

    it('should render the empty rack state initially', () => {
        render(<EffectsRack />);
        expect(screen.getByText(/Master rack is empty/i)).toBeInTheDocument();
    });

    it('should render Dynamic EQ module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('DYNAMIC_EQ'); });
        
        expect(screen.getByText('Dynamic EQ')).toBeInTheDocument();
        expect(screen.getByText('Freq')).toBeInTheDocument();
    });
});
