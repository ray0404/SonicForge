import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportView } from './ExportView';
import { audioEngine } from '@/audio/context';

// Mock audio engine
vi.mock('@/audio/context', () => ({
    audioEngine: {
        renderOffline: vi.fn(),
    }
}));

describe('ExportView', () => {
    it('should render export button', () => {
        render(<ExportView />);
        expect(screen.getByText('Start Offline Render')).toBeInTheDocument();
    });

    it('should trigger renderOffline on click', () => {
        render(<ExportView />);
        fireEvent.click(screen.getByText('Start Offline Render'));
        expect(audioEngine.renderOffline).toHaveBeenCalled();
    });
});
