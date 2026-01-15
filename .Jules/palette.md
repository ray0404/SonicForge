# Palette's Journal

This journal documents CRITICAL UX and accessibility learnings for the Sonic Forge project.

## 2024-05-23 - Accessibility Patterns
**Learning:** The project relies heavily on `div` elements with `onClick` handlers for interactive "cards" (like the file loader), which creates significant keyboard accessibility barriers.
**Action:** Always verify interactive elements are semantic `<button>`s or have full ARIA roles (`role="button"`, `tabIndex={0}`) and keyboard handlers (`onKeyDown`).

## 2024-05-24 - Custom Range Input Accessibility
**Learning:** Custom styled range inputs often hide the native `<input>` element with `opacity-0`, making keyboard focus invisible.
**Action:** Place the invisible `<input>` *before* the visual track element in the DOM and use the `peer` class on the input and `peer-focus-visible` styles on the track to reveal focus.
