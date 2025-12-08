# Sonic Forge (Audio Web App Template)

**Sonic Forge** is a production-ready, local-first project template designed for building high-performance audio applications on the web. It provides a robust "Golden Path" architecture combining **React 18**, **TypeScript**, and **Vite** with a pre-configured **AudioWorklet** engine and offline capabilities.

This template is opinionated, adhering to strict typing, component-driven architecture, and environment-agnostic development standards (perfect for Termux/Android, Raspberry Pi, or Cloud development).

## 🚀 Features

*   **Core Stack**: React 18, TypeScript 5, Vite 5.
*   **Audio Engine**: Singleton-based `AudioContext` management with a working `AudioWorklet` pipeline (custom GainNode example included).
*   **State Management**: `Zustand` for performant, transient UI state (handling audio meters, play state).
*   **Styling**: Tailwind CSS configured with `clsx` and `tailwind-merge` for dynamic classes.
*   **PWA / Offline-First**: configured `vite-plugin-pwa` with `CacheFirst` strategies for assets and app shell.
*   **Persistence**: `idb-keyval` abstraction for saving projects/audio blobs to IndexedDB.
*   **Remote Dev Ready**: Vite server configured to listen on `0.0.0.0` by default.

## 🛠️ Getting Started

### Prerequisites
*   Node.js 18+ (Recommended)
*   npm or pnpm

### Installation

1.  **Clone the template:**
    ```bash
    git clone <repository-url> my-audio-app
    cd my-audio-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    > The server listens on `0.0.0.0:3000`. You can access it via `http://localhost:3000` or your device's LAN IP (e.g., `http://192.168.1.X:3000`) for testing on mobile devices.

4.  **Build for Production:**
    ```bash
    npm run build
    npm run preview
    ```

## 🏗️ Architecture

### Directory Structure

```text
src/
├── audio/              # The heart of the application
│   ├── context.ts      # Singleton AudioEngine class (AudioContext lifecycle)
│   └── worklets/       # AudioWorklet processors (run on audio thread)
├── components/         # React UI Components
│   └── rack/           # Audio effects/routing UI
├── hooks/              # Custom React Hooks
│   └── useProjectPersistence.ts # Save/Load logic (IndexedDB)
├── store/              # Global State (Zustand)
│   └── useAudioStore.ts
├── main.tsx            # Entry point
└── vite-env.d.ts       # Vite types
```

### The Audio Engine (`src/audio/`)

This template moves beyond basic `useEffect` audio handling. It uses a singleton class `AudioEngine` (`src/audio/context.ts`) to manage the `AudioContext`.
*   **Worklets**: The engine automatically loads the `processor.js` worklet from `src/audio/worklets/`.
*   **Node Graph**: A sample graph is pre-connected: `Oscillator` -> `SonicGainNode (Worklet)` -> `Analyser` -> `Destination`.

### State Management

We use **Zustand** (`useAudioStore`) to bridge the gap between the imperative Audio API and React's declarative UI.
*   **Action**: User clicks "Play".
*   **Store**: Updates `isPlaying` to `true`.
*   **Effect**: Calls `audioEngine.playTestTone()`.

## 📦 Deployment

This project creates a static asset bundle perfect for **Firebase Hosting**, **Vercel**, or **GitHub Pages**.

### Deploy to Firebase (Recommended)

1.  **Initialize Firebase:**
    ```bash
    firebase init hosting
    ```
2.  **Configure:** Set `dist` as your public directory and "Yes" to single-page app (rewrites to index.html).
3.  **Deploy:**
    ```bash
    npm run build
    firebase deploy
    ```

## 🧩 Extension Points

*   **Audio Processing**: Add C++ DSP code using **WASM** or libraries like **Essentia.js** in `src/audio/worklets`.
*   **Storage**: Extend `useProjectPersistence` to sync with cloud storage (Firebase Storage, AWS S3).
*   **UI**: Add more rack units in `src/components/rack` using the existing patterns.

## 📄 License

MIT