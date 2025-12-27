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

    it('should trigger renderOffline on click', async () => {
        const renderOfflineMock = vi.fn().mockResolvedValue(undefined);
        vi.mocked(audioEngine.renderOffline).mockImplementation(renderOfflineMock);

        render(<ExportView />);
        fireEvent.click(screen.getByText('Start Offline Render'));
        
        expect(renderOfflineMock).toHaveBeenCalled();
        expect(await screen.findByText('Export Complete!')).toBeInTheDocument();
    });
});
