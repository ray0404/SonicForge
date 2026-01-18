import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';
import { get as getIDB, set as setIDB } from 'idb-keyval';

export type RackModuleType = 'DYNAMIC_EQ' | 'TRANSIENT_SHAPER' | 'LIMITER' | 'MIDSIDE_EQ' | 'CAB_SIM' | 'LOUDNESS_METER' | 'SATURATION' | 'DITHERING' | 'PARAMETRIC_EQ' | 'DISTORTION' | 'BITCRUSHER' | 'CHORUS' | 'PHASER' | 'TREMOLO' | 'AUTOWAH' | 'FEEDBACK_DELAY' | 'COMPRESSOR' | 'DE_ESSER' | 'STEREO_IMAGER' | 'MULTIBAND_COMPRESSOR';

export interface RackModule {
  id: string;
  type: RackModuleType;
  bypass: boolean;
  parameters: Record<string, any>;
}

interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  sourceDuration: number;
  currentTime: number;
  masterVolume: number;
  rack: RackModule[];
  assets: Record<string, AudioBuffer>;
  history: AudioBuffer[];

  initializeEngine: () => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  loadSourceFile: (file: File) => Promise<void>;
  clearSource: () => Promise<void>;
  setMasterVolume: (val: number) => void;
  
  addModule: (type: RackModuleType) => void;
  removeModule: (id: string) => void;
  toggleModuleBypass: (id: string) => void;
  reorderRack: (startIndex: number, endIndex: number) => void;
  updateModuleParam: (id: string, param: string, value: any) => void;
  
  loadAsset: (file: File) => Promise<string>;
  saveProject: () => Promise<void>;
  loadProject: () => Promise<void>;

  pushHistory: () => void;
  undo: () => void;
  updateSourceBuffer: (buffer: AudioBuffer) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  sourceDuration: 0,
  currentTime: 0,
  masterVolume: 1.0,
  rack: [],
  assets: {},
  history: [],

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
       if (audioEngine.sourceBuffer) {
         audioEngine.play();
         set({ isPlaying: true });
       }
    }
  },

  seek: (time: number) => {
      audioEngine.seek(time);
      set({ currentTime: time });
  },

  loadSourceFile: async (file: File) => {
      try {
          await setIDB('current_project_source', file);
          const buffer = await audioEngine.loadSource(file);
          set({ 
              sourceDuration: buffer.duration,
              currentTime: 0,
              isPlaying: false,
              history: [] // Clear history on new file
          });
          logger.info("Source file loaded.");
      } catch (e) {
          logger.error("Failed to load source file", e);
      }
  },

  clearSource: async () => {
      try {
          await setIDB('current_project_source', null);
          audioEngine.pause();
          audioEngine.sourceBuffer = null;
          set({ 
              sourceDuration: 0,
              currentTime: 0,
              isPlaying: false,
              history: []
          });
          logger.info("Source cleared.");
      } catch (e) {
          logger.error("Failed to clear source", e);
      }
  },

  pushHistory: () => {
    const currentBuffer = audioEngine.sourceBuffer;
    if (currentBuffer) {
      // Simple copy of the buffer to preserve state
      const copy = audioEngine.context!.createBuffer(
        currentBuffer.numberOfChannels,
        currentBuffer.length,
        currentBuffer.sampleRate
      );
      for (let i = 0; i < currentBuffer.numberOfChannels; i++) {
        copy.copyToChannel(currentBuffer.getChannelData(i), i);
      }
      set(state => ({
        history: [...state.history.slice(-9), copy as any] // Keep last 10 steps
      }));
    }
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previousBuffer = history[history.length - 1];
    set(state => ({
      history: state.history.slice(0, -1)
    }));

    get().updateSourceBuffer(previousBuffer);
  },

  updateSourceBuffer: (buffer: AudioBuffer) => {
    const wasPlaying = get().isPlaying;
    if (wasPlaying) audioEngine.pause();

    audioEngine.sourceBuffer = buffer;
    set({ 
      sourceDuration: buffer.duration,
      isPlaying: false
    });

    if (wasPlaying) audioEngine.play();
    set({ isPlaying: wasPlaying });
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
    }
    else if (type === 'TRANSIENT_SHAPER') newModule.parameters = { attackGain: 0, sustainGain: 0 };
    else if (type === 'LIMITER') newModule.parameters = { threshold: -0.5, ceiling: -0.1, release: 0.1, lookahead: 5 };
    else if (type === 'MIDSIDE_EQ') newModule.parameters = { midGain: 0, midFreq: 1000, sideGain: 0, sideFreq: 1000 };
    else if (type === 'CAB_SIM') newModule.parameters = { irAssetId: '', mix: 1.0 };
    else if (type === 'SATURATION') newModule.parameters = { drive: 0.0, type: 1, outputGain: 0.0 };
    else if (type === 'DITHERING') newModule.parameters = { bitDepth: 24 };
    else if (type === 'PARAMETRIC_EQ') newModule.parameters = { lowFreq: 100, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 0.707, highFreq: 5000, highGain: 0 };
    else if (type === 'DISTORTION') newModule.parameters = { drive: 1, wet: 1, type: 0, outputGain: 0 };
    else if (type === 'BITCRUSHER') newModule.parameters = { bits: 8, normFreq: 1, mix: 1 };
    else if (type === 'CHORUS') newModule.parameters = { frequency: 1.5, delayTime: 0.03, depth: 0.002, feedback: 0, wet: 0.5 };
    else if (type === 'PHASER') newModule.parameters = { stages: 4, frequency: 0.5, baseFrequency: 1000, octaves: 2, wet: 0.5 };
    else if (type === 'TREMOLO') newModule.parameters = { frequency: 4, depth: 0.5, spread: 0, waveform: 0 };
    else if (type === 'AUTOWAH') newModule.parameters = { baseFrequency: 100, sensitivity: 0.5, octaves: 4, Q: 2, attack: 0.01, release: 0.1, wet: 1 };
    else if (type === 'FEEDBACK_DELAY') newModule.parameters = { delayTime: 0.5, feedback: 0.3, wet: 0.5 };
    else if (type === 'COMPRESSOR') {
        newModule.parameters = { threshold: -24, ratio: 4, attack: 0.01, release: 0.1, knee: 5, makeupGain: 0, mode: 0, mix: 1 };
    }
    else if (type === 'DE_ESSER') {
        newModule.parameters = { frequency: 6000, threshold: -20, ratio: 4, attack: 0.005, release: 0.05, monitor: 0, bypass: 0 };
    }
    else if (type === 'STEREO_IMAGER') newModule.parameters = { lowFreq: 150, highFreq: 2500, widthLow: 0.0, widthMid: 1.0, widthHigh: 1.2, bypass: 0 };
    else if (type === 'MULTIBAND_COMPRESSOR') {
        newModule.parameters = {
            lowFreq: 150, highFreq: 2500,
            threshLow: -24, ratioLow: 4, attLow: 0.01, relLow: 0.1, gainLow: 0,
            threshMid: -24, ratioMid: 4, attMid: 0.01, relMid: 0.1, gainMid: 0,
            threshHigh: -24, ratioHigh: 4, attHigh: 0.01, relHigh: 0.1, gainHigh: 0,
            bypass: 0
        };
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
          if (!audioEngine.context) throw new Error("Audio Engine not initialized");
          
          const audioBuffer = await audioEngine.context.decodeAudioData(arrayBuffer);
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
          rack: state.rack,
          masterVolume: state.masterVolume
      };
      await setIDB('current_project_meta', projectMeta);
      logger.info("Project saved.");
  },

  loadProject: async () => {
      try {
        const meta = await getIDB('current_project_meta');
        if (meta && meta.rack) {
            set({ rack: meta.rack, masterVolume: meta.masterVolume || 1.0 });
            
            const uniqueAssetIds = new Set<string>();
            meta.rack.forEach((m: RackModule) => {
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

            const sourceFile = await getIDB('current_project_source') as File;
            if (sourceFile && audioEngine.context) {
                 const buffer = await audioEngine.loadSource(sourceFile);
                 set({ sourceDuration: buffer.duration, currentTime: 0 });
            }

            audioEngine.rebuildGraph(meta.rack);
        }
      } catch (e) {
          logger.error("Failed to load project", e);
      }
  }
}));