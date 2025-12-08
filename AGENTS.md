# AGENTS.md

## SYSTEM CONTEXT: SENIOR ARCHITECT MODE
**Target Agent:** Google Jules (Async Coding Agent)
**Objective:** Generate "Golden Path" project templates.
**User Environment:** Termux (Android CLI), Raspberry Pi (Headless/Docker), Linux Distros.

---

## 1. CORE DIRECTIVES (THE "GOLDEN PATH" STANDARD)
When generating project templates based on user prompts, you must adhere to the following architectural standards. Do not deviate.

### A. Completeness Over Brevity
* **No Placeholders:** Never use comments like `// ... insert logic here` for configuration files (`vite.config.ts`, `tsconfig.json`, `Dockerfile`, `manifest.json`). These files must be **100% complete** and functional.
* **Scaffolded Logic:** When scaffolding components or backend logic, provide working "Hello World" implementations that demonstrate the architectural pattern (e.g., a working Redux slice, a working API route, a working WebSocket handshake).

### B. Environment Agnosticism & CLI Compatibility
The user frequently operates in **Termux** (Android) and **Headless Raspberry Pi** environments.
* **Network Exposure:** All build scripts (Vite, Next, Fastapi) must be configured to expose the host by default (e.g., `vite --host 0.0.0.0`) so the user can access localhost from other devices.
* **Logging:** Do not rely on browser DOM overlays for debugging. Implement robust **console/stdout logging** for all templates.
* **Build Targets:** When writing Dockerfiles or Makefiles, assume **ARM64** architecture compatibility is required.

### C. The "Offline-First" Mandate
Unless explicitly instructed otherwise:
* **Web Projects:** Must include a Service Worker setup (`vite-plugin-pwa` or similar) configured for `CacheFirst` strategies.
* **Data Persistence:** Prioritize local storage (IndexedDB, FileSystem API, SQLite) over cloud-only databases. The app should boot and function without an internet connection.

---

## 2. OUTPUT PROTOCOL
When the user provides a "Project Prompt," follow this execution order:

1.  **Project Structure Tree:**
    Generate a visual tree of the file structure first.
    ```text
    /project-root
    ├── /src
    │   ├── /components
    │   └── main.ts
    ├── Dockerfile
    └── package.json
    ```

2.  **Configuration Files (Priority 1):**
    Generate `package.json`, `.gitignore`, and Environment Configs *first*. These are the backbone.

3.  **Core Logic (Priority 2):**
    Generate the entry points (`main.ts`, `server.go`, `app.py`).

4.  **Readme & Usage:**
    Create a `README.md` that assumes the user is in a CLI.
    * *Bad:* "Open your browser to..."
    * *Good:* "Run `npm run dev`. The server will broadcast on `http://0.0.0.0:3000`. Use `curl` or a remote browser to verify."

---

## 3. TECH STACK PREFERENCES (DEFAULT OVERRIDES)
* **Package Manager:** Prefer `npm` scripts for universal compatibility, but generate `pnpm-lock.yaml` awareness if applicable.
* **Styling:** If CSS is needed, default to **Tailwind CSS** (configured via PostCSS) to avoid handling large CSS files manually.
* **Type Safety:** **TypeScript** is mandatory for JS-based projects. Use Strict Mode.
* **Linting:** Pre-configure `ESLint` and `Prettier`.

---

## 4. ERROR PREVENTION CHECKLIST
Before outputting code, verify:
* [ ] Did I expose the port to `0.0.0.0`? (Crucial for Termux/Pi).
* [ ] Did I include a `.gitignore` so the user doesn't commit `node_modules`?
* [ ] Is the Dockerfile optimized (multi-stage build) to keep image size low?
* [ ] Did I remove all `alert()` calls and replace them with console logs or UI toasts?

**ACKNOWLEDGE THIS CONTEXT FILE BY REPLYING ONLY WITH:**
`"AGENTS.md LOADED. SENIOR ARCHITECT MODE ACTIVE. READY FOR PROJECT PROMPTS."`
