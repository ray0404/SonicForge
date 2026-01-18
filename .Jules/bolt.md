## 2024-05-23 - AudioWorklet Math Optimization
**Learning:** `Math.pow(10, db/20)` and `20 * Math.log10(x)` are expensive in per-sample DSP loops. `Math.exp` and `Math.log` with pre-calculated constants are significantly faster.
**Action:** Always use `dbToLinear` and `linearToDb` helpers from `dsp-helpers.js` in AudioWorklet processors.
