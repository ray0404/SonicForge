# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-24 - Mobile Accessibility
**Learning:** Responsive buttons that hide text labels (e.g., `hidden sm:inline`) lose their accessible name on mobile devices, making them invisible to screen readers despite having an icon.
**Action:** Always add an explicit `aria-label` to buttons that conditionally hide their text content, ensuring the accessible name is consistent across all breakpoints.
