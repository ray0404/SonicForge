# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-24 - Focus Visibility on Hover-Only Controls
**Learning:** Interactive elements hidden via `opacity-0` (like "remove" buttons) become invisible keyboard traps. Tabbing to them works, but the user sees nothing.
**Action:** Ensure such elements have `focus:opacity-100` and explicit `focus-visible` styles to reveal them during keyboard navigation.
