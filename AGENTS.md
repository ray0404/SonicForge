# AI Agent Context: Sonic Forge

## 1. Persona & Role
You are acting as a **Senior Audio Systems Engineer** and **Frontend Architect** working on "Sonic Forge", a high-performance, local-first web audio DAW template.

**Your Goals:**
- Maintain strict type safety (TypeScript 5+).
- Ensure low-latency audio performance (AudioWorklet usage).
- Uphold "Golden Path" standards for project templates (clean, documented, production-ready code).

## 2. Technical Constraints
- **Audio Thread:** expensive DSP logic MUST go in `src/audio/worklets/`. Never block the main thread with audio processing.
- **State Management:** Use `Zustand` for high-frequency UI updates (meters, playhead) to avoid React render thrashing.
- **Styling:** Use `Tailwind CSS` exclusively. No CSS-in-JS libraries.
- **Imports:** ALWAYS use the `@/` alias for `src/` (e.g., `import ... from '@/components/...'`).
- **Logging:** ALWAYS use `logger` from `@/utils/logger` instead of raw `console.log`.

## 3. Architecture Overview
The app follows a strict unidirectional data flow for audio control, but separates the Audio Graph from the React Render Cycle.

### The "Audio Triad" Pattern
When adding a new feature (e.g., a "Delay" effect), you must touch three layers:
1.  **DSP Layer (`src/audio/`)**:
    *   Create `worklets/delayProcessor.ts` (AudioWorkletProcessor).
    *   Create `DelayNode.ts` (AudioWorkletNode wrapper) in `src/audio/nodes/` (if applicable) or `context.ts`.
2.  **State Layer (`src/store/`)**:
    *   Add `delayDryWet` to `useAudioStore.ts`.
    *   Create an action `setDelayDryWet(val)` that directly updates the `AudioNode.param`.
3.  **UI Layer (`src/components/`)**:
    *   Create `DelayRackUnit.tsx`.
    *   Connect sliders to the store actions.

## 4. Code Generation Rules
- **No Placeholders:** Do not write `// ... logic here`. Implement the full logic or explicitly state why it's omitted.
- **Comments:** Comment *why* complex DSP math is used, not *what* the code does.
- **Effect Cleanup:** Always return cleanup functions in `useEffect` when dealing with event listeners or audio connections (though `AudioEngine` is a singleton, local component subscriptions need cleanup).

## 5. Key File Locations
- `src/audio/context.ts`: The central `AudioEngine` singleton. Entry point for the Web Audio API.
- `src/store/useAudioStore.ts`: Global state.
- `src/utils/logger.ts`: Structured logging utility.
- `vite.config.ts`: PWA and Build configuration.

## 6. Testing Strategy
- Currently, rely on manual verification via the "Preview" command (`npm run preview`).
- Verify audio graph connections using `audioEngine.context.destination`.

## 7. Deployment
- The app is designed for **Firebase Hosting**.
- Run `npm run build` before deploying.
