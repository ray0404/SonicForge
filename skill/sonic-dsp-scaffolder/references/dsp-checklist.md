# DSP Module Implementation Checklist

## 1. Core Logic (AudioWorklet)
- [ ] Created `src/audio/worklets/[name]-processor.js`.
- [ ] Defined static `parameterDescriptors` (min, max, default).
- [ ] Implemented `process()` loop handling stereo channels.
- [ ] Registered processor via `registerProcessor`.

## 2. Node Bridge (TypeScript)
- [ ] Created `src/audio/worklets/[Name]Node.ts`.
- [ ] Extended `AudioWorkletNodeBase`.
- [ ] Passed correct processor string name in `super()`.
- [ ] Implemented `setParam` method.

## 3. UI Component (React)
- [ ] Created `src/components/rack/[Name]Unit.tsx`.
- [ ] Used `<ModuleShell>` for consistency.
- [ ] Mapped all parameters to `<Knob>` components.
- [ ] Wired `onUpdate` to state changes.

## 4. Registration
- [ ] Added config object to `DESCRIPTORS` in `src/audio/module-descriptors.ts`.
- [ ] Added switch case to `NodeFactory.create` in `src/audio/core/node-factory.ts`.
