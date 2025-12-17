# Developer Guide

## Setup

SonicForge is a standard Vite/React project.

```bash
# 1. Install Dependencies
npm install

# 2. Start Dev Server
npm run dev
# Opens at http://localhost:5173
```

## Project Structure

*   **`src/audio/worklets`**: Pure JS files here! Do not write TypeScript for `*-processor.js` files unless you have a build step configured to transpile them separately. They run in a separate thread context.
*   **`src/components/rack`**: Add new module UI components here.

## Adding a New Effect

To add a new effect (e.g., "Chorus"):

1.  **DSP:** Create `src/audio/worklets/chorus-processor.js`.
2.  **Node:** Create `src/audio/worklets/ChorusNode.ts`. Register params.
3.  **UI:** Create `src/components/rack/ChorusUnit.tsx`.
4.  **Store:** Update `useAudioStore.ts`:
    *   Add `'CHORUS'` to `RackModuleType`.
    *   Add default parameters in `addModule`.
5.  **Engine:** Update `src/audio/context.ts`:
    *   Load the worklet in `init()`.
    *   Add case in `createModuleNode`.
6.  **Registry:** Add to `EffectsRack.tsx` menu.

## Testing

We use **Vitest** for unit testing logic.

```bash
# Run all tests
npm test

# Run with UI (optional)
npm run test -- --ui
```

### What to Test?
*   **DSP Helpers:** `src/audio/worklets/lib/dsp-helpers.test.js` covers math functions.
*   **Store Logic:** `src/store/useAudioStore.test.ts` covers adding/removing modules and state updates.

## Linting & Formatting

```bash
npm run lint
```
Enforces TypeScript strict mode and React Hooks rules.
