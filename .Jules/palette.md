# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-24 - Responsive Text & Accessible Names
**Learning:** Buttons that hide text on mobile (e.g., using `hidden sm:inline`) lose their accessible name if they don't have an `aria-label`, as `display: none` removes the text from the accessibility tree.
**Action:** Always add explicit `aria-label` to buttons that use responsive classes to hide their text content, ensuring they remain accessible on all screen sizes.
