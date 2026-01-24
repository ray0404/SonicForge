import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleShell } from './ModuleShell';

describe('ModuleShell', () => {
  const defaultProps = {
    title: 'Test Module',
    onBypass: vi.fn(),
    onRemove: vi.fn(),
    isBypassed: false,
    children: <div>Content</div>,
  };

  it('renders title correctly', () => {
    render(<ModuleShell {...defaultProps} />);
    expect(screen.getByText('Test Module')).toBeInTheDocument();
  });

  it('has accessible bypass button', () => {
    render(<ModuleShell {...defaultProps} />);
    // Should have role="switch" and proper label
    const bypassButton = screen.getByRole('switch', { name: /enable test module/i }); // Since isBypassed=false, it means enabled/active
    expect(bypassButton).toBeInTheDocument();
    expect(bypassButton).toHaveAttribute('aria-checked', 'true');
  });

  it('has accessible remove button', () => {
    render(<ModuleShell {...defaultProps} />);
    const removeButton = screen.getByRole('button', { name: /remove test module/i });
    expect(removeButton).toBeInTheDocument();
    // Check for visibility classes
    expect(removeButton.className).toContain('focus:opacity-100');
  });
});
