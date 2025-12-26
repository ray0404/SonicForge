# Data & State Flow Architecture

## 1. Introduction
Sonic Forge implements a strict **Unidirectional Data Flow**, inspired by the Flux architecture (Redux/Zustand). This ensures predictable behavior, easy debugging, and a clear separation between the "View" (React) and the "Model" (Audio Engine).

The golden rule is: **The UI never talks to the Engine directly.** The UI dispatches an action to the Store; the Store updates the State; the Engine subscribes to the State.

---

## 2. The Zustand Store (`useAudioStore`)
We use **Zustand** for state management because of its minimal boilerplate, transient update performance, and ability to exist outside the React component tree (which is crucial for the Audio Engine integration).

### 2.1 State Slice: The Rack
The core data structure is the `rack` array:
```typescript
interface AudioState {
  rack: RackModule[];
  // ... other global state
}

interface RackModule {
  id: string;        // UUID
  type: ModuleType;  // Enum
  bypass: boolean;
  parameters: Record<string, number>;
}
```

### 2.2 Actions
State mutations are handled by actions defined within the store.
- `addModule(type)`: Pushes a new module to the array.
- `removeModule(id)`: Filters the array.
- `updateModuleParam(id, key, value)`: Finds the module and updates the specific parameter value.
- `reorderModules(startIndex, endIndex)`: Moves a module in the chain (essential for signal flow).

---

## 3. The "Trinity" Update Cycle
When a user turns a knob, a specific sequence of events occurs. This is the **most critical flow** in the application.

1.  **User Interaction:** The user drags a `Knob` component in `LimiterUnit.tsx`.
2.  **Dispatch:** The component calls `updateModuleParam('module-1', 'threshold', -12)`.
3.  **State Update (Optimistic):** The Zustand store updates `state.rack[0].parameters.threshold` to `-12`.
    - **React Re-render:** The UI re-renders immediately to show the knob at the new position. This ensures 60fps responsiveness.
4.  **Side Effect (Engine):** The `AudioEngine` (or a subscriber middleware) detects the change.
    - *Note:* In our implementation, the Store action explicitly calls `audioEngine.updateModuleParam()` to avoid the overhead of a global subscription diff.
5.  **Audio Update:** The Engine calls `node.setParam()`.
6.  **DSP Update:** The AudioWorklet receives the new value on the next quantum.

---

## 4. Persistence & Hydration
Sonic Forge features a robust persistence layer to ensure work is never lost.

### 4.1 Auto-Save (IndexedDB)
We use `idb-keyval` to store the session state.
- **Trigger:** Every state change (debounced by 1000ms).
- **Storage:** The entire `rack` array and `masterVolume` are serialized to JSON and saved.
- **Hydration:** On page load, the app checks IndexedDB. If a session exists, it replaces the default state with the saved state.

### 4.2 Asset Persistence
Large binary files (IRs for Cab Sims, Source Audio) are handled differently.
- **Problem:** Storing 50MB of audio in Redux/Zustand freezes the main thread.
- **Solution:** We store only the **Asset ID** in the store. The actual `AudioBuffer` or `Blob` is stored in a separate IndexedDB store (`asset_store`).
- **Load Flow:**
    1.  Store hydrates.
    2.  Engine sees a `CabSim` module with `irAssetId: 'xyz'`.
    3.  Engine requests asset `'xyz'` from IndexedDB.
    4.  Asset is decoded and injected into the Convolver.

---

## 5. Visualizer Data Flow (The "Fast Path")
Visualizers (Spectrum Analyzers, Meters) cannot use the standard React state flow because updating React state 60 times a second triggers Garbage Collection and frame drops.

### The "Bypass" Pattern
1.  **Source:** The `AudioWorkletProcessor` or `AnalyserNode` generates data (Float32Array).
2.  **Transport:**
    - `AnalyserNode`: The UI uses `requestAnimationFrame` to query `getFloatFrequencyData()` directly from the node.
    - `AudioWorklet`: Sends data via `port.postMessage()`.
3.  **Render:** The React component uses a `ref` to a `<canvas>` element.
4.  **Loop:** A dedicated `requestAnimationFrame` loop inside the component draws the data to the canvas.
    - **Zero State:** React State is NOT updated. The data flows directly from Audio Node -> Canvas.

---

## 6. Project Files (.sfg)
A Project File is simply a JSON export of the Store State.
- **Export:** `JSON.stringify(state.rack)`.
- **Import:** `JSON.parse(file)`, validate schema, then `state.setRack(data)`.
- **Future:** To include assets in a project file, we would need to create a ZIP container (using something like `JSZip`) holding the `project.json` and the `.wav` assets.
