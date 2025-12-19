# Executive Summary

**SonicForge** is a production-ready, local-first web audio application designed for building high-performance audio tools. It serves as a foundational template for DAWs, Mastering Suites, and Effect Racks, running entirely in the browser using the Web Audio API.

## Project Identity

*   **Type:** Progressive Web App (PWA) / Single Page Application (SPA)
*   **Core Philosophy:**
    *   **Local-First:** No backend dependency for processing. All DSP happens on the client.
    *   **Privacy-Focused:** User data (audio files) never leaves the device.
    *   **Performance:** Heavy lifting is offloaded to `AudioWorklet` threads to keep the UI responsive.

## Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | 18.2.0 | UI Components & Virtual DOM |
| **Build Tool** | Vite | 5.1.4 | Fast HMR & Bundling |
| **Language** | TypeScript | 5.3.3 | Type Safety (Strict Mode) |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first styling |
| **State** | Zustand | 4.5.0 | Global Store & Audio Graph Management |
| **Audio** | Web Audio API | N/A | Native Browser DSP |
| **Persistence** | idb-keyval | 6.2.1 | IndexedDB Wrapper for Large Assets |
| **Interactions** | @dnd-kit | 6.3.1 | Drag & Drop Rack Sorting |

## System Context Diagram

```mermaid
graph TD
    User((User))
    
    subgraph Browser ["Web Browser (Client)"]
        UI[React UI Layer]
        Store[Zustand Store]
        Audio[Audio Engine]
        Worklets[AudioWorklets (DSP)]
        IDB[(IndexedDB)]
        FS[File System API]
    end

    User -->|Interacts| UI
    UI <-->|Reads/Writes| Store
    Store <-->|Controls| Audio
    Audio <-->|Loads| Worklets
    Audio -->|Process Audio| Worklets
    Store <-->|Persist Session| IDB
    Store <-->|Export/Save| FS
```
