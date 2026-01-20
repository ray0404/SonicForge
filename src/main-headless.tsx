import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAudioStore } from './store/useAudioStore';
import { audioEngine } from './audio/context';
import { audioBufferToWav } from './utils/wav-export';
import { getModuleDescriptors } from './audio/module-descriptors';
import { throttle } from 'lodash-es'; // Using a simple throttle

// Minimal component that just initializes the store/engine logic
const HeadlessApp = () => {
  return <div data-testid="headless-mount" style={{ display: 'none' }}>Sonic Forge Engine Running</div>;
};

// --- Bridge Interface ---

const SonicForgeBridge = {
  /**
   * Initialize the Audio Context and optionally set up the TUI event bridge.
   * @param tuiMode - If true, sets up a subscription to push state changes to the TUI.
   */
  init: async (tuiMode = false) => {
    await useAudioStore.getState().initializeEngine();
    console.log('[Headless] Audio Engine Initialized.');

    if (tuiMode && typeof window.__TUI_DISPATCH__ === 'function') {
      console.log('[Headless] TUI Mode Enabled. Setting up state dispatcher.');

      // This function gathers and sends all relevant state to the TUI
      const dispatchStateToTUI = () => {
        const state = useAudioStore.getState();
        const levels = audioEngine.getRMSLevel();
        const rackStatus: Record<string, any> = {};
        
        state.rack.forEach(m => {
            const node = audioEngine.getModuleNode(m.id) as any;
            if (node && typeof node.getReduction === 'function') {
                rackStatus[m.id] = { reduction: node.getReduction() };
            }
        });

        // Dispatch a single payload with all updates
        window.__TUI_DISPATCH__({
          rack: state.rack,
          playback: {
            isPlaying: state.isPlaying,
            currentTime: state.currentTime,
            duration: state.sourceDuration,
          },
          metering: {
            input: levels.input,
            output: levels.output,
            gainReduction: 0, // Legacy
            rack: rackStatus,
          },
        });
      };
      
      // Throttle high-frequency updates (like time)
      const throttledDispatch = throttle(dispatchStateToTUI, 200, { leading: true, trailing: true });

      // Subscribe to the audio store
      useAudioStore.subscribe(() => {
        // Use the throttled version for all updates to keep it simple
        throttledDispatch();
      });
      
      // Send initial state immediately
      dispatchStateToTUI();
    }

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
          const wavBuffer = audioBufferToWav(renderedBuffer, { float32: true });
          
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
      console.log(`[Headless] Audio Loaded. Duration: ${audioBuffer.duration}s.`);
      return { success: true, duration: audioBuffer.duration };
    } catch (error: any) {
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
      useAudioStore.getState().togglePlay();
      return { success: true };
  },

  setMasterVolume: (val: number) => {
      useAudioStore.getState().setMasterVolume(val);
      return { success: true };
  },

  updateParam: (moduleId: string, paramId: string, value: number) => {
    useAudioStore.getState().updateModuleParam(moduleId, paramId, value);
    return { success: true, value };
  },
  
  seek: (time: number) => {
      useAudioStore.getState().seek(time);
      return { success: true };
  },

  getModuleDescriptors: () => {
    return getModuleDescriptors();
  },

  // --- Getters are now mostly for redundancy/debugging ---

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

  getMeteringData: () => {
     const levels = audioEngine.getRMSLevel();
     const rackStatus: Record<string, any> = {};
     const rack = useAudioStore.getState().rack;
     
     rack.forEach(m => {
         const node = audioEngine.getModuleNode(m.id) as any;
         if (node && typeof node.getReduction === 'function') {
             rackStatus[m.id] = { reduction: node.getReduction() };
         }
     });

     return {
       input: levels.input, 
       output: levels.output,
       gainReduction: 0,
       rack: rackStatus
     };
  }
};

// Expose to window for Puppeteer
declare global {
  interface Window {
    __SONICFORGE_BRIDGE__: typeof SonicForgeBridge;
    __TUI_DISPATCH__: (payload: any) => void;
  }
}

window.__SONICFORGE_BRIDGE__ = SonicForgeBridge;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HeadlessApp />
  </React.StrictMode>
);

console.log('[Headless] React App Mounted');