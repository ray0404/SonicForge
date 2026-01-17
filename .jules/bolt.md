## 2026-01-17 - React DnD Performance
**Learning:** In `@dnd-kit` implementations, spreading `attributes` and `listeners` inline (e.g., `{...attributes, ...listeners}`) creates new object references on every render, defeating `React.memo` in child components.
**Action:** Always memoize `dragHandleProps` using `useMemo` before passing it to memoized child components to ensure stable props.

## 2026-01-17 - Rack Module Memoization
**Learning:** When rendering a list of complex components (like audio effects) from a single global store, updating one item triggers a re-render of the list parent, which cascades to all items if they aren't memoized.
**Action:** Use a memoized container component (like `RackModuleContainer`) for each list item that accepts the item data and stable store actions as props, isolating re-renders to only the changed item.
