import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { mixerEngine } from '@/audio/mixer';
import { logger } from '@/utils/logger';
import { get as getIDB, set as setIDB } from 'idb-keyval';

export type RackModuleType = 'DYNAMIC_EQ' | 'TRANSIENT_SHAPER' | 'LIMITER' | 'MIDSIDE_EQ' | 'CAB_SIM' | 'LOUDNESS_METER' | 'SATURATION' | 'DITHERING' | 'PARAMETRIC_EQ' | 'DISTORTION' | 'BITCRUSHER' | 'CHORUS' | 'PHASER' | 'TREMOLO' | 'AUTOWAH' | 'FEEDBACK_DELAY' | 'COMPRESSOR' | 'DE_ESSER' | 'STEREO_IMAGER' | 'MULTIBAND_COMPRESSOR';

export interface RackModule {
  id: string;
  type: RackModuleType;
  bypass: boolean;
  parameters: Record<string, any>;
}

export interface TrackState {
  id: string;
  name: string;
  color: string;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSoloed: boolean;
  rack: RackModule[];
  sends: Record<string, number>;
  sourceDuration: number;
  sourceName?: string;
}

interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  currentTime: number;

  tracks: Record<string, TrackState>;
  trackOrder: string[];
  master: TrackState;
  activeTrackId: string;

  assets: Record<string, AudioBuffer>;

  initializeEngine: () => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  
  addTrack: (name?: string) => void;
  removeTrack: (id: string) => void;
  selectTrack: (id: string) => void;
  reorderTracks: (oldIndex: number, newIndex: number) => void;

  loadSourceFile: (trackId: string, file: File) => Promise<void>;

  setTrackVolume: (trackId: string, val: number) => void;
  setTrackPan: (trackId: string, val: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;

  addModule: (trackId: string, type: RackModuleType) => void;
  removeModule: (trackId: string, moduleId: string) => void;
  toggleModuleBypass: (trackId: string, moduleId: string) => void;
  reorderRack: (trackId: string, startIndex: number, endIndex: number) => void;
  updateModuleParam: (trackId: string, moduleId: string, param: string, value: any) => void;
  
  loadAsset: (file: File) => Promise<string>;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<void>;
}

const createDefaultModule = (type: RackModuleType): RackModule => {
    let params: any = {};
    if (type === 'DYNAMIC_EQ') params = { frequency: 1000, gain: 0, Q: 1.0, threshold: -20, ratio: 2, attack: 0.01, release: 0.1 };
    else if (type === 'TRANSIENT_SHAPER') params = { attackGain: 0, sustainGain: 0 };
    else if (type === 'LIMITER') params = { threshold: -0.5, ceiling: -0.1, release: 0.1, lookahead: 5 };
    else if (type === 'MIDSIDE_EQ') params = { midGain: 0, midFreq: 1000, sideGain: 0, sideFreq: 1000 };
    else if (type === 'CAB_SIM') params = { irAssetId: '', mix: 1.0 };
    else if (type === 'SATURATION') params = { drive: 0.0, type: 1, outputGain: 0.0 };
    else if (type === 'DITHERING') params = { bitDepth: 24 };
    else if (type === 'PARAMETRIC_EQ') params = { lowFreq: 100, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 0.707, highFreq: 5000, highGain: 0 };
    else if (type === 'DISTORTION') params = { drive: 1, wet: 1, type: 0, outputGain: 0 };
    else if (type === 'BITCRUSHER') params = { bits: 8, normFreq: 1, mix: 1 };
    else if (type === 'CHORUS') params = { frequency: 1.5, delayTime: 0.03, depth: 0.002, feedback: 0, wet: 0.5 };
    else if (type === 'PHASER') params = { stages: 4, frequency: 0.5, baseFrequency: 1000, octaves: 2, wet: 0.5 };
    else if (type === 'TREMOLO') params = { frequency: 4, depth: 0.5, spread: 0, waveform: 0 };
    else if (type === 'AUTOWAH') params = { baseFrequency: 100, sensitivity: 0.5, octaves: 4, Q: 2, attack: 0.01, release: 0.1, wet: 1 };
    else if (type === 'FEEDBACK_DELAY') params = { delayTime: 0.5, feedback: 0.3, wet: 0.5 };
    else if (type === 'COMPRESSOR') params = { threshold: -24, ratio: 4, attack: 0.01, release: 0.1, knee: 5, makeupGain: 0, mode: 0, mix: 1 };
    else if (type === 'DE_ESSER') params = { frequency: 6000, threshold: -20, ratio: 4, attack: 0.005, release: 0.05, monitor: 0, bypass: 0 };
    else if (type === 'STEREO_IMAGER') params = { lowFreq: 150, highFreq: 2500, widthLow: 0.0, widthMid: 1.0, widthHigh: 1.2, bypass: 0 };
    else if (type === 'MULTIBAND_COMPRESSOR') {
        params = {
            lowFreq: 150, highFreq: 2500,
            threshLow: -24, ratioLow: 4, attLow: 0.01, relLow: 0.1, gainLow: 0,
            threshMid: -24, ratioMid: 4, attMid: 0.01, relMid: 0.1, gainMid: 0,
            threshHigh: -24, ratioHigh: 4, attHigh: 0.01, relHigh: 0.1, gainHigh: 0,
            bypass: 0
        };
    }

    return {
        id: crypto.randomUUID(),
        type,
        bypass: false,
        parameters: params
    };
};

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  currentTime: 0,

  tracks: {},
  trackOrder: [],
  master: {
      id: 'MASTER',
      name: 'Master',
      color: '#444',
      volume: 1.0,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      rack: [],
      sends: {},
      sourceDuration: 0
  },
  activeTrackId: 'MASTER',
  assets: {},

  initializeEngine: async () => {
    if (get().isInitialized) return;
    try {
      await mixerEngine.init();
      set({ isInitialized: true });
      
      setInterval(() => {
          if (mixerEngine.isPlaying) {
              set({ currentTime: mixerEngine.currentTime });
          }
      }, 100);

      await get().loadProject();

      // If no tracks, add one default
      if (get().trackOrder.length === 0) {
          get().addTrack("Audio 1");
      }

    } catch (error) {
      logger.error("Store failed to init engine", error);
    }
  },

  togglePlay: () => {
    if (get().isPlaying) {
       mixerEngine.pause();
       set({ isPlaying: false });
    } else {
       mixerEngine.play();
       set({ isPlaying: true });
    }
  },

  seek: (time: number) => {
      mixerEngine.seek(time);
      set({ currentTime: time });
  },

  addTrack: (name) => {
      const id = crypto.randomUUID();
      const newTrack: TrackState = {
          id,
          name: name || `Track ${get().trackOrder.length + 1}`,
          color: '#3b82f6',
          volume: 0.8,
          pan: 0,
          isMuted: false,
          isSoloed: false,
          rack: [],
          sends: {},
          sourceDuration: 0,
          sourceName: undefined
      };

      mixerEngine.addTrack(id);

      set(state => ({
          tracks: { ...state.tracks, [id]: newTrack },
          trackOrder: [...state.trackOrder, id],
          activeTrackId: id
      }));
  },

  removeTrack: (id) => {
      mixerEngine.removeTrack(id);
      set(state => {
          const newTracks = { ...state.tracks };
          delete newTracks[id];
          const newOrder = state.trackOrder.filter(tid => tid !== id);
          return {
              tracks: newTracks,
              trackOrder: newOrder,
              activeTrackId: state.activeTrackId === id ? (newOrder[0] || 'MASTER') : state.activeTrackId
          };
      });
  },

  selectTrack: (id) => {
      set({ activeTrackId: id });
  },

  reorderTracks: (oldIndex, newIndex) => {
      set(state => ({
          trackOrder: arrayMove(state.trackOrder, oldIndex, newIndex)
      }));
  },

  loadSourceFile: async (trackId, file) => {
      try {
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await mixerEngine.context.decodeAudioData(arrayBuffer);

          const track = mixerEngine.getTrack(trackId);
          if (track) {
              track.setSource(audioBuffer);
          }

          set(state => ({
              tracks: {
                  ...state.tracks,
                  [trackId]: {
                      ...state.tracks[trackId],
                      sourceDuration: audioBuffer.duration,
                      sourceName: file.name
                  }
              }
          }));

          // Save to IDB
          await setIDB(`track_${trackId}_source`, file);

      } catch (e) {
          logger.error("Failed to load source", e);
      }
  },

  setTrackVolume: (trackId, val) => {
      set(state => {
          const newState = { ...state };
          if (trackId === 'MASTER') {
              newState.master.volume = val;
              mixerEngine.masterBus.setVolume(val);
          } else if (state.tracks[trackId]) {
              newState.tracks[trackId].volume = val;
              mixerEngine.getTrack(trackId)?.setVolume(val);
          }
          return newState;
      });
  },

  setTrackPan: (trackId, val) => {
      set(state => {
          const newState = { ...state };
          if (trackId === 'MASTER') {
               newState.master.pan = val;
               mixerEngine.masterBus.setPan(val);
          } else if (state.tracks[trackId]) {
              newState.tracks[trackId].pan = val;
              mixerEngine.getTrack(trackId)?.setPan(val);
          }
          return newState;
      });
  },

  toggleTrackMute: (trackId) => {
      // TODO: Implement mute logic in engine
      set(state => {
          if (trackId === 'MASTER') return state; // Can't mute master this way?
          const track = state.tracks[trackId];
          if (!track) return state;

          // Logic for mute: set gain to 0 in engine
          const newMute = !track.isMuted;
          const engineTrack = mixerEngine.getTrack(trackId);
          if (engineTrack) {
              engineTrack.setVolume(newMute ? 0 : track.volume);
          }

          return {
              tracks: { ...state.tracks, [trackId]: { ...track, isMuted: newMute } }
          };
      });
  },

  toggleTrackSolo: (trackId) => {
       // TODO: Implement solo logic
       logger.warn("Solo not implemented yet");
  },

  addModule: (trackId, type) => {
      const module = createDefaultModule(type);

      set(state => {
          const isMaster = trackId === 'MASTER';
          const currentRack = isMaster ? state.master.rack : state.tracks[trackId]?.rack;
          if (!currentRack && !isMaster) return state;

          const newRack = [...currentRack, module];

          if (isMaster) {
              mixerEngine.masterBus.updateRack(newRack);
              return { master: { ...state.master, rack: newRack } };
          } else {
              mixerEngine.getTrack(trackId)?.updateRack(newRack);
              return {
                  tracks: {
                      ...state.tracks,
                      [trackId]: { ...state.tracks[trackId], rack: newRack }
                  }
              };
          }
      });
  },

  removeModule: (trackId, moduleId) => {
      set(state => {
          const isMaster = trackId === 'MASTER';
          const currentRack = isMaster ? state.master.rack : state.tracks[trackId]?.rack;
          if (!currentRack && !isMaster) return state;

          const newRack = currentRack.filter(m => m.id !== moduleId);

          if (isMaster) {
              mixerEngine.masterBus.updateRack(newRack);
              return { master: { ...state.master, rack: newRack } };
          } else {
              mixerEngine.getTrack(trackId)?.updateRack(newRack);
              return {
                  tracks: {
                      ...state.tracks,
                      [trackId]: { ...state.tracks[trackId], rack: newRack }
                  }
              };
          }
      });
  },

  toggleModuleBypass: (trackId, moduleId) => {
       set(state => {
          const isMaster = trackId === 'MASTER';
          const currentRack = isMaster ? state.master.rack : state.tracks[trackId]?.rack;
          if (!currentRack && !isMaster) return state;

          const newRack = currentRack.map(m => m.id === moduleId ? { ...m, bypass: !m.bypass } : m);

          if (isMaster) {
              mixerEngine.masterBus.updateRack(newRack);
              return { master: { ...state.master, rack: newRack } };
          } else {
              mixerEngine.getTrack(trackId)?.updateRack(newRack);
              return {
                  tracks: {
                      ...state.tracks,
                      [trackId]: { ...state.tracks[trackId], rack: newRack }
                  }
              };
          }
      });
  },

  reorderRack: (trackId, startIndex, endIndex) => {
       set(state => {
          const isMaster = trackId === 'MASTER';
          const currentRack = isMaster ? state.master.rack : state.tracks[trackId]?.rack;
          if (!currentRack && !isMaster) return state;

          const newRack = arrayMove(currentRack, startIndex, endIndex);

          if (isMaster) {
              mixerEngine.masterBus.updateRack(newRack);
              return { master: { ...state.master, rack: newRack } };
          } else {
              mixerEngine.getTrack(trackId)?.updateRack(newRack);
              return {
                  tracks: {
                      ...state.tracks,
                      [trackId]: { ...state.tracks[trackId], rack: newRack }
                  }
              };
          }
      });
  },

  updateModuleParam: (trackId, moduleId, param, value) => {
       set(state => {
          const isMaster = trackId === 'MASTER';
          const currentRack = isMaster ? state.master.rack : state.tracks[trackId]?.rack;
          if (!currentRack && !isMaster) return state;

          const newRack = currentRack.map(m =>
              m.id === moduleId
              ? { ...m, parameters: { ...m.parameters, [param]: value } }
              : m
          );

          if (isMaster) {
               mixerEngine.masterBus.updateModuleParam(moduleId, param, value);
               return { master: { ...state.master, rack: newRack } };
          } else {
               mixerEngine.getTrack(trackId)?.updateModuleParam(moduleId, param, value);
               return {
                  tracks: {
                      ...state.tracks,
                      [trackId]: { ...state.tracks[trackId], rack: newRack }
                  }
              };
          }
      });
  },

  loadAsset: async (file) => {
      try {
          const arrayBuffer = await file.arrayBuffer();
          if (!mixerEngine.context) throw new Error("Audio Engine not initialized");
          
          const audioBuffer = await mixerEngine.context.decodeAudioData(arrayBuffer);
          const assetId = crypto.randomUUID();
          
          await setIDB(`asset_${assetId}`, file);
          
          set(state => ({
              assets: { ...state.assets, [assetId]: audioBuffer }
          }));
          return assetId;
      } catch (e) {
          logger.error("Failed to load asset", e);
          throw e;
      }
  },

  saveProject: async () => {
      const state = get();
      const projectMeta = {
          updatedAt: Date.now(),
          tracks: state.tracks,
          trackOrder: state.trackOrder,
          master: state.master
      };
      await setIDB('current_project_meta', projectMeta);
      logger.info("Project saved.");
  },

  loadProject: async () => {
       // Reimplement for new structure
       // Simplified for now: just load structure
       try {
           const meta = await getIDB('current_project_meta');
           if (meta) {
               set({
                   tracks: meta.tracks || {},
                   trackOrder: meta.trackOrder || [],
                   master: meta.master || get().master
               });

               // Restore engine state
               // Restore master rack
               if (meta.master && meta.master.rack) {
                   mixerEngine.masterBus.updateRack(meta.master.rack);
               }

               // Restore tracks
               if (meta.tracks) {
                   for (const [id, trackState] of Object.entries(meta.tracks as Record<string, TrackState>)) {
                       mixerEngine.addTrack(id);
                       mixerEngine.getTrack(id)?.updateRack(trackState.rack);
                       mixerEngine.getTrack(id)?.setVolume(trackState.volume);
                       mixerEngine.getTrack(id)?.setPan(trackState.pan);

                       // Load source if exists
                       const sourceFile = await getIDB(`track_${id}_source`) as File;
                       if (sourceFile) {
                           await get().loadSourceFile(id, sourceFile);
                       }
                   }
               }
           }
       } catch (e) {
           logger.error("Failed to load project", e);
       }
  }
}));
