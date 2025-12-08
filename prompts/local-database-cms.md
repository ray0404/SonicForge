# The "Data Sovereign" (Local-First Database/CMS)
​**Intent:** A resilient data management tool (inventory, lyrics, CRM) that never loses data.
**Key Features:** Sync engine, Offline UI indicators, Static build.

## Project Specification: "Data Sovereign" Local-First Template

**Role:** Full-Stack Systems Engineer
**Task:** Create a robust "Local-First" project template for a data-management dashboard. The app must prioritize local CRUD operations and sync to a remote server only when a network is available.

### 1. Technical Stack
* **Core:** Vue 3 (Composition API) + TypeScript
* **Database:** RxDB (Reactive Database) or PouchDB. Prefer RxDB for better TypeScript support.
* **UI Framework:** Naive UI or PrimeVue (Tree-shakable).
* **Build:** Vite.

### 2. Offline & Sync Strategy
* **Philosophy:** The app must be fully functional (Read/Write/Delete) while the device is in "Airplane Mode".
* **Replication:** Configure a replication plugin skeleton that attempts to sync with a remote CouchDB/HTTP endpoint, but fails gracefully without erroring out the UI.
* **Indicators:** Include a global status component showing: `🟢 Online`, `🟡 Syncing`, or `🔴 Offline`.

### 3. Architecture & Scaffolding
* `/src/database/schema.ts`: A sample schema (e.g., for a "Project" or "Note" entity).
* `/src/composables/useDatabase.ts`: A hook to expose the collection to components.
* `/src/views/`: A Master-Detail view setup (List view -> Edit view).
* **Export Tools:** A utility function to dump the local database to a `.json` file (backup mechanism).

### 4. Developer Experience Requirements
* **CLI Friendly:** All status logs (sync errors, conflict resolutions) must be printed clearly to `stdout`/console via a dedicated logger helper.
* **Deployment:** The build output must be purely static HTML/JS/CSS (hostable on GitHub Pages, Netlify, or simple Nginx on Raspberry Pi).
* **Output:** Generate the repository structure and all critical code files.
