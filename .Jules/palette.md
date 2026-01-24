# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2026-01-24 - Hidden Interactive Elements
**Learning:** Action buttons hidden via `opacity-0` (like the "Remove Module" button) create keyboard traps because they receive focus but remain invisible to the user.
**Action:** Ensure any `opacity-0` interactive element has `focus:opacity-100` and `focus-visible:opacity-100` classes, along with distinct focus rings.
