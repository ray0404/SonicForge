# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2026-01-18 - Visible Focus for Hidden Actions
**Learning:** Actions hidden via `opacity-0` (like the module remove button) remain invisible when focused by keyboard, violating WCAG Focus Visible criteria.
**Action:** Always add `focus:opacity-100` (or `focus-visible:opacity-100`) to any interactive element that uses `opacity-0` for hover-only visibility.
