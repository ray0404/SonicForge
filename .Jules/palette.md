# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-23 - Responsive Accessibility
**Learning:** Icon-only buttons that rely on helper classes like `hidden sm:inline` to show text only on desktop become completely unlabeled on mobile devices.
**Action:** Always include an explicit `aria-label` on buttons where the visible text label might be hidden by CSS media queries.
