import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectsRack } from './EffectsRack';
import { useAudioStore } from '@/store/useAudioStore';

// Mock dependencies
vi.mock('@/audio/context', () => ({
  audioEngine: {
    analyser: {
        frequencyBinCount: 128,
        getByteTimeDomainData: vi.fn()
    },
    rebuildGraph: vi.fn(),
    updateModuleParam: vi.fn()
  }
}));

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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

    it('should add a module when the button is clicked', () => {
        render(<EffectsRack />);
        
        const addButton = screen.getByText('+ Add DynEQ');
        fireEvent.click(addButton);
        
        // Expect Dynamic EQ text to appear
        expect(screen.getByText('Dynamic EQ')).toBeInTheDocument();
        // Expect sliders
        expect(screen.getByText('frequency')).toBeInTheDocument();
    });

    it('should add a Transient Shaper module when button is clicked', () => {
        render(<EffectsRack />);
        
        const addButton = screen.getByText('+ Add Shaper');
        fireEvent.click(addButton);
        
        expect(screen.getByText('TRANSIENT_SHAPER')).toBeInTheDocument();
        expect(screen.getByText('attackGain')).toBeInTheDocument();
    });

    it('should add a Limiter module when button is clicked', () => {
        render(<EffectsRack />);
        const addButton = screen.getByText('+ Add Limiter');
        fireEvent.click(addButton);
        expect(screen.getByText('Limiter')).toBeInTheDocument();
        expect(screen.getByText('ceiling')).toBeInTheDocument();
    });

    it('should add a MidSide EQ module when button is clicked', () => {
        render(<EffectsRack />);
        const addButton = screen.getByText('+ Add MS EQ');
        fireEvent.click(addButton);
        expect(screen.getByText('Mid/Side EQ')).toBeInTheDocument();
        // The UI displays "Mid (L+R)" and "Side (L-R)" sections, and "Freq"/"Gain" labels.
        expect(screen.getByText('Mid (L+R)')).toBeInTheDocument();
        expect(screen.getAllByText('Freq')).toHaveLength(2);
    });

    it('should add a Cab Sim module when button is clicked', () => {
        render(<EffectsRack />);
        const addButton = screen.getByText('+ Add Cab');
        fireEvent.click(addButton);
        expect(screen.getByText('Cab Sim / IR')).toBeInTheDocument();
        // Check for Mix control since "Drag WAV Here" is drawn on canvas
        expect(screen.getByText('Mix')).toBeInTheDocument();
    });

    it('should add a Loudness Meter module when button is clicked', () => {
        render(<EffectsRack />);
        const addButton = screen.getByText('+ Add Meter');
        fireEvent.click(addButton);
        expect(screen.getByText('LUFS Meter')).toBeInTheDocument();
        expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('should show save button', () => {
        render(<EffectsRack />);
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});
