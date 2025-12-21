import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleShell } from './ModuleShell';

describe('ModuleShell', () => {
  const defaultProps = {
    title: 'Test Module',
    onBypass: vi.fn(),
    onRemove: vi.fn(),
    isBypassed: false,
    dragHandleProps: { role: 'button', tabIndex: 0 },
  };

  it('renders the title', () => {
    render(<ModuleShell {...defaultProps}><div>Content</div></ModuleShell>);
    expect(screen.getByText('Test Module')).toBeInTheDocument();
  });

  it('has accessible active switch', () => {
    // isBypassed=false means Active
    render(<ModuleShell {...defaultProps} isBypassed={false}><div>Content</div></ModuleShell>);

    // Label should be "Active" or similar
    const bypassSwitch = screen.getByRole('switch', { name: /active/i });
    expect(bypassSwitch).toBeInTheDocument();

    // Active = true
    expect(bypassSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('updates aria-checked when bypassed', () => {
    // isBypassed=true means Inactive
    render(<ModuleShell {...defaultProps} isBypassed={true}><div>Content</div></ModuleShell>);
    const bypassSwitch = screen.getByRole('switch', { name: /active/i });

    // Active = false
    expect(bypassSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it('has accessible remove button', () => {
    render(<ModuleShell {...defaultProps}><div>Content</div></ModuleShell>);
    const removeButton = screen.getByRole('button', { name: /remove module/i });
    expect(removeButton).toBeInTheDocument();
  });

  it('has accessible drag handle', () => {
    render(<ModuleShell {...defaultProps}><div>Content</div></ModuleShell>);
    const dragHandle = screen.getByLabelText(/drag to reorder test module/i);
    expect(dragHandle).toBeInTheDocument();
  });
});
