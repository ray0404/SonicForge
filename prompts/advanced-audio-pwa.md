# The "Sonic Forge" (Advanced Audio PWA)

​**Intent:** A pro-level audio processing web app foundation.
**Key Features:** AudioWorklet setup, Offline-first, large file handling.

## Project Specification: "Sonic Forge" Audio PWA Template

**Role:** Senior Audio Software Architect
**Task:** Generate a comprehensive, production-ready project template for a High-Performance Digital Audio Workstation (DAW) web application.

### 1. Technical Stack
* **Core:** React 18+ (TypeScript)
* **Build System:** Vite (Configured for speed and HMR)
* **State Management:** Zustand (for transient UI state)
* **Audio Engine:** Native Web Audio API utilizing `AudioWorklet` for DSP (to avoid main thread blocking).
* **Styling:** Tailwind CSS (configured for dark mode by default).

### 2. PWA & Offline Strategy (Critical)
* **Library:** `vite-plugin-pwa`
* **Strategy:** "Cache First, falling back to Network" for all static assets and core shells.
* **Persistence:** Implement a custom hook wrapping the **File System Access API** (with a fallback to IndexedDB for mobile compatibility) to allow saving/loading large `.wav`/`.mp3` projects locally without server interaction.

### 3. Architecture & Scaffolding
Please scaffold the following directory structure and core files:
* `/src/audio/`: Contains the `AudioContext` singleton manager.
* `/src/audio/worklets/`: Contains a sample `processor.js` (e.g., a simple Gain or Bitcrusher) and the corresponding Node wrapper.
* `/src/components/rack/`: A UI skeleton for an "Effects Rack".
* `/src/utils/logger.ts`: A custom logging utility that writes distinct, timestamped logs to the console (essential for debugging in CLI/Mobile environments where DevTools are hard to access).

### 4. Developer Experience Requirements
* **Linting:** ESLint + Prettier pre-configured.
* **Scripts:** Include a `Makefile` with `install`, `dev`, and `build` commands.
* **Environment:** Ensure compatibility with Termux (Android) and generic Linux environments.
* **Output:** Do not ask for clarification. Generate the full directory structure, configuration files (vite, tsconfig, manifest), and the core source code to make this runnable immediately.
