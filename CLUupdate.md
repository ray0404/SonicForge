# Blueprint Prompt: SonicForge CLI/TUI Integration

**Role:** Senior Full-Stack Architect & Systems Engineer
**Objective:** Add a Command Line Interface (CLI) and Text User Interface (TUI) to the existing "SonicForge" React/Vite PWA.
**Constraint:** Must maintain 100% compatibility with the existing Web Audio API logic and `AudioWorklet` processors without rewriting the DSP engine in C++ or Python.

## 1. Architectural Strategy: The "Headless Bridge"

Since SonicForge relies on `AudioContext` and `AudioWorklet` (browser-native APIs that do not exist in Node.js), we cannot simply run the existing TypeScript code directly in Node.

**The Solution:**

1. **The Host (Node.js):** Runs the TUI (using `Ink` + React) and handles file system access (reading audio files from disk).
2. **The Engine (Puppeteer):** Spawns a lightweight, headless Chrome instance that loads the SonicForge "engine" (a stripped-down version of the app).
3. **The Bridge:** Communication occurs via WebSocket or Puppeteer's `page.evaluate()` to send commands (e.g., "Load this ArrayBuffer", "Set Threshold to -10dB", "Render Offline") and receive metering data back.

## 2. Tech Stack Additions

* **Ink (`ink`, `ink-text-input`, `ink-spinner`):** To build the TUI using React components (keeps code style consistent with the main app).
* **Puppeteer (`puppeteer-core`):** To run the audio engine headlessly.
* **Commander (`commander`):** For parsing CLI arguments (e.g., `sonicforge render -i input.wav -o output.wav`).
* **Express (`express`):** A tiny local server to serve the `AudioWorklet` files to the headless instance (browsers block loading worklets from `file://`).

## 3. Implementation Plan (Step-by-Step)

### Phase 1: The Headless Entry Point (`/src/headless-entry.tsx`)

Create a simplified entry point that loads *only* the audio engine, bypassing the visual DOM elements of the standard web App.

* **Action:** Create `src/main-headless.tsx`.
* **Logic:**
1. Initialize `useAudioStore`.
2. Expose a global window object `window.__SONICFORGE_BRIDGE__`.
3. This bridge must expose methods: `loadAudio(arrayBuffer)`, `updateParam(moduleId, paramId, value)`, `startRendering()`, `getMeteringData()`.
4. Disable all React visual rendering (render `null` or a generic `<div id="headless-mount" />`).



### Phase 2: The CLI Controller (`/cli/index.ts`)

This is the Node.js entry point.

* **Action:** Create directory `cli/` and `cli/index.ts`.
* **Logic:**
1. Use `commander` to define commands:
* `sonicforge start`: Opens the Interactive TUI.
* `sonicforge process -i <file> -p <preset> -o <out>`: "One-shot" processing.


2. Spin up a temporary local Express server on a random port (e.g., 3000) pointing to `dist/` (build output).



### Phase 3: The Puppeteer Manager (`/cli/engine/audio-bridge.ts`)

This class manages the connection between Node and the Browser.

* **Logic:**
1. Launch Puppeteer.
2. Navigate to `http://localhost:3000/headless.html`.
3. **Inject Audio:** Node reads the target `.wav` file -> Converts to base64 -> Sends to Puppeteer -> Browser converts back to ArrayBuffer -> Decodes via Web Audio API.
4. **Event Loop:** Poll the metering data from the browser every 100ms and emit events to the Node.js TUI.



### Phase 4: The TUI Implementation (`/cli/ui/`)

Since we are using **Ink**, we can reuse the mental model of React components.

* **Components needed:**
* `<App />`: The main CLI layout.
* `<MeterBar />`: A text-based representation of your `LEDBar.tsx` (using characters like `|`, `█`, `░`).
* `<KnobControl />`: Maps keyboard arrows (Left/Right) to increment/decrement values.
* `<ModuleList />`: Selectable list of active modules.



## 4. Specific Coding Prompts (Copy/Paste these to AI)

### Step 1: Dependencies & Setup

> "Analyze `package.json`. Add dependencies for `ink`, `react-reconciler`, `puppeteer`, `commander`, `express`, and `cors`. Update `vite.config.ts` to create a multi-page build: one for `index.html` (the web app) and one for `headless.html` (the stripped-down engine for CLI use)."

### Step 2: The Bridge (Browser Side)

> "Create a file `src/bridge/HeadlessController.ts`. This class should utilize the existing `useAudioStore` and `AudioContext`. It needs to attach a function to `window` called `receiveCommand`. It should handle these commands: `LOAD_FILE`, `SET_PARAM`, `EXPORT_OFFLINE`. Ensure it waits for `AudioContext` to be 'ready' before accepting commands."

### Step 3: The CLI Infrastructure (Node Side)

> "Create `cli/runner.ts`. This script should:
> 1. Start a static file server serving the `./dist` folder.
> 2. Launch Puppeteer.
> 3. Expose a function `injectFile(filePath)` that reads a file from Node `fs`, converts it to a buffer, and passes it to the browser page.
> 4. Handle the specific `OfflineAudioContext` rendering process by waiting for the browser to return the rendered buffer."
> 
> 

### Step 4: Visualizing in Terminal (TUI)

> "Create an Ink component `cli/ui/TerminalMastering.tsx`.
> 1. It should accept props for `inputLevel`, `outputLevel`, and `gainReduction`.
> 2. Render these levels as ASCII bars (e.g., `[||||||||||.....] -6dB`).
> 3. Connect this component to the Puppeteer bridge to update 10 times per second."
> 
> 

## 5. Definition of Done

1. **Build Command:** `npm run build:cli` compiles the React/Vite project *and* the Node.js TypeScript CLI code.
2. **Execution:** Running `node dist/cli/index.js start` launches the TUI.
3. **Functionality:**
* Can load a local WAV file.
* The "headless" browser loads existing AudioWorklets (`BitCrusherNode`, etc.) without error.
* The Terminal shows active metering while audio plays (simulated or real-time).
* Changing a parameter in the Terminal (e.g., Threshold) instantly affects the audio processing in the headless instance.



## 6. Security & Performance Notes

* **Security:** The local Express server used by the CLI should bind only to `127.0.0.1`.
* **Performance:** The TUI visualization loop should be throttled to 15-30fps to prevent Node.js CPU spikes from interfering with the IPC (Inter-Process Communication) bridge.
