## 2026-01-19 - DSP Math Optimization
**Learning:** AudioWorklets in this project support ES module imports (e.g., `import { dbToLinear } from './lib/dsp-helpers.js'`). This allows standardizing optimized math functions across processors instead of redefining them or using slower standard `Math` functions inline.
**Action:** When optimizing new processors, check `dsp-helpers.js` for existing optimized implementations (like `dbToLinear`, `linearToDb`) before writing raw math code.
