# Sonic Forge ⚡

**Professional Audio Mastering in the Browser.**

Sonic Forge is a local-first Progressive Web App (PWA) that brings desktop-class audio processing to the web. It leverages **AudioWorklets** and **WebAssembly (Zig)** to deliver zero-latency real-time effects and high-performance offline processing.

![Sonic Forge Screenshot](public/screenshot-desktop.png)

## ✨ Features

*   **Real-time Effects Rack:**
    *   Parametric EQ, Compressor, Limiter, Saturation, and more.
    *   Zero-latency processing using AudioWorklets.
    *   Drag-and-drop module ordering.
*   **Smart Processing (New!):**
    *   Powered by **Zig & WebAssembly**.
    *   **Loudness Normalization:** Target specific LUFS levels.
    *   **Phase Rotation:** Recover headroom.
    *   **De-Clipper:** Repair digital clipping artifacts.
    *   **Spectral Denoise:** Remove background noise.
*   **Multi-Track Mixer:**
    *   Volume, Pan, Mute, Solo for multiple audio tracks.
    *   Master Bus processing.
*   **Local-First:**
    *   All processing happens on your device.
    *   Projects auto-save to IndexedDB.
    *   Works offline.
*   **CLI Tool:**
    *   Headless audio processing via command line.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **State:** Zustand
*   **Audio:** Web Audio API, `standardized-audio-context`
*   **DSP:** AudioWorklet (JS), Zig (WASM)
*   **CLI:** Ink, Puppeteer

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+
*   **Zig 0.13.0+** (Required for building WASM modules)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/sonic-forge.git
    cd sonic-forge
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the WASM DSP engine:
    ```bash
    npm run build:wasm
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open `http://localhost:5173` in your browser.

## 🏗️ Building

*   **Web App:** `npm run build`
*   **CLI Tool:** `npm run build:cli`
*   **WASM Module:** `npm run build:wasm`

## 🧩 Smart Processing Workflow

The "Smart Processing" panel allows you to repair and enhance audio in two ways:

1.  **Project Track Mode:** Select a track in your project and apply effects destructively. Includes Undo/Redo history.
2.  **External File Mode:** Upload a file, process it, preview the results on a timeline, and download the processed WAV file—all without importing it into your project.

## 📄 License

MIT
