import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAudioStore } from './store/useAudioStore';
import { audioEngine } from './audio/context';

// Minimal component that just initializes the store/engine logic
// but renders nothing visual.
const HeadlessApp = () => {
  return <div data-testid="headless-mount" style={{ display: 'none' }}>Sonic Forge Engine Running</div>;
};

// --- Bridge Interface ---

const SonicForgeBridge = {
  /**
   * Initialize the Audio Context (if not already)
   */
  init: async () => {
    await audioEngine.init();
    console.log('[Headless] Audio Engine Initialized');
    return true;
  },

  /**
   * Load an ArrayBuffer into the engine
   */
  loadAudio: async (arrayBuffer: ArrayBuffer) => {
    try {
      console.log(`[Headless] Received ArrayBuffer: ${arrayBuffer.byteLength} bytes`);
      // In a real scenario, we might decode this and set it as the source.
      // For now, we assume the Rack processes live input or we need a specific 'Player' module.
      return { success: true };
    } catch (error) {
      console.error('[Headless] Load Audio Failed', error);
      return { success: false, error };
    }
  },

  /**
   * Update a module parameter
   */
  updateParam: (moduleId: string, paramId: string, value: number) => {
    const state = useAudioStore.getState();
    state.updateModuleParam(moduleId, paramId, value);
    console.log(`[Headless] Set ${moduleId}.${paramId} = ${value}`);
    return { success: true, value };
  },

  /**
   * Get current metering data
   */
  getMeteringData: () => {
     // Mocking metering data for now
     // Real implementation would access audioEngine.analyserL/R getFloatTimeDomainData
     return {
       input: -20 + Math.random() * 5, 
       output: -20 + Math.random() * 5,
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