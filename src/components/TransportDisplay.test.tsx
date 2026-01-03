import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransportDisplay } from './TransportDisplay';

// Mock the store
const mockSeek = vi.fn();
vi.mock('@/store/useAudioStore', () => ({
  useAudioStore: (selector: any) => selector({
    currentTime: 10,
    sourceDuration: 100,
    seek: mockSeek
  })
}));

describe('TransportDisplay', () => {
  it('renders the seek input with correct aria-label', () => {
    render(<TransportDisplay />);
    const input = screen.getByLabelText('Seek');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'range');
    expect(input).toHaveValue('10');
  });

  it('calls seek on change', () => {
    render(<TransportDisplay />);
    const input = screen.getByLabelText('Seek');
    fireEvent.change(input, { target: { value: '50' } });
    expect(mockSeek).toHaveBeenCalledWith(50);
  });
});
