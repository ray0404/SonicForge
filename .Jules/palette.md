# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2025-12-22 - Keyboard Focus Visibility
**Learning:** Interactive actions hidden with `opacity-0` (showing only on hover) create "invisible focus" traps for keyboard users.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` to ensure the element becomes visible when it receives focus via tab navigation.
