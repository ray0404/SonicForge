# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-24 - Custom Toggles
**Learning:** Visual toggle indicators (like LED buttons) often lack semantic state communication.
**Action:** Use `role='switch'` and `aria-checked` for custom toggle buttons to ensure screen readers announce the state (on/off) rather than just the label.
