# Architecture & Flow

SonicForge follows a strict **unidirectional data flow** where the UI triggers state updates, which then propagate to the Audio Engine. The UI never talks to the Audio Engine directly; it goes through the Store.

## Directory Map

```
src/
├── audio/               # The "Sound" Layer
│   ├── context.ts       # AudioEngine Singleton (The Graph Manager)
│   └── worklets/        # DSP Logic (Processors + Nodes)
├── components/          # The "View" Layer
│   ├── rack/            # Effect Modules (UI)
│   ├── ui/              # Reusable atoms (Knobs, Shells)
│   └── visualizers/     # Canvas-based Analyzers
├── store/               # The "Brain" Layer
│   └── useAudioStore.ts # Zustand Store
└── hooks/               # Logic Hooks (Persistence, etc.)
```

## Critical Flows

### 1. The "Trinity" Update Flow

When a user turns a knob, the following chain reaction occurs:

```mermaid
sequenceDiagram
    participant User
    participant UI as LimiterUnit (React)
    participant Store as useAudioStore
    participant Engine as AudioEngine
    participant Node as LimiterNode (AudioParam)

    User->>UI: Turns Threshold Knob
    UI->>Store: updateModuleParam('id', 'threshold', -12)
    Store->>Store: Update React State (Optimistic)
    Store->>Engine: updateModuleParam('id', 'threshold', -12)
    Engine->>Node: node.parameters.get('threshold').setTargetAtTime(...)
    Node-->>User: Audio Change Heard
```

### 2. Audio Graph Reconstruction (Adding a Module)

Adding a module requires rebuilding the Web Audio graph to insert the new node into the chain.

```mermaid
sequenceDiagram
    participant Store
    participant Engine
    participant RackInput
    participant Node as New AudioNode
    participant RackOutput

    Store->>Store: addModule(type)
    Store->>Engine: rebuildGraph(newRack)
    Engine->>RackInput: disconnect()
    Engine->>Engine: Create/Get Node for Module
    Engine->>RackInput: connect(Node)
    Engine->>Node: connect(RackOutput)
    Note right of Engine: Graph is now: Input -> Node -> Output
```

### 3. Audio Signal Path

The internal routing of the `AudioEngine`.

```mermaid
graph LR
    File[Source File] --> SourceNode[BufferSource]
    SourceNode --> RackInput[GainNode]
    
    subgraph Rack [Effects Rack]
        RackInput --> Module1
        Module1 --> Module2
        Module2 --> Module3
        Module3 --> RackOutput[GainNode]
    end

    RackOutput --> MasterGain[GainNode]
    MasterGain --> Dest[AudioContext.Destination]

    RackOutput --> Splitter[ChannelSplitter]
    Splitter --> AnalyserL
    Splitter --> AnalyserR
    RackOutput --> AnalyserMain
```
