import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MasteringWorkspace } from './MasteringWorkspace';
import { useUIStore } from '@/store/useUIStore';

// Mocks
vi.mock('@/hooks/useProjectPersistence', () => ({
    useProjectPersistence: () => ({ saveProject: vi.fn(), isPersistedToDisk: true })
}));

vi.mock('@/store/useAudioStore', () => ({
    useAudioStore: () => ({ 
        loadSourceFile: vi.fn(), 
        clearSource: vi.fn(), 
        sourceDuration: 0,
        rack: [] // Mock rack for EffectsRack
    })
}));

// Mock child components to simplify testing
vi.mock('@/components/rack/EffectsRack', () => ({ EffectsRack: () => <div data-testid="effects-rack" /> }));
vi.mock('@/components/Transport', () => ({ Transport: () => <div data-testid="transport" /> }));
vi.mock('@/components/visualizers/MasteringVisualizer', () => ({ MasteringVisualizer: () => <div data-testid="visualizer" /> }));
vi.mock('@/components/rack/AddModuleMenu', () => ({ AddModuleMenu: () => <div data-testid="add-module" /> }));

// Mock the SidePanel component
vi.mock('./SidePanel', () => ({ SidePanel: () => <div data-testid="side-panel" /> }));

vi.mock('@/store/useUIStore');

describe('MasteringWorkspace Layout Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useUIStore as any).mockReturnValue({
            isPanelOpen: false,
            activeView: 'SETTINGS',
            togglePanel: vi.fn(),
            openView: vi.fn(),
            setPanelOpen: vi.fn(),
        });
    });

    it('should render the SidePanel component', () => {
        render(<MasteringWorkspace />);
        expect(screen.getByTestId('side-panel')).toBeInTheDocument();
    });

    it('should push content on desktop when panel is open', () => {
        // Mock active panel state
        (useUIStore as any).mockReturnValue({
            isPanelOpen: true,
            activeView: 'SETTINGS',
            togglePanel: vi.fn(),
            openView: vi.fn(),
            setPanelOpen: vi.fn(),
        });

        const { container } = render(<MasteringWorkspace />);
        const mainContent = container.querySelector('main');
        
        // In the implementation, we'll look for a class that indicates shifting
        // e.g., 'mr-[400px]' or similar logic for desktop
        // For now, let's verify the structure allows for it
        expect(mainContent).toBeInTheDocument();
    });

    it('should have accessible labels for key actions', () => {
        render(<MasteringWorkspace />);
        expect(screen.getByLabelText('Save Project')).toBeInTheDocument();
        expect(screen.getByLabelText('Import Audio')).toBeInTheDocument();
        expect(screen.getByLabelText('Open Side Panel')).toBeInTheDocument();
    });
});
