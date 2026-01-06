import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModuleShell } from './ModuleShell';
import { vi } from 'vitest';

describe('ModuleShell', () => {
    const mockProps = {
        title: 'Test Module',
        onBypass: vi.fn(),
        onRemove: vi.fn(),
        isBypassed: false,
    };

    it('renders with correct title', () => {
        render(<ModuleShell {...mockProps}><div>Content</div></ModuleShell>);
        expect(screen.getByText('Test Module')).toBeInTheDocument();
    });

    it('renders bypass toggle with correct accessibility attributes', () => {
        render(<ModuleShell {...mockProps}><div>Content</div></ModuleShell>);
        const bypassBtn = screen.getByRole('switch', { name: /bypass module/i });
        expect(bypassBtn).toBeInTheDocument();
        expect(bypassBtn).toHaveAttribute('aria-checked', 'true'); // Not bypassed = enabled = true? Logic in component: !isBypassed

        // Check when bypassed
        render(<ModuleShell {...mockProps} isBypassed={true}><div>Content</div></ModuleShell>);
        const enableBtn = screen.getByRole('switch', { name: /enable module/i });
        expect(enableBtn).toBeInTheDocument();
        expect(enableBtn).toHaveAttribute('aria-checked', 'false');
    });

    it('renders remove button with correct accessibility attributes', () => {
        render(<ModuleShell {...mockProps}><div>Content</div></ModuleShell>);
        const removeBtn = screen.getByRole('button', { name: /remove module/i });
        expect(removeBtn).toBeInTheDocument();
        expect(removeBtn).toHaveClass('focus:opacity-100');
    });
});
