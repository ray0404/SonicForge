# Implementation Plan: Global Navigation Side Panel

This plan follows the Trinity Pattern and TDD principles. Each phase concludes with a mandatory verification and checkpointing protocol.

## Phase 1: Infrastructure & Layout (UI Shell)
*Goal: Establish the global UI state and the basic responsive layout shell.*

- [x] **Task 1: UI State Store**
    - [x] Write tests for `useUIStore.ts` (open/close, setView).
    - [x] Implement `useUIStore` using Zustand.
- [x] **Task 2: SidePanel Component Shell**
    - [x] Write unit tests for `SidePanel.tsx` visibility and basic accessibility (ARIA roles).
    - [x] Create `SidePanel.tsx` with Glassmorphic styling (Tailwind `backdrop-blur`).
- [x] **Task 3: Layout Integration (Push/Overlay)**
    - [x] Write integration tests for `MasteringWorkspace.tsx` to verify layout shifts on desktop vs mobile.
    - [x] Update layout to support the Hybrid (Overlay/Push) behavior.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Infrastructure & Layout' (Protocol in workflow.md)**

## Phase 2: Navigation & Routing
*Goal: Connect the side panel to the URL and provide the navigation menu.*

- [ ] **Task 1: URL Synchronization Hook**
    - [ ] Write tests for `usePanelRouting.ts` (sync store state to URL search params).
    - [ ] Implement routing sync logic.
- [ ] **Task 2: Navigation Menu**
    - [ ] Write tests for `NavMenu.tsx` (active state highlighting, click interactions).
    - [ ] Implement the menu with icons (Lucide React) for Settings, Docs, Mixer, Timeline, Assets, Export.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Navigation & Routing' (Protocol in workflow.md)**

## Phase 3: Documentation Viewer
*Goal: Implement the in-app markdown viewer.*

- [ ] **Task 1: Markdown Rendering Setup**
    - [ ] Write tests for a `MarkdownViewer.tsx` component.
    - [ ] Implement rendering using `react-markdown` with Tailwind Typography styling.
- [ ] **Task 2: Doc Content Loading**
    - [ ] Write tests for an async loader to fetch `.md` files from the `docs/` directory.
    - [ ] Implement content fetching and error handling.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Documentation Viewer' (Protocol in workflow.md)**

## Phase 4: Content Sections & Integration
*Goal: Implement the content for the remaining navigation items.*

- [ ] **Task 1: Settings Section**
    - [ ] Write tests for `SettingsView.tsx`.
    - [ ] Implement basic preferences (e.g., Theme toggle, Audio Engine status).
- [ ] **Task 2: Asset Manager Integration**
    - [ ] Write tests for `AssetManagerView.tsx`.
    - [ ] Create a view that lists assets currently in `useAudioStore`.
- [ ] **Task 3: Export Access**
    - [ ] Connect the Export nav item to trigger the existing `renderOffline` functionality.
- [ ] **Task: Conductor - User Manual Verification 'Phase 4: Content Sections & Integration' (Protocol in workflow.md)**

## Phase 5: Polish & Accessibility
*Goal: Final refinements for a production-ready feel.*

- [ ] **Task 1: Animations (Framer Motion)**
    - [ ] Implement smooth slide transitions for opening/closing and content swapping.
- [ ] **Task 2: Accessibility (A11y)**
    - [ ] Implement Focus Trapping for mobile overlay mode.
    - [ ] Ensure full keyboard navigation support.
- [ ] **Task: Conductor - User Manual Verification 'Phase 5: Polish & Accessibility' (Protocol in workflow.md)**
