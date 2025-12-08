# Context: Sonic Forge (TEMPLATE_audio-web-app)

## 1. Project Overview
**Sonic Forge** is a production-ready, local-first web audio application template. It is designed to serve as a "Golden Path" starting point for building high-performance audio apps (DAWs, Synthesizers, Audio Editors) that work seamlessly across devices, including mobile (Android/Termux) and low-power devices (Raspberry Pi).

**Core Philosophy:**
- **Environment Agnostic:** Works on localhost, remote dev servers (0.0.0.0), and offline.
- **Strict Typing:** No `any`. Full TypeScript compliance.
- **Architecture First:** Separation of concerns between UI (React), State (Zustand), and Audio (AudioContext/Worklets).

## 2. Technical Stack

| Layer | Technology | Key Library/Pattern |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Functional Components, Hooks |
| **Language** | TypeScript 5 | Strict Mode, Path Aliases (`@/*`) |
| **Build Tool** | Vite 5 | HMR, PWA Plugin, `0.0.0.0` Host |
| **State** | Zustand | Transient UI state, Audio Bridge |
| **Audio** | Web Audio API | `AudioContext`, `AudioWorklet`, `WASM` (Ready) |
| **Styling** | Tailwind CSS | Utility-first, `clsx`, `tailwind-merge` |
| **Persistence** | IndexedDB | `idb-keyval` (Binary/Blob storage) |
| **PWA** | Vite PWA | Service Workers, CacheFirst strategy |

## 3. Architecture & Key Files

### Audio Engine (`src/audio/`)
The application uses a **Singleton Pattern** for the `AudioEngine` class to manage the `AudioContext` lifecycle outside of the React render cycle.
- **`src/audio/context.ts`**: The `AudioEngine` class. Initializes the context, loads worklets, and manages the node graph.
- **`src/audio/worklets/`**: Contains raw JS/TS AudioWorklet processors. These run on the high-priority audio thread.
    - **Note:** Worklets are imported via Vite's worker URL suffix (`?worker&url`).

### State Management (`src/store/`)
**Zustand** is used to bridge React and the imperative Audio Engine.
- **`src/store/useAudioStore.ts`**:
    - **Actions**: Trigger audio engine methods (`initializeEngine`, `playTestTone`).
    - **State**: Reflects engine status (`isPlaying`, `masterVolume`) back to the UI.

### UI Components (`src/components/`)
- **`src/components/rack/`**: Patterns for "Rack" style audio effect units.

### Configuration
- **`vite.config.ts`**: Configured for PWA (manifest, service workers) and remote access (`host: true`).
- **`tsconfig.json`**: Defines path alias `@/` -> `src/`.
- **`Makefile`**: Shortcuts for common tasks.

## 4. Development Workflow

### Commands
| Task | Command | Description |
| :--- | :--- | :--- |
| **Install** | `npm install` | Install dependencies |
| **Dev** | `npm run dev` | Start dev server on `0.0.0.0:3000` |
| **Build** | `npm run build` | Compile for production |
| **Preview** | `npm run preview` | Serve production build locally |
| **Lint** | `npm run lint` | Run ESLint |

### Common Tasks
- **Adding an Audio Effect:**
    1.  Create a processor in `src/audio/worklets/`.
    2.  Register it in `AudioEngine.init()` (`src/audio/context.ts`).
    3.  Create a Node wrapper class.
    4.  Add controls to `useAudioStore`.
    5.  Create a UI component in `src/components/rack/`.

## 5. Coding Conventions
- **Logging:** Use `src/utils/logger.ts` instead of `console.log` for structured, leveled logging.
- **Files:** React components use `.tsx`. Audio logic uses `.ts`. Worklet processors use `.js` (or `.ts` if compiled).
- **Styles:** Use Tailwind utility classes. Use `clsx` for conditional styling.
- **Path Imports:** Always use the alias `@/` for internal imports (e.g., `import { logger } from '@/utils/logger'`).

## 6. Persona: Template Architect
*You are the Template Architect. When modifying this project, maintain its status as a "Golden Path" template.*
- **No Placeholders:** Ensure new code is functional and complete.
- **Test Compatibility:** Verify changes do not break the build on ARM64 or mobile browsers.
- **Documentation:** Update `README.md` if architecture changes significantly.
