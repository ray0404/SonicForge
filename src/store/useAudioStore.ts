import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';
import { get as getIDB, set as setIDB } from 'idb-keyval';

export type RackModuleType = 'DYNAMIC_EQ' | 'TRANSIENT_SHAPER' | 'LIMITER' | 'MIDSIDE_EQ' | 'CAB_SIM' | 'LOUDNESS_METER' | 'SATURATION' | 'DITHERING';

export interface RackModule {
  id: string;
  type: RackModuleType;
  bypass: boolean;
  parameters: Record<string, any>;
}

export interface Track {
  id: string;
  name: string;
  audioAssetId: string; // ID pointing to a buffer in the assets record
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 (L) to 1.0 (R)
  mute: boolean;
  solo: boolean;
  rack: RackModule[];
}

interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  sourceDuration: number; // This will now represent the longest track duration
  currentTime: number;
  masterVolume: number; // 0.0 to 1.0
  masterRack: RackModule[];
  tracks: Track[];
  assets: Record<string, AudioBuffer>;

  initializeEngine: () => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  setMasterVolume: (val: number) => void;
  
  addTrack: (file: File) => Promise<void>;
  updateTrackParams: (trackId: string, params: Partial<Omit<Track, 'id' | 'rack'>>) => void;

  addModule: (type: RackModuleType, trackId?: string) => void;
  removeModule: (id: string, trackId?: string) => void;
  toggleModuleBypass: (id: string, trackId?: string) => void;
  reorderRack: (startIndex: number, endIndex: number, trackId?: string) => void;
  updateModuleParam: (moduleId: string, param: string, value: any, trackId?: string) => void;
  
  loadAsset: (file: File) => Promise<string>;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  sourceDuration: 0,
  currentTime: 0,
  masterVolume: 1.0,
  masterRack: [],
  tracks: [],
  assets: {},

  initializeEngine: async () => {
    if (get().isInitialized) return;
    try {
      await audioEngine.init();
      set({ isInitialized: true });
      get().loadProject();
      
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
       audioEngine.play(get().tracks);
       set({ isPlaying: true });
    }
  },

  seek: (time: number) => {
      audioEngine.seek(time, get().tracks);
      set({ currentTime: time });
  },

  setMasterVolume: (val: number) => {
    set({ masterVolume: val });
    if (audioEngine.masterGain) {
      audioEngine.masterGain.gain.setTargetAtTime(val, audioEngine.context?.currentTime || 0, 0.1);
    }
  },

  addTrack: async (file: File) => {
    try {
      const assetId = await get().loadAsset(file);
      const newTrack: Track = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        audioAssetId: assetId,
        volume: 1.0,
        pan: 0,
        mute: false,
        solo: false,
        rack: [],
      };
      set(state => ({ tracks: [...state.tracks, newTrack] }));
      // Update overall duration if this track is longest
      const newDuration = get().assets[assetId].duration;
      if (newDuration > get().sourceDuration) {
        set({ sourceDuration: newDuration });
      }
      audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets);
    } catch (e) {
      logger.error("Failed to add track", e);
    }
  },

  updateTrackParams: (trackId: string, params: Partial<Omit<Track, 'id' | 'rack'>>) => {
    set(state => ({
      tracks: state.tracks.map(t =>
        t.id === trackId ? { ...t, ...params } : t
      )
    }));
    audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets); // Rebuild to handle mute/solo
  },

  addModule: (type: RackModuleType, trackId?: string) => {
    const newModule: RackModule = {
      id: crypto.randomUUID(),
      type,
      bypass: false,
      parameters: {}
    };

    // Default parameters (same as before)
    if (type === 'DYNAMIC_EQ') newModule.parameters = { frequency: 1000, gain: 0, Q: 1.0, threshold: -20, ratio: 2, attack: 0.01, release: 0.1 };
    else if (type === 'TRANSIENT_SHAPER') newModule.parameters = { attackGain: 0, sustainGain: 0 };
    else if (type === 'LIMITER') newModule.parameters = { threshold: -0.5, ceiling: -0.1, release: 0.1, lookahead: 5 };
    else if (type === 'MIDSIDE_EQ') newModule.parameters = { midGain: 0, midFreq: 1000, sideGain: 0, sideFreq: 1000 };
    else if (type === 'CAB_SIM') newModule.parameters = { irAssetId: '', mix: 1.0 };
    else if (type === 'SATURATION') newModule.parameters = { drive: 0.0, type: 1, outputGain: 0.0 };
    else if (type === 'DITHERING') newModule.parameters = { bitDepth: 24 };

    if (trackId) {
      set(state => ({
        tracks: state.tracks.map(t =>
          t.id === trackId ? { ...t, rack: [...t.rack, newModule] } : t
        )
      }));
    } else {
      set(state => ({ masterRack: [...state.masterRack, newModule] }));
    }
    audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets);
  },

  removeModule: (id: string, trackId?: string) => {
    if (trackId) {
      set(state => ({
        tracks: state.tracks.map(t =>
          t.id === trackId ? { ...t, rack: t.rack.filter(m => m.id !== id) } : t
        )
      }));
    } else {
      set(state => ({ masterRack: state.masterRack.filter(m => m.id !== id) }));
    }
    audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets);
  },

  reorderRack: (startIndex: number, endIndex: number, trackId?: string) => {
    if (trackId) {
        set(state => ({
            tracks: state.tracks.map(t =>
                t.id === trackId
                ? { ...t, rack: arrayMove(t.rack, startIndex, endIndex) }
                : t
            )
        }));
    } else {
        set(state => ({ masterRack: arrayMove(state.masterRack, startIndex, endIndex) }));
    }
    audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets);
  },

  toggleModuleBypass: (id: string, trackId?: string) => {
    if (trackId) {
        set(state => ({
            tracks: state.tracks.map(t =>
                t.id === trackId
                ? { ...t, rack: t.rack.map(m => m.id === id ? { ...m, bypass: !m.bypass } : m) }
                : t
            )
        }));
    } else {
        set(state => ({
            masterRack: state.masterRack.map(m => m.id === id ? { ...m, bypass: !m.bypass } : m)
        }));
    }
    audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets);
  },

  updateModuleParam: (moduleId: string, param: string, value: any, trackId?: string) => {
    if (trackId) {
      set(state => ({
        tracks: state.tracks.map(t =>
          t.id === trackId
          ? { ...t, rack: t.rack.map(m => m.id === moduleId ? { ...m, parameters: { ...m.parameters, [param]: value } } : m) }
          : t
        )
      }));
    } else {
      set(state => ({
        masterRack: state.masterRack.map(m =>
          m.id === moduleId
          ? { ...m, parameters: { ...m.parameters, [param]: value } }
          : m
        )
      }));
    }
    audioEngine.updateModuleParam(moduleId, param, value);
  },

  loadAsset: async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        if (!audioEngine.context) throw new Error("Audio Engine not initialized");

        const audioBuffer = await audioEngine.context.decodeAudioData(arrayBuffer);
        const assetId = `asset_${crypto.randomUUID()}`;

        await setIDB(assetId, file);

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

  saveProject: async () => {
    const state = get();
    const project = {
        updatedAt: Date.now(),
        masterRack: state.masterRack,
        tracks: state.tracks,
        masterVolume: state.masterVolume
    };
    await setIDB('current_project', project);
    logger.info("Project saved.");
  },

  loadProject: async () => {
    try {
      const project = await getIDB('current_project');
      if (project) {
          set({
              masterRack: project.masterRack || [],
              tracks: project.tracks || [],
              masterVolume: project.masterVolume || 1.0,
          });

          // Re-hydrate all assets for all tracks
          let maxDuration = 0;
          for (const track of project.tracks) {
              const file = await getIDB(track.audioAssetId) as File;
              if (file && audioEngine.context) {
                  const arrayBuffer = await file.arrayBuffer();
                  const audioBuffer = await audioEngine.context.decodeAudioData(arrayBuffer);
                  if (audioBuffer.duration > maxDuration) {
                    maxDuration = audioBuffer.duration;
                  }
                  set(state => ({ assets: { ...state.assets, [track.audioAssetId]: audioBuffer } }));
              }
          }
          set({ sourceDuration: maxDuration });

          audioEngine.rebuildGraph(get().masterRack, get().tracks, get().assets);
          logger.info("Project loaded successfully.");
      }
    } catch (e) {
        logger.error("Failed to load project", e);
    }
  }
}));
