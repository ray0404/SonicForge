# Data & State

## Zustand Store (`useAudioStore.ts`)

The application state is centralized in a single Zustand store.

### Store Schema

```typescript
interface AudioState {
  // System Flags
  isInitialized: boolean;
  isPlaying: boolean;
  
  // Playback State
  sourceDuration: number;
  currentTime: number;
  masterVolume: number; // 0.0 - 1.0

  // The Graph
  rack: RackModule[];

  // Resource Cache
  assets: Record<string, AudioBuffer>; // Decoded audio files
}
```

### RackModule Interface

```typescript
interface RackModule {
  id: string;       // UUID
  type: string;     // 'LIMITER', 'DYNAMIC_EQ', etc.
  bypass: boolean;
  parameters: Record<string, any>; // Flexible param store
}
```

## Persistence Strategy

SonicForge uses a hybrid persistence model:

### 1. IndexedDB (`idb-keyval`)
Used for **Session Restoration** and **Large Assets**.

*   **`current_session_state`**: Stores the JSON object of the `rack` and `masterVolume`.
*   **`asset_{UUID}`**: Stores raw `File` objects (Blobs). We do NOT store decoded AudioBuffers in IDB (too large/complex). We re-decode them on load.

### 2. File System Access API
Used for **Project Files** (`.wav` or custom formats).

*   Handled by `useProjectPersistence.ts`.
*   Allows direct "Save" (overwrite) without opening a file picker every time.
*   **Fallback:** If the browser doesn't support FS API, it falls back to downloading the Blob.

## Asset Loading Flow

1.  User drops a file (IR or Source).
2.  File is converted to `ArrayBuffer` -> `decodeAudioData` -> `AudioBuffer` (Memory).
3.  Original `File` object is saved to IDB as `asset_{id}`.
4.  `assetId` is stored in the `RackModule` parameters.
5.  **On Reload:**
    *   Store loads `rack` config.
    *   Store sees `assetId` in params.
    *   Store fetches `asset_{id}` from IDB.
    *   Store decodes it again and populates `state.assets`.
