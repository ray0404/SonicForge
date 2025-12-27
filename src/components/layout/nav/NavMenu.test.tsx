import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavMenu } from './NavMenu';
import { useUIStore } from '@/store/useUIStore';

// Mock store
vi.mock('@/store/useUIStore');

describe('NavMenu', () => {
    const setActiveView = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        (useUIStore as any).mockReturnValue({
            activeView: 'SETTINGS',
            setActiveView,
        });
    });

    it('should render all navigation items', () => {
        render(<NavMenu />);
        
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
        expect(screen.getByText('Mixer')).toBeInTheDocument();
        expect(screen.getByText('Timeline')).toBeInTheDocument();
        expect(screen.getByText('Assets')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should highlight the active view', () => {
        (useUIStore as any).mockReturnValue({
            activeView: 'DOCS',
            setActiveView,
        });

        render(<NavMenu />);
        
        const docsButton = screen.getByText('Documentation').closest('button');
        const settingsButton = screen.getByText('Settings').closest('button');

        // Assuming active class has 'bg-slate-800' or similar
        // We'll test for specific class presence or aria-current
        expect(docsButton).toHaveAttribute('aria-current', 'page');
        expect(settingsButton).not.toHaveAttribute('aria-current');
    });

    it('should change view on click', () => {
        render(<NavMenu />);
        
        fireEvent.click(screen.getByText('Mixer'));
        expect(setActiveView).toHaveBeenCalledWith('MIXER');
    });
});
