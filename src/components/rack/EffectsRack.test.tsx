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
        
        // Expect DYNAMIC_EQ text to appear
        expect(screen.getByText('DYNAMIC_EQ')).toBeInTheDocument();
        // Expect sliders
        expect(screen.getByText('frequency')).toBeInTheDocument();
    });

    it('should show save button', () => {
        render(<EffectsRack />);
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});
