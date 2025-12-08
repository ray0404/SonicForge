# The "Visual Foundry" (Creative Coding/WebGL)
​**Intent:** A playground for generating visuals, album art, or 3D music visualizers.
**Key Features:** Three.js, Hot-Reloading Shaders, Control Panel.

## Project Specification: "Visual Foundry" Creative Coding Template

**Role:** Creative Technologist
**Task:** Create a scaffolded environment for rapid prototyping of WebGL scenes and Generative Art.

### 1. Technical Stack
* **Core:** Three.js (3D Library)
* **Bundler:** Vite (Essential for shader hot-reloading).
* **Controls:** `tweakpane` (A lightweight debug GUI for tweaking variables in real-time).

### 2. Architecture
* **The Loop:** A robust `requestAnimationFrame` loop that handles window resizing and canvas pixel density automatically.
* **Shader Support:** Configure Vite to import `.glsl`, `.vert`, and `.frag` files as raw strings suitable for ShaderMaterial.
* **Export:** A utility keybind (e.g., 'S') that captures the current canvas frame and saves it as a high-res PNG.

### 3. File Structure
* `/src/sketches/`: A folder to hold different visual experiments.
* `/src/glsl/`: A library of reusable shader chunks (noise functions, formatting).
* `/src/main.js`: The entry point that loads the selected sketch.

### 4. Output Requirements
* Generate the `package.json`, `vite.config.js`, and a "Hello World" rotating cube example that utilizes the custom shader setup.
* Ensure the template works locally via `npm run dev` and can be viewed on a mobile device on the same network (expose host).
