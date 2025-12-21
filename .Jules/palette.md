# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-24 - Module Accessibility
**Learning:** Module controls (Remove, Drag) were hidden via `opacity-0` until hover, making them invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (and `focus-visible:ring`) to any interactive element that is visually hidden by default to ensure keyboard discoverability.
