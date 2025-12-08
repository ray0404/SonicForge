import { create } from 'zustand';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';

interface AudioState {
  isInitialized: boolean;
  isPlaying: boolean;
  masterVolume: number; // 0.0 to 1.0
  dspGain: number;      // 0.0 to 1.0 (Worklet parameter)

  initializeEngine: () => Promise<void>;
  togglePlay: () => void;
  setMasterVolume: (val: number) => void;
  setDspGain: (val: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  masterVolume: 1.0,
  dspGain: 0.8,

  initializeEngine: async () => {
    if (get().isInitialized) return;
    try {
      await audioEngine.init();
      set({ isInitialized: true });
    } catch (error) {
      logger.error("Store failed to init engine", error);
    }
  },

  togglePlay: () => {
    // Resume context if needed
    audioEngine.resume();

    // For this demo, 'play' just triggers the test tone
    // In a real DAW, this would start the transport
    if (!get().isPlaying) {
       audioEngine.playTestTone();
       set({ isPlaying: true });
       // Reset playing state after 2s (since tone stops)
       setTimeout(() => set({ isPlaying: false }), 2000);
    } else {
       // Stop logic would go here
       set({ isPlaying: false });
    }
  },

  setMasterVolume: (val: number) => {
    set({ masterVolume: val });
    if (audioEngine.masterGain) {
      // Smooth ramp to prevent clicks
      audioEngine.masterGain.gain.setTargetAtTime(val, audioEngine.context?.currentTime || 0, 0.1);
    }
  },

  setDspGain: (val: number) => {
    set({ dspGain: val });
    if (audioEngine.workletNode) {
        audioEngine.workletNode.setGain(val);
    }
  }
}));
