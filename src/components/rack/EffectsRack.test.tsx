import { render, screen, fireEvent } from '@testing-library/react';
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
    loadSource: vi.fn().mockResolvedValue({ duration: 100 }), // Mock source loading
    renderOffline: vi.fn() // Mock offline render
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

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock Knob to avoid react-knob-headless issues in JSDOM
vi.mock('@/components/ui/Knob', () => ({
    Knob: ({ label, value }: { label: string, value: number }) => (
        <div data-testid="mock-knob">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    )
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

    it('should add a module when the dropdown is used', async () => {
        render(<EffectsRack />);
        
        // Open dropdown
        const menuButton = screen.getByText(/Add Module/i);
        fireEvent.click(menuButton);
        
        // Click DynEQ (in EQ category)
        const addButton = await screen.findByText('DYNAMIC EQ');
        fireEvent.click(addButton);
        
        // Expect DYNAMIC_EQ text to appear (Title)
        expect(await screen.findByText(/DYNAMIC EQ/i)).toBeInTheDocument();
        // Expect sliders
        expect(await screen.findByText(/Freq/i)).toBeInTheDocument();
    });

    it('should add a Transient Shaper module when dropdown is used', async () => {
        render(<EffectsRack />);
        
        const menuButton = screen.getByText(/Add Module/i);
        fireEvent.click(menuButton);

        const addButton = await screen.findByText('TRANSIENT SHAPER');
        fireEvent.click(addButton);
        
        expect(await screen.findByText(/TRANSIENT SHAPER/i)).toBeInTheDocument();
        expect(await screen.findByText(/Attack/i)).toBeInTheDocument();
    });

    it('should add a Limiter module when dropdown is used', async () => {
        render(<EffectsRack />);
        const menuButton = screen.getByText(/Add Module/i);
        fireEvent.click(menuButton);

        const addButton = await screen.findByText('LIMITER');
        fireEvent.click(addButton);
        expect(await screen.findByText(/LIMITER/i)).toBeInTheDocument();
        expect(await screen.findByText(/Ceiling/i)).toBeInTheDocument();
    });

    it('should add a MidSide EQ module when dropdown is used', async () => {
        render(<EffectsRack />);
        const menuButton = screen.getByText(/Add Module/i);
        fireEvent.click(menuButton);

        const addButton = await screen.findByText('MIDSIDE EQ');
        fireEvent.click(addButton);
        expect(await screen.findByText(/MID\/SIDE EQ/i)).toBeInTheDocument();
        expect((await screen.findAllByText(/Freq/i)).length).toBeGreaterThanOrEqual(2);
    });

    it('should add a Cab Sim module when dropdown is used', async () => {
        render(<EffectsRack />);
        const menuButton = screen.getByText(/Add Module/i);
        fireEvent.click(menuButton);

        const addButton = await screen.findByText('CAB SIM');
        fireEvent.click(addButton);
        expect(await screen.findByText(/CAB SIM/i)).toBeInTheDocument();
        expect(await screen.findByText(/Mix/i)).toBeInTheDocument();
    });

    it('should add a Loudness Meter module when dropdown is used', async () => {
        render(<EffectsRack />);
        const menuButton = screen.getByText(/Add Module/i);
        fireEvent.click(menuButton);

        const addButton = await screen.findByText('LOUDNESS METER');
        fireEvent.click(addButton);
        expect(await screen.findByText(/LUFS Meter/i)).toBeInTheDocument();
    });

    it('should show save button', () => {
        render(<EffectsRack />);
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});
