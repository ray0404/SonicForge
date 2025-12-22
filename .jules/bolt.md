## 2024-05-22 - Memory Allocation in Render Loops
**Learning:** Allocating objects (like `Uint8Array`) inside `requestAnimationFrame` loops causes high garbage collection pressure, leading to frame drops in audio visualizers.
**Action:** Always allocate buffers outside the render loop or cache them using `useRef`, resizing only when necessary.
