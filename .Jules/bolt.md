## 2024-05-23 - AudioWorklet Optimization
**Learning:** Checking `parameter.length === 1` allows hoisting expensive math (like `Math.exp` for ballistics) out of the sample loop, significantly reducing CPU load for k-rate parameters.
**Action:** Always implement dual-path logic (constant vs automated) for expensive AudioWorklet parameters.

## 2024-05-23 - DSP Math Helpers
**Learning:** `Math.pow(10, x/20)` and `Math.log10` are significantly slower than pre-calculated `Math.exp` and `Math.log` equivalents.
**Action:** Use `dbToLinear` and `linearToDb` helpers in all DSP code.
