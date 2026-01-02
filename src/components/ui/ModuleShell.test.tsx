import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleShell } from './ModuleShell';

describe('ModuleShell', () => {
    const defaultProps = {
        title: 'Test Module',
        onBypass: vi.fn(),
        onRemove: vi.fn(),
        isBypassed: false,
        dragHandleProps: {},
    };

    it('renders with correct title', () => {
        render(<ModuleShell {...defaultProps}><div>Content</div></ModuleShell>);
        expect(screen.getByText('Test Module')).toBeInTheDocument();
    });

    it('bypass button has accessible attributes', () => {
        render(<ModuleShell {...defaultProps} />);

        // Use getByRole which implicitly verifies the role exists
        const bypassButton = screen.getByRole('switch', { name: /bypass module/i });
        expect(bypassButton).toHaveAttribute('aria-checked', 'true');

        // Test engaged state
        expect(bypassButton).toHaveAttribute('title', 'Bypass');
    });

    it('bypass button updates aria attributes when bypassed', () => {
        render(<ModuleShell {...defaultProps} isBypassed={true} />);

        const bypassButton = screen.getByRole('switch', { name: /activate module/i });
        expect(bypassButton).toHaveAttribute('aria-checked', 'false');
    });

    it('remove button is accessible via keyboard and has label', () => {
        render(<ModuleShell {...defaultProps} />);

        const removeButton = screen.getByRole('button', { name: /remove test module module/i });

        // Check for focus opacity class
        expect(removeButton).toHaveClass('focus:opacity-100');
        expect(removeButton).toHaveClass('focus:text-red-500');
    });

    it('drag handle has button role and label', () => {
        render(<ModuleShell {...defaultProps} />);

        const dragHandle = screen.getByRole('button', { name: /drag handle/i });
        expect(dragHandle).toBeInTheDocument();
    });
});
