## 2026-01-15 - AudioWorklet Math Optimization
**Learning:** `Math.pow(10, db/20)` and `20 * Math.log10(x)` are significant bottlenecks in per-sample AudioWorklet loops.
**Action:** Use pre-calculated `Math.exp` and `Math.log` multipliers via helper functions (`dbToLinear`, `linearToDb`) for >50% performance gain in DSP processors.
