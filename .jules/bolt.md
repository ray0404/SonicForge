## 2024-05-22 - Hoisting Expensive Math in AudioWorklets
**Learning:** `Math.pow` and `Math.log` are expensive in tight DSP loops (AudioWorklet `process` method). V8 de-optimization can occur if these are called per-sample with constant arguments.
**Action:** Always hoist expensive math operations (like dB conversions) out of the sample loop when parameters are constant (check `param.length === 1`).
