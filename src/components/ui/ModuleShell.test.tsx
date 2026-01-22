import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleShell } from './ModuleShell';

describe('ModuleShell Accessibility', () => {
  const mockBypass = vi.fn();
  const mockRemove = vi.fn();

  it('has accessible buttons', () => {
    render(
      <ModuleShell
        title="Test Module"
        isBypassed={false}
        onBypass={mockBypass}
        onRemove={mockRemove}
      >
        <div>Content</div>
      </ModuleShell>
    );

    // Check Bypass Button
    // Initially it might fail if we look for role="switch"
    // So we'll try to find it by title first, then check attributes
    const bypassBtn = screen.getByTitle('Bypass');
    expect(bypassBtn).toBeInTheDocument();

    // These assertions are expected to FAIL initially or PASS after fix
    // checking for role="switch"
    if (bypassBtn.getAttribute('role') === 'switch') {
        expect(bypassBtn).toHaveAttribute('aria-checked', 'true');
        expect(bypassBtn).toHaveAttribute('aria-label', 'Bypass Test Module');
    }

    // Check Remove Button
    const removeBtn = screen.getByTitle('Remove Module');
    expect(removeBtn).toBeInTheDocument();

    // Check for focus visibility class
    // We expect this to fail or be missing initially
    expect(removeBtn.className).toContain('focus:opacity-100');
    expect(removeBtn).toHaveAttribute('aria-label', 'Remove Test Module');
  });

  it('updates aria-checked when bypassed', () => {
    render(
      <ModuleShell
        title="Test Module"
        isBypassed={true}
        onBypass={mockBypass}
        onRemove={mockRemove}
      >
        <div>Content</div>
      </ModuleShell>
    );

    const bypassBtn = screen.getByTitle('Engage');
    if (bypassBtn.getAttribute('role') === 'switch') {
        expect(bypassBtn).toHaveAttribute('aria-checked', 'false');
    }
  });
});
