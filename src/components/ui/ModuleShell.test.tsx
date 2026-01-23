import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleShell } from './ModuleShell';

describe('ModuleShell', () => {
    const defaultProps = {
        title: 'Test Module',
        onBypass: vi.fn(),
        onRemove: vi.fn(),
        isBypassed: false,
        children: <div>Module Content</div>,
    };

    it('renders the bypass button with correct ARIA attributes', () => {
        render(<ModuleShell {...defaultProps} />);

        // Should have role="switch"
        const switchBtn = screen.getByRole('switch', { name: /Bypass Test Module/i });
        expect(switchBtn).toBeInTheDocument();

        // Should be checked when NOT bypassed (Active) or checked when bypassed?
        // Usually "switch" implies "Power" or "Enabled".
        // If the button is "Bypass", checked=true might mean "Bypassed".
        // Let's assume the button represents the "Active" state if it's a power switch,
        // OR the "Bypassed" state if it's a bypass switch.
        // The current implementation styling suggests it's an "Active" LED (green when !isBypassed).
        // However, the prop is `isBypassed`.
        // If I name it "Bypass [Module]", then aria-checked=true means it IS bypassed.
        // If I name it "Enable [Module]", then aria-checked=true means it IS active.

        // Current implementation:
        // isBypassed ? "bg-slate-800" (Dark) : "bg-active-led" (Green)
        // This looks like a Power/Active light.
        // So I should probably name it "Enable [Module]" or "Toggle Bypass".
        // Let's stick to "Bypass Test Module" for now as the label, and aria-checked={isBypassed}.

        expect(switchBtn).toHaveAttribute('aria-checked', 'false');
    });

    it('renders the remove button with correct ARIA label and visibility classes', () => {
        render(<ModuleShell {...defaultProps} />);

        const removeBtn = screen.getByRole('button', { name: /Remove Test Module/i });
        expect(removeBtn).toBeInTheDocument();

        // Check for accessibility class
        expect(removeBtn.className).toContain('focus:opacity-100');
    });

    it('updates aria-checked when bypassed', () => {
        render(<ModuleShell {...defaultProps} isBypassed={true} />);

        const switchBtn = screen.getByRole('switch', { name: /Bypass Test Module/i });
        expect(switchBtn).toHaveAttribute('aria-checked', 'true');
    });
});
