# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2025-12-20 - Focus Visibility
**Learning:** Interactive elements hidden by default (opacity-0) for aesthetic reasons (e.g., "Remove Module" button) are invisible to keyboard users.
**Action:** Always add `focus:opacity-100` and visual focus indicators (rings) to elements that rely on hover for visibility.
