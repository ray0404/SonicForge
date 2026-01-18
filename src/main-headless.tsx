import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAudioStore } from './store/useAudioStore';
import { audioEngine } from './audio/context';

// Minimal component that just initializes the store/engine logic
// but renders nothing visual.
const HeadlessApp = () => {
  return <div data-testid="headless-mount" style={{ display: 'none' }}>Sonic Forge Engine Running</div>;
};

import { audioBufferToWav } from './utils/wav-export';

// --- Bridge Interface ---

const SonicForgeBridge = {
  /**
   * Initialize the Audio Context (if not already)
   */
  init: async () => {
    // We MUST use the store's initializer to set up the playback interval loop
    await useAudioStore.getState().initializeEngine();
    console.log('[Headless] Audio Engine Initialized via Store');
    return true;
  },

  /**
   * Export the project to a WAV file
   */
  exportAudio: async () => {
      try {
          const state = useAudioStore.getState();
          console.log('[Headless] Starting Offline Render...');
          const renderedBuffer = await audioEngine.renderOffline(state.rack, state.assets);
          if (!renderedBuffer) throw new Error("Offline render returned null");
          
          console.log('[Headless] Render complete. Encoding WAV...');
          const wavBuffer = audioBufferToWav(renderedBuffer, { float32: true }); // Use 32-bit float
          
          // Convert ArrayBuffer to regular array for transport
          return { success: true, data: Array.from(new Uint8Array(wavBuffer)) };
      } catch (error: any) {
          console.error('[Headless] Export Failed', error);
          return { success: false, error: error.message };
      }
  },

  /**
   * Load an ArrayBuffer into the engine
   */
  loadAudio: async (arrayBuffer: ArrayBuffer) => {
    try {
      console.log(`[Headless] Received ArrayBuffer: ${arrayBuffer.byteLength} bytes`);
      const ctx = audioEngine.context;
      if (!ctx) throw new Error("Audio Context not initialized");

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      useAudioStore.getState().updateSourceBuffer(audioBuffer);
      console.log(`[Headless] Audio Loaded. Duration: ${audioBuffer.duration}s. Channels: ${audioBuffer.numberOfChannels}`);
      return { success: true, duration: audioBuffer.duration };
    } catch (error) {
      console.error('[Headless] Load Audio Failed', error);
      return { success: false, error };
    }
  },

  addModule: (type: any) => {
      useAudioStore.getState().addModule(type);
      return { success: true };
  },

  removeModule: (id: string) => {
      useAudioStore.getState().removeModule(id);
      return { success: true };
  },

  reorderRack: (startIndex: number, endIndex: number) => {
      useAudioStore.getState().reorderRack(startIndex, endIndex);
      return { success: true };
  },

  toggleModuleBypass: (id: string) => {
      useAudioStore.getState().toggleModuleBypass(id);
      return { success: true };
  },

  togglePlay: () => {
      const state = useAudioStore.getState();
      console.log(`[Headless] Toggle Play. Current: ${state.isPlaying}. Has Source: ${!!audioEngine.sourceBuffer}. Context State: ${audioEngine.context?.state}`);
      state.togglePlay();
      console.log(`[Headless] New State: ${useAudioStore.getState().isPlaying}`);
      return { success: true, isPlaying: useAudioStore.getState().isPlaying };
  },

  setMasterVolume: (val: number) => {
      useAudioStore.getState().setMasterVolume(val);
      return { success: true };
  },

  getRack: () => {
      return useAudioStore.getState().rack;
  },

  getPlaybackState: () => {
      const state = useAudioStore.getState();
      return { 
          isPlaying: state.isPlaying,
          currentTime: state.currentTime,
          duration: state.sourceDuration
      };
  },

  /**
   * Update a module parameter
   */
  updateParam: (moduleId: string, paramId: string, value: number) => {
    const state = useAudioStore.getState();
    state.updateModuleParam(moduleId, paramId, value);
    return { success: true, value };
  },
  
  seek: (time: number) => {
      useAudioStore.getState().seek(time);
      return { success: true };
  },

  /**
   * Get current metering data
   */
  getMeteringData: () => {
     // Get real RMS levels from the engine
     const levels = audioEngine.getRMSLevel();
     return {
       input: levels.input, 
       output: levels.output,
       gainReduction: 0
     };
  }
};

// Expose to window for Puppeteer
declare global {
  interface Window {
    __SONICFORGE_BRIDGE__: typeof SonicForgeBridge;
  }
}

window.__SONICFORGE_BRIDGE__ = SonicForgeBridge;

// Auto-initialize
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HeadlessApp />
  </React.StrictMode>
);

console.log('[Headless] React App Mounted');