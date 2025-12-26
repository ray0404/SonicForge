# Data & State Management

## 1. Introduction
State management in a DAW (Digital Audio Workstation) is uniquely challenging. It requires handling:
1.  **High-Frequency Updates:** VU meters updating at 60Hz.
2.  **Complex Nested Objects:** The audio graph topology (Modules inside Racks inside Groups).
3.  **Large Binary Assets:** User-imported audio files (20MB+ WAVs).
4.  **Serialization:** Saving/Loading projects to disk.

Sonic Forge addresses these challenges using a centralized, immutable state container (**Zustand**) coupled with a specialized persistence layer (**IndexedDB**).

---

## 2. The Store Architecture (`useAudioStore`)

### 2.1 Why Zustand?
We chose Zustand over Redux or Context API because:
- **Transient Updates:** It allows updating state without triggering re-renders of the entire component tree (via selectors).
- **Middleware:** It supports middleware for persistence and logging out of the box.
- **Outside-React Access:** The store can be imported and used directly in the `AudioEngine` class (`useAudioStore.getState()`), breaking the dependency cycle between React and the Audio subsystem.

### 2.2 The State Schema
The "Source of Truth" for the application is defined as:

```typescript
interface AudioState {
  // 1. System Status
  isInitialized: boolean;
  isPlaying: boolean;
  
  // 2. Playback Context
  masterVolume: number; // 0.0 to 1.0
  tempo: number;        // BPM

  // 3. The Graph (The most important part)
  rack: RackModule[];

  // 4. Asset Registry
  // Maps AssetUUID -> AudioBuffer (Decoded)
  // This is a "Transient Cache". It is NOT saved to localStorage.
  assets: Record<string, AudioBuffer>; 
}
```

### 2.3 The Rack Module Schema
```typescript
interface RackModule {
  id: string;        // UUID (v4)
  type: ModuleType;  // Enum: 'LIMITER', 'COMPRESSOR', etc.
  bypass: boolean;   // Soft-bypass (audio passes through)
  
  // A flat map of parameters.
  // We use a flat map instead of nested objects to simplify
  // the "updateParam" reducer logic.
  parameters: {
    threshold?: number;
    ratio?: number;
    frequency?: number;
    // ... dynamic keys based on type
  };
}
```

---

## 3. Persistence Strategy (Saving Your Work)
Saving a DAW project is not as simple as `JSON.stringify`.

### 3.1 The "Hybrid" Storage Model
Sonic Forge uses two different storage mechanisms depending on the data type.

| Data Type | Storage Mechanism | Reason |
| :--- | :--- | :--- |
| **Project Settings** | `localStorage` / `IndexedDB` | Small JSON text. Fast synchronous read. |
| **Audio Assets** | `IndexedDB` (Blob Store) | Large binary data. Cannot fit in localStorage (5MB limit). |

### 3.2 The Save Process
When the user clicks "Save":
1.  **Serialize:** The `rack` array is converted to JSON.
2.  **Asset Extraction:** Any parameters referring to assets (e.g., `irAssetId` in a Cab Sim) are identified.
3.  **Blob Storage:** The underlying `File` or `Blob` for those assets is saved to IndexedDB under the key `asset_${id}`.
4.  **State Storage:** The JSON object (containing the ID references) is saved to the main store.

### 3.3 The Load Process (Hydration)
1.  **State Load:** The JSON is parsed and the `rack` is populated. The UI renders immediately.
2.  **Lazy Asset Load:** The `AudioEngine` scans the rack for missing assets.
3.  **Fetch:** It queries IndexedDB for the missing Blobs.
4.  **Decode:** It uses `AudioContext.decodeAudioData()` to convert Blobs to `AudioBuffers`.
5.  **Inject:** The buffers are sent to the respective `AudioNodes`.

---

## 4. Optimization Techniques

### 4.1 Selector-Based Re-renders
To ensure 60fps performance, components only subscribe to the *exact* slice of state they need.

**Bad:**
```tsx
const { rack } = useAudioStore(); // Re-renders on ANY change to ANY module
```

**Good:**
```tsx
const threshold = useAudioStore(
  state => state.rack.find(m => m.id === id)?.parameters.threshold
); // Re-renders ONLY when this specific threshold changes
```

### 4.2 The "Transient" Update Pattern
For high-frequency updates (like a visualizer or a meter), we bypass the React State entirely.
- The `AudioWorklet` sends a message to the `Node`.
- The `Node` emits a standard DOM Event.
- The UI Component adds an event listener to the Node and updates a `ref` or draws to a `canvas`.
- **Zero React Re-renders involved.**

---

## 5. Project File Format (.sfg)
Sonic Forge Projects (`.sfg`) are standard JSON files.
```json
{
  "version": "1.0",
  "meta": {
    "created": 1703551200000,
    "author": "User"
  },
  "rack": [
    {
      "id": "abc-123",
      "type": "COMPRESSOR",
      "parameters": { "threshold": -24, "ratio": 4 }
    }
  ]
}
```
*Note: Currently, `.sfg` files do not embed audio assets. Sharing a project requires the recipient to have the same IRs/samples. Future versions will use a ZIP container to bundle assets.*