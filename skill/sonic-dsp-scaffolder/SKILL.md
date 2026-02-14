---
name: sonic-dsp-scaffolder
description: Generates a complete vertical slice for a new AudioWorklet-based DSP module in SonicForge (Processor, Node, UI, Registry).
---

# SonicForge DSP Module Protocol

**Reference:** `sonicforge` Codebase (Trinity Pattern: Processor -> Node -> UI).

## 1. Requirement Analysis
**Trigger:** User asks to "create a [Effect Name] module" or "implement [DSP Concept]".
1.  **Parameter Extraction**: Identify the specific controls needed (e.g., Threshold, Ratio, Dry/Wet).
2.  **Range Definition**: Assign sensible defaults, minimums, and maximums for each parameter based on `src/audio/module-descriptors.ts` standards.
3.  **DSP Strategy**: Determine if the effect requires:
    * Sample-by-sample processing (Distortion, Bitcrusher).
    * Lookahead/Buffers (Limiters, Reverb).
    * Phase alignment (Stereo tools).

## 2. Code Generation Strategy
**Action:** Generate the four required files in the specific order below.
1.  **The Processor (`.js`)**: Pure logic. Must extend `AudioWorkletProcessor`. Handles `parameterDescriptors` and the `process()` loop.
2.  **The Node (`.ts`)**: The bridge. Must extend `AudioWorkletNode`. Implements `setParam` with smoothing.
3.  **The UI (`.tsx`)**: The visual component. Must use `ModuleShell` and `Knob` components.
4.  **The Descriptor (`.ts`)**: The registry config.

## 3. Integration Enforcement
**Action:** The output MUST conclude with the "Integration Guide" showing exactly where to inject code in `node-factory.ts` and `module-descriptors.ts`.

## 4. Constraints & Conventions
* **Smoothing**: All UI parameter updates must use `setTargetAtTime` in the Node class (0.01s time constant).
* **Parameter Names**: Use camelCase (e.g., `normFreq`, `mix`).
* **Bypass**: Always implement the standard input/output pass-through check `if (!input || !output) return true;`.
* **Stereo Handling**: Assume stereo input/output arrays `[channel][sample]`.
