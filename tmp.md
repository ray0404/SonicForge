# **Blueprint: Zig Integration & Advanced Offline DSP for SonicForge (RPi 4)**

**Target System:** Raspberry Pi 4 (ARM64/Linux)
**Project Context:** SonicForge (React/Vite/TypeScript PWA)
**Goal:** Integrate Zig for high-performance WebAssembly (WASM) DSP and implement 5 pro-level offline batch processors.

---

## **Phase 1: Environment & Toolchain Setup (RPi 4)**

*Directive: Establish the compiler environment without root access dependency if possible, or standard installation.*

1. **Download Zig (ARM64):**
* **Action:** Fetch the latest stable build of Zig for `aarch64-linux`.
* **Command:**
```bash
cd ~
wget https://ziglang.org/download/0.13.0/zig-linux-aarch64-0.13.0.tar.xz
tar -xf zig-linux-aarch64-0.13.0.tar.xz
mv zig-linux-aarch64-0.13.0 zig

```


* **Path Setup:** Add `export PATH="$HOME/zig:$PATH"` to `~/.bashrc` (or shell profile) and source it.
* **Verification:** Run `zig version` to confirm it outputs `0.13.0` (or newer).


2. **Project Directory Preparation:**
* **Action:** Create the Zig source directory within the SonicForge project.
* **Path:** `src/audio/dsp/zig/`
* **Files to Create:**
* `src/audio/dsp/zig/main.zig` (Entry point)
* `src/audio/dsp/zig/math_utils.zig` (Shared math helpers)





---

## **Phase 2: Architecture & The "WASM Bridge"**

*Directive: Create the foundational memory management and communication layer between TypeScript and Zig.*

1. **Create `src/audio/dsp/zig/main.zig`:**
* **Requirement:** Must implement a `GeneralPurposeAllocator` and export `alloc` and `free` functions.
* **Code Spec:**
```zig
const std = @import("std");
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

export fn alloc(len: usize) ?[*]f32 {
    const slice = allocator.alloc(f32, len) catch return null;
    return slice.ptr;
}

export fn free(ptr: [*]f32, len: usize) void {
    const slice = ptr[0..len];
    allocator.free(slice);
}

```




2. **Create the Build Script (`npm run build:wasm`):**
* **Action:** Add a script to `package.json` to compile Zig to WASM.
* **Command:** `zig build-lib src/audio/dsp/zig/main.zig -target wasm32-freestanding -dynamic -O ReleaseFast -femit-bin=public/wasm/dsp.wasm`
* **Note for RPi 4:** usage of `-O ReleaseFast` is critical for performance on the Pi's CPU.


3. **Update `offline-processor.worker.ts`:**
* **Action:** Modify the existing worker to load `dsp.wasm` on startup.
* **Implementation:** Implement the `WebAssembly.instantiate` loader and a helper class `WasmBridge` that handles:
* Sending `Float32Array` data to WASM heap (`alloc` -> `set`).
* Calling the target function.
* Retrieving the result (`subarray`).
* Freeing memory (`free`).





---

## **Phase 3: The Top 5 Offline Processors (Implementation Specs)**

*Directive: Implement these specific DSP algorithms in `main.zig`. Each function must accept pointers `[*]f32` and lengths.*

### **1. Loudness Normalization (EBU R128 Style)**

* **Function Name:** `process_lufs_normalize`
* **Logic:**
1. **Pass 1 (Analysis):** Iterate through buffer. Apply K-Weighting filter (High shelf + High pass) to simulate human hearing. Calculate Mean Square of the filtered signal.
2. **Calculation:** Convert MS to dBFS. Compare against Target LUFS (e.g., -14).
3. **Pass 2 (Gain):** Calculate linear gain delta and multiply all samples.


* **Zig Feature:** Use `@Vector(4, f32)` for SIMD multiplication during the gain application.

### **2. Phase Rotation (Headroom Optimization)**

* **Function Name:** `process_phase_rotation`
* **Logic:**
1. Define a generic `AllPassFilter` struct.
2. Create a chain of 4-6 all-pass filters with varying coefficients (e.g., 0.4, 0.6).
3. Pass every sample through the chain.


* **Why:** This smears transient peaks (like snare drums) without changing the sound, often recovering 1-3dB of headroom.

### **3. De-Clipper (Peak Restoration)**

* **Function Name:** `process_declip`
* **Logic:**
1. **Detection:** Scan for sequences of 3+ samples at exactly 1.0 or -1.0 (or > 0.999).
2. **Interpolation:** Take 2 samples before and 2 after the clipped region.
3. **Math:** Use **Cubic Hermite Spline** interpolation to guess the curve *above* the ceiling.
4. **Apply:** Replace the flat line with the new curve (which may go above 0dB, requiring normalization later).



### **4. Adaptive Spectral Denoise**

* **Function Name:** `process_spectral_denoise`
* **Logic:**
1. **FFT:** Perform a Short-Time Fourier Transform (STFT) on the buffer (window size 2048).
2. **Noise Profile:** Assume the first 100ms is noise (or analyze lowest energy frames).
3. **Subtraction:** For each frame, subtract the magnitude of the noise profile from the current frame's magnitude (Spectral Subtraction).
4. **iFFT:** Reconstruct the audio.


* *Note:* Requires importing a lightweight Zig FFT library (like `zig-fft`) or writing a simple recursive Cooley-Tukey implementation.



### **5. Bass Mono-Maker (Elliptic Filter)**

* **Function Name:** `process_mono_bass`
* **Logic:**
1. **Crossover:** Apply a Low-Pass Filter (LPF) and High-Pass Filter (HPF) at the cutoff freq (e.g., 120Hz). Use Linkwitz-Riley 4th order logic to keep phase aligned.
2. **Summing:** Take the LPF output (Left and Right) and average them: `(L + R) / 2`.
3. **Recombination:** `Final_L = Mono_Low + HPF_L`, `Final_R = Mono_Low + HPF_R`.



---

## **Phase 4: Exposure & UI Integration**

*Directive: Connect the new capabilities to the SonicForge frontend.*

1. **Update `OfflineProcessorClient.ts`:**
* Add typed methods for the new processors:
* `normalizeLoudness(targetLufs: number)`
* `fixPhase()`
* `repairClipping()`
* `denoise()`
* `monoBass(frequency: number)`




2. **Create `BatchProcessMenu.tsx`:**
* **Location:** `src/components/layout/panels/ToolsView.tsx` (or similar).
* **UI Elements:**
* A specialized "Audio Repair" section.
* One-click buttons that trigger the `OfflineProcessorClient`.
* A progress bar (since Batch Processing on RPi 4 might take 2-10 seconds for long files).




3. **Persistence Strategy:**
* After Zig processing, the Worker must return the *modified* `Float32Array`.
* The frontend must immediately save this new buffer to `IndexedDB` (via existing persistence hooks) to prevent data loss if the browser tab is closed.



---

## **Phase 5: Execution Verification**

*Directive: Testing steps for the Agent.*

1. **Compile:** Run `npm run build:wasm`. Verify `public/wasm/dsp.wasm` exists and is > 1KB.
2. **Unit Test:** Create a simple JS test script that loads the WASM and feeds it a simple array `[1.0, 1.0, 1.0]` to ensure gain logic works.
3. **End-to-End:** Load a track in SonicForge, click "Phase Rotation", and verify visually that the waveform shape changes (peaks should look different) but sounds the same.
