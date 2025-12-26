# System Architecture

Sonic Forge is built on a complex, multi-threaded architecture designed to bridge the gap between React's declarative state model and the Web Audio API's imperative graph model.

This section is divided into three deep-dive documents:

## 1. [Concepts & Abstraction Layers](architecture/concept-abstraction.md)
Start here. This document explains the high-level philosophy:
- The **Three-Layer Hierarchy** (Intent -> Orchestration -> Processing).
- The **Unidirectional Control Flow**.
- Key metaphors like "The Rack" and "Assets."

## 2. [Data & State Flow](architecture/state-flow.md)
Understand how data moves through the system:
- The **Zustand** store implementation.
- The **Optimistic UI** update cycle.
- **Persistence** strategies using IndexedDB for large binary assets.
- How Visualizers bypass React for 60fps performance.

## 3. [The Audio Graph](architecture/audio-graph.md)
A technical reference for the `AudioEngine` singleton:
- How the Web Audio **Graph** is constructed and routed.
- The **Gapless Rebuild** strategy (diffing logic).
- How **Offline Rendering** (bouncing) works under the hood.

---

## Quick Reference: The Directory Map

```
src/
├── audio/               # The "Sound" Layer
│   ├── context.ts       # AudioEngine Singleton (The Graph Manager)
│   └── worklets/        # DSP Logic (Processors + Nodes)
├── components/          # The "View" Layer
│   ├── rack/            # Effect Modules (UI)
│   ├── ui/              # Reusable atoms (Knobs, Shells)
│   └── visualizers/     # Canvas-based Analyzers
├── store/               # The "Brain" Layer
│   └── useAudioStore.ts # Zustand Store
└── hooks/               # Logic Hooks (Persistence, etc.)
```