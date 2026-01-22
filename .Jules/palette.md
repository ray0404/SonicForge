# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2025-05-27 - Hover-Only Controls
**Learning:** Hover-only controls (using `opacity-0 group-hover:opacity-100`) create keyboard traps where users can focus invisible elements but not see them.
**Action:** Always add `focus:opacity-100` and `focus-visible` styles to any element that is hidden by default but reachable via keyboard.
