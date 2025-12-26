# Component Library & Design System

## 1. Introduction
The Sonic Forge UI is built on a custom component library designed specifically for audio applications. Unlike standard web UIs (Bootstrap, Material), audio interfaces require specialized controls: precision knobs, responsive meters, and high-density layouts.

The design philosophy prioritizes **Function over Form**, mimicking the "Rack" aesthetic of hardware units while leveraging the flexibility of CSS Grid and Flexbox.

---

## 2. The "Atomic" Design Hierarchy

### 2.1 Atoms (Primitives)
The building blocks of the interface.
- **`<Knob />`**: The primary input method.
    - **Features:** Vertical drag behavior, Shift-key for fine-tuning, Double-click to reset.
    - **SVG Rendering:** Uses SVG for crisp scaling at any resolution.
    - **Arc Math:** Maps a value (0-100) to an angle (-135deg to +135deg).
- **`<Toggle />`**: A skeuomorphic switch or button.
- **`<LED />`**: A simple status indicator (Green/Red/Off).
- **`<Label />`**: Typography standard for parameter names (usually uppercase, varying weights).

### 2.2 Molecules (Controls)
Combinations of atoms that form a functional unit.
- **`<ParameterControl />`**: Combines a `<Knob>`, a `<Label>`, and a textual `<ValueDisplay>` (e.g., "-6.0 dB").
- **`<Meter />`**: A canvas-based bar graph driven by analysis data.

### 2.3 Organisms (Modules)
Complete functional sections.
- **`<ModuleShell />`**: The container for every effect. Provides the "Hardware Faceplate" look, the Title Bar, Bypass Toggle, and Remove Button.
- **`<Rack />`**: The scrollable container that holds the list of Modules.

---

## 3. Visualization Strategy
Audio visualization requires drawing at 60fps. Doing this via React Render cycles (updating state) is too slow and causes UI jank. We use a **Direct Canvas Access** strategy.

### 3.1 The `ResponsiveCanvas` Hook
A custom hook/component that handles:
- **Resizing:** Observes the parent container size and scales the internal `<canvas>` resolution (DPI awareness) to look sharp on Retina screens.
- **Loop:** Sets up a `requestAnimationFrame` loop.
- **Context:** Exposes the `CanvasRenderingContext2D` to the consumer.

### 3.2 Drawing Logic
Visualizers (like the Spectrum Analyzer) obtain their data directly from the Audio Engine, bypassing the React store.

```tsx
const draw = (ctx, frameCount) => {
    // 1. Get Data
    // We access the AnalyserNode directly, NOT via props/state
    analyserNode.getFloatFrequencyData(dataArray);

    // 2. Clear
    ctx.clearRect(0, 0, width, height);

    // 3. Draw Path
    ctx.beginPath();
    for (let i = 0; i < len; i++) {
        // ... map frequency to x, decibel to y ...
        ctx.lineTo(x, y);
    }
    ctx.stroke();
};
```

---

## 4. Accessibility (A11y)
Audio tools are often used by visually impaired engineers. We strive for WCAG AA compliance.

### 4.1 Knob Accessibility
Since a `<Knob>` is just an `<div>` or `<svg>` visually, it must implement ARIA roles to be usable by screen readers.
- **Role:** `role="slider"`
- **Attributes:** `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`.
- **Keyboard Support:**
    - `Arrow Up/Right`: Increment.
    - `Arrow Down/Left`: Decrement.
    - `Home/End`: Min/Max.
    - `PageUp/PageDown`: Large steps.

### 4.2 Focus Management
The Rack supports keyboard navigation. Users can Tab through modules and controls. Focus styles are distinct (high contrast outlines) to aid navigation.

---

## 5. Theming & Styling
We use **Tailwind CSS** for layout and utility classes, but component-specific styling (like Knob gradients) is often handled in CSS Modules or inline styles for dynamic properties.

### 5.1 The "Dark Mode" Standard
Audio environments are typically dark to reduce eye strain in dimly lit studios.
- **Backgrounds:** Slate-900 / Zinc-900.
- **Accents:** Cyan-500 (Primary), Amber-500 (Warning), Rose-500 (Error/Clipping).
- **Text:** Slate-200 (Primary), Slate-500 (Labels).

### 5.2 Density
The UI is "information dense." Padding is minimized to fit as many controls as possible on the screen without scrolling. Knobs are sized at 48x48px or 64x64px standard.