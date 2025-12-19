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
        useAudioStore.setState({
            isInitialized: true,
            isPlaying: false,
            masterVolume: 1.0,
            rack: []
        });
    });

    it('should render the empty rack state initially', () => {
        render(<EffectsRack />);
        expect(screen.getByText(/Rack is empty/i)).toBeInTheDocument();
    });

    it('should render Dynamic EQ module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('DYNAMIC_EQ'); });
        
        expect(screen.getByText('Dynamic EQ')).toBeInTheDocument();
        expect(screen.getByText('Freq')).toBeInTheDocument();
    });

    it('should render Transient Shaper module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('TRANSIENT_SHAPER'); });
        
        expect(screen.getByText('Transient Shaper')).toBeInTheDocument();
        expect(screen.getByText('Attack')).toBeInTheDocument();
        expect(screen.getByText('Mix')).toBeInTheDocument();
    });

    it('should render Compressor module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('COMPRESSOR'); });
        expect(screen.getByText('Compressor')).toBeInTheDocument();
        expect(screen.getByText('Ratio')).toBeInTheDocument();
        expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
    });

    it('should render Tremolo module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('TREMOLO'); });
        expect(screen.getByText('Tremolo')).toBeInTheDocument();
        expect(screen.getByText('Depth')).toBeInTheDocument();
        expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
    });

    it('should render Saturation module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('SATURATION'); });
        expect(screen.getByText('Analog Saturation')).toBeInTheDocument();
        expect(screen.getByText('Drive')).toBeInTheDocument();
        expect(screen.getAllByText('Mix').length).toBeGreaterThan(0);
    });

    it('should render Limiter module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('LIMITER'); });
        expect(screen.getByText('Limiter')).toBeInTheDocument();
        expect(screen.getByText('Ceiling')).toBeInTheDocument();
    });

    it('should render MidSide EQ module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('MIDSIDE_EQ'); });
        expect(screen.getByText('Mid/Side EQ')).toBeInTheDocument();
        expect(screen.getByText('Mid (Sum)')).toBeInTheDocument();
    });

    it('should render Cab Sim module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('CAB_SIM'); });
        expect(screen.getByText('Cab Sim / IR')).toBeInTheDocument();
        expect(screen.getByText('Mix')).toBeInTheDocument();
    });

    it('should render Loudness Meter module', () => {
        render(<EffectsRack />);
        act(() => { useAudioStore.getState().addModule('LOUDNESS_METER'); });
        expect(screen.getByText('Loudness Meter')).toBeInTheDocument();
    });
});
