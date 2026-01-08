import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModuleShell } from './ModuleShell';

describe('ModuleShell', () => {
    const defaultProps = {
        title: 'Test Module',
        onBypass: vi.fn(),
        onRemove: vi.fn(),
        isBypassed: false,
        children: <div>Module Content</div>,
        dragHandleProps: {}
    };

    it('should render the title and content', () => {
        render(<ModuleShell {...defaultProps} />);
        expect(screen.getByText('Test Module')).toBeInTheDocument();
        expect(screen.getByText('Module Content')).toBeInTheDocument();
    });

    it('should have an accessible drag handle', () => {
        render(<ModuleShell {...defaultProps} />);
        const handle = screen.getByRole('button', { name: /Drag to reorder/i });
        expect(handle).toBeInTheDocument();
    });

    it('should have an accessible bypass switch with correct state', () => {
        const { rerender } = render(<ModuleShell {...defaultProps} />);

        // Initial state: Not bypassed (Enabled)
        const switchBtn = screen.getByRole('switch', { name: /Bypass Module/i });
        expect(switchBtn).toBeInTheDocument();
        expect(switchBtn).toBeChecked(); // aria-checked=true because !isBypassed is true

        // Bypassed state
        rerender(<ModuleShell {...defaultProps} isBypassed={true} />);
        const switchBtnBypassed = screen.getByRole('switch', { name: /Enable Module/i });
        expect(switchBtnBypassed).toBeInTheDocument();
        expect(switchBtnBypassed).not.toBeChecked(); // aria-checked=false because !isBypassed is false
    });

    it('should have an accessible remove button that becomes visible on focus', () => {
        render(<ModuleShell {...defaultProps} />);
        const removeBtn = screen.getByRole('button', { name: /Remove Module/i });
        expect(removeBtn).toBeInTheDocument();

        // Check for focus class
        expect(removeBtn.className).toContain('focus:opacity-100');
    });

    it('should call callbacks when interacted with', () => {
        render(<ModuleShell {...defaultProps} />);

        const switchBtn = screen.getByRole('switch', { name: /Bypass Module/i });
        fireEvent.click(switchBtn);
        expect(defaultProps.onBypass).toHaveBeenCalled();

        const removeBtn = screen.getByRole('button', { name: /Remove Module/i });
        fireEvent.click(removeBtn);
        expect(defaultProps.onRemove).toHaveBeenCalled();
    });
});
