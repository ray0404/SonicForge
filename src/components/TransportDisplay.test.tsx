import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { TransportDisplay } from './TransportDisplay';
import { useAudioStore } from '@/store/useAudioStore';

// Mock the store
vi.mock('@/store/useAudioStore', () => ({
  useAudioStore: vi.fn(),
}));

describe('TransportDisplay', () => {
  it('renders correctly with default state', () => {
    const mockState = {
      currentTime: 10,
      sourceDuration: 100,
      seek: vi.fn(),
    };
    (useAudioStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => selector(mockState));

    render(<TransportDisplay />);

    // Check if time is displayed
    expect(screen.getByText('0:10.00')).toBeDefined();
    expect(screen.getByText('1:40.00')).toBeDefined(); // 100s

    // Check input presence
    const input = screen.getByLabelText('Seek');
    expect(input).toBeDefined();
    // In JSDOM, value attribute might reflect formatted value, checking numeric match
    expect(parseFloat((input as HTMLInputElement).value)).toBe(10);

    // Check structure for accessibility
    // Input should be before the track (we can't easily check visual order, but we can check existence)
    expect(input.classList.contains('peer')).toBe(true);
  });
});
