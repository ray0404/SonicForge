import { create } from 'zustand';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';
import { get as getIDB, set as setIDB } from 'idb-keyval';

export type RackModuleType = 'DYNAMIC_EQ' | 'TRANSIENT_SHAPER' | 'LIMITER' | 'MIDSIDE_EQ';

export interface RackModule {
  id: string;
  type: RackModuleType;
  bypass: boolean;
  parameters: Record<string, number>;
}

interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  masterVolume: number; // 0.0 to 1.0
  rack: RackModule[];

  initializeEngine: () => Promise<void>;
  togglePlay: () => void;
  setMasterVolume: (val: number) => void;
  
  addModule: (type: RackModuleType) => void;
  removeModule: (id: string) => void;
  updateModuleParam: (id: string, param: string, value: number) => void;
  
  savePreset: () => Promise<void>;
  loadPreset: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  masterVolume: 1.0,
  rack: [],

  initializeEngine: async () => {
    if (get().isInitialized) return;
    try {
      await audioEngine.init();
      set({ isInitialized: true });
      // Attempt to load previous session
      get().loadPreset();
    } catch (error) {
      logger.error("Store failed to init engine", error);
    }
  },

  togglePlay: () => {
    audioEngine.resume();
    if (!get().isPlaying) {
       audioEngine.playTestTone();
       set({ isPlaying: true });
       setTimeout(() => set({ isPlaying: false }), 2000);
    } else {
       set({ isPlaying: false });
    }
  },

  setMasterVolume: (val: number) => {
    set({ masterVolume: val });
    if (audioEngine.masterGain) {
      audioEngine.masterGain.gain.setTargetAtTime(val, audioEngine.context?.currentTime || 0, 0.1);
    }
  },

  addModule: (type: RackModuleType) => {
    const newModule: RackModule = {
      id: crypto.randomUUID(),
      type,
      bypass: false,
      parameters: {}
    };

    if (type === 'DYNAMIC_EQ') {
      newModule.parameters = { frequency: 1000, gain: 0, Q: 1.0, threshold: -20, ratio: 2, attack: 0.01, release: 0.1 };
    } else if (type === 'TRANSIENT_SHAPER') {
      newModule.parameters = { attackGain: 0, sustainGain: 0 };
    } else if (type === 'LIMITER') {
      newModule.parameters = { threshold: -0.5, ceiling: -0.1, release: 0.1, lookahead: 5 };
    } else if (type === 'MIDSIDE_EQ') {
      newModule.parameters = { midGain: 0, midFreq: 1000, sideGain: 0, sideFreq: 1000 };
    }

    set((state) => ({ rack: [...state.rack, newModule] }));
    audioEngine.rebuildGraph(get().rack); 
  },

  removeModule: (id: string) => {
    set((state) => ({ rack: state.rack.filter(m => m.id !== id) }));
    audioEngine.rebuildGraph(get().rack);
  },

  updateModuleParam: (id: string, param: string, value: number) => {
    set((state) => ({
      rack: state.rack.map(m => 
        m.id === id 
        ? { ...m, parameters: { ...m.parameters, [param]: value } }
        : m
      )
    }));
    // We update the node directly in the engine if possible for performance,
    // but here we just rely on the component state updates or a specific engine call.
    // Ideally, we call a method on the engine to update just that param.
    // For now, let's just ensure the engine has the latest state if it queries it,
    // but strictly speaking, AudioParam changes should be sent to the node.
    // The UI calls `updateModuleParam`, which updates the store. 
    // We need to push this change to the engine node!
    const module = get().rack.find(m => m.id === id);
    if (module) {
        // We can manually trigger an update on the engine node map
        // This is a bit of a leak of abstraction, but necessary without a full rebuild.
        // Or we add `audioEngine.updateParam(id, param, value)`
        // Let's do it via rebuildGraph for now? No, that's heavy.
        // Let's trust that the UI sliders might *also* want to drive the node directly?
        // No, standard React way: Store update -> Side effect.
        // We'll add a side effect here.
        audioEngine.updateModuleParam(id, param, value);
    }
  },

  savePreset: async () => {
      const state = get();
      const preset = {
          rack: state.rack,
          masterVolume: state.masterVolume
      };
      await setIDB('current_session_state', preset);
      logger.info("Preset saved.");
  },

  loadPreset: async () => {
      try {
        const preset = await getIDB('current_session_state');
        if (preset && preset.rack) {
            set({ rack: preset.rack, masterVolume: preset.masterVolume || 1.0 });
            audioEngine.rebuildGraph(preset.rack);
            logger.info("Preset loaded.");
        }
      } catch (e) {
          logger.error("Failed to load preset", e);
      }
  }
}));
