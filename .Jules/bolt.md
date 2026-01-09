## 2026-01-09 - AudioWorklet Math Optimization
**Learning:** `Math.pow(10, db/20)` is significantly slower than `Math.exp(db * constant)` in hot DSP loops. Replacing it with a pre-calculated multiplier and `Math.exp` provides a measurable speedup for gain calculations in per-sample processors.
**Action:** Use `dbToLinear` helper from `dsp-helpers.js` for all future dB-to-linear conversions in AudioWorklets.
