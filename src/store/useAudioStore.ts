import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';
import { get as getIDB, set as setIDB } from 'idb-keyval';

export type RackModuleType = 'DYNAMIC_EQ' | 'TRANSIENT_SHAPER' | 'LIMITER' | 'MIDSIDE_EQ' | 'CAB_SIM' | 'LOUDNESS_METER';

export interface RackModule {
  id: string;
  type: RackModuleType;
  bypass: boolean;
  parameters: Record<string, any>; // Changed from number to any to support string IDs
}

interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  sourceDuration: number;
  currentTime: number;
  masterVolume: number; // 0.0 to 1.0
  rack: RackModule[];
  assets: Record<string, AudioBuffer>;

  initializeEngine: () => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  loadSourceFile: (file: File) => Promise<void>;
  setMasterVolume: (val: number) => void;
  
  addModule: (type: RackModuleType) => void;
  removeModule: (id: string) => void;
  toggleModuleBypass: (id: string) => void;
  reorderRack: (startIndex: number, endIndex: number) => void;
  updateModuleParam: (id: string, param: string, value: any) => void;
  
  loadAsset: (file: File) => Promise<string>;
  savePreset: () => Promise<void>;
  loadPreset: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  sourceDuration: 0,
  currentTime: 0,
  masterVolume: 1.0,
  rack: [],
  assets: {},

  initializeEngine: async () => {
    if (get().isInitialized) return;
    try {
      await audioEngine.init();
      set({ isInitialized: true });
      // Attempt to load previous session
      get().loadPreset();
      
      // Playback loop for UI updates
      setInterval(() => {
          if (audioEngine.isPlaying && audioEngine.context) {
              const elapsed = audioEngine.context.currentTime - audioEngine.startTime;
              set({ currentTime: elapsed });
          }
      }, 100);
    } catch (error) {
      logger.error("Store failed to init engine", error);
    }
  },

  togglePlay: () => {
    audioEngine.resume();
    if (get().isPlaying) {
       audioEngine.pause();
       set({ isPlaying: false });
    } else {
       audioEngine.play();
       set({ isPlaying: true });
    }
  },

  seek: (time: number) => {
      audioEngine.seek(time);
      set({ currentTime: time });
  },

  loadSourceFile: async (file: File) => {
      try {
          const buffer = await audioEngine.loadSource(file);
          set({ 
              sourceDuration: buffer.duration,
              currentTime: 0,
              isPlaying: false // Stop previous playback
          });
          logger.info("Source file loaded.");
      } catch (e) {
          logger.error("Failed to load source file", e);
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
    } else if (type === 'CAB_SIM') {
      newModule.parameters = { irAssetId: '', mix: 1.0 };
    } else if (type === 'LOUDNESS_METER') {
      newModule.parameters = {};
    }

    set((state) => ({ rack: [...state.rack, newModule] }));
    audioEngine.rebuildGraph(get().rack); 
  },

  removeModule: (id: string) => {
    set((state) => ({ rack: state.rack.filter(m => m.id !== id) }));
    audioEngine.rebuildGraph(get().rack);
  },

  reorderRack: (startIndex: number, endIndex: number) => {
    set((state) => ({ rack: arrayMove(state.rack, startIndex, endIndex) }));
    audioEngine.rebuildGraph(get().rack);
  },

  toggleModuleBypass: (id: string) => {
    set((state) => ({
      rack: state.rack.map(m =>
        m.id === id ? { ...m, bypass: !m.bypass } : m
      )
    }));
    audioEngine.rebuildGraph(get().rack);
  },

  updateModuleParam: (id: string, param: string, value: any) => {
    set((state) => ({
      rack: state.rack.map(m => 
        m.id === id 
        ? { ...m, parameters: { ...m.parameters, [param]: value } }
        : m
      )
    }));
    audioEngine.updateModuleParam(id, param, value);
  },

  loadAsset: async (file: File): Promise<string> => {
      try {
          const arrayBuffer = await file.arrayBuffer();
          // We need AudioContext to decode
          if (!audioEngine.context) throw new Error("Audio Engine not initialized");
          
          const audioBuffer = await audioEngine.context.decodeAudioData(arrayBuffer);
          const assetId = crypto.randomUUID();
          
          // Save to IDB (Optimized: save file blob, not decoded buffer)
          await setIDB(`asset_${assetId}`, file);
          
          // Update State
          set(state => ({
              assets: { ...state.assets, [assetId]: audioBuffer }
          }));
          
          logger.info(`Asset loaded: ${assetId}`);
          return assetId;
      } catch (e) {
          logger.error("Failed to load asset", e);
          throw e;
      }
  },

  savePreset: async () => {
      const state = get();
      // We only save the rack config. Assets are already in IDB via loadAsset.
      // But we should probably save a map of used asset IDs to ensure they aren't GC'd if we implement that.
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
            
            // Re-hydrate assets?
            // The modules in 'rack' will have 'irAssetId'.
            // We need to fetch those Blobs from IDB and decode them.
            // This is async.
            const uniqueAssetIds = new Set<string>();
            preset.rack.forEach((m: RackModule) => {
                if (m.type === 'CAB_SIM' && m.parameters.irAssetId) {
                    uniqueAssetIds.add(m.parameters.irAssetId);
                }
            });

            for (const id of uniqueAssetIds) {
                 const file = await getIDB(`asset_${id}`) as File;
                 if (file && audioEngine.context) {
                     const arrayBuffer = await file.arrayBuffer();
                     const audioBuffer = await audioEngine.context.decodeAudioData(arrayBuffer);
                     set(state => ({ assets: { ...state.assets, [id]: audioBuffer } }));
                 }
            }

            audioEngine.rebuildGraph(preset.rack);
            logger.info("Preset loaded.");
        }
      } catch (e) {
          logger.error("Failed to load preset", e);
      }
  }
}));
