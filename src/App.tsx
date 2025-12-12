import { useEffect } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { EffectsRack } from '@/components/rack/EffectsRack';
import { Transport } from '@/components/Transport';
import { Save, AlertTriangle } from 'lucide-react';
import { MasteringVisualizer } from '@/components/visualizers/MasteringVisualizer';

function App() {
  const { isInitialized, initializeEngine } = useAudioStore();
  const { saveProject, isPersistedToDisk } = useProjectPersistence();

  useEffect(() => {
    // Attempt auto-init on user interaction if needed,
    // but usually we wait for explicit "Start" to respect Autoplay Policy
  }, []);

  const handleStart = async () => {
      await initializeEngine();
  };

  const handleSave = async () => {
      // Create a dummy WAV blob for demonstration
      const dummyBlob = new Blob(['RIFF...WAVE...'], { type: 'audio/wav' });
      await saveProject(dummyBlob);
  };

  if (!isInitialized) {
      return (
          <div className="flex items-center justify-center h-full w-full bg-background">
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105"
              >
                  Initialize Sonic Forge
              </button>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-background text-slate-200">
      {/* Header / Transport Bar */}
      <header className="flex flex-col border-b border-slate-700 shadow-sm">
          {/* Top Bar: Title & Global Actions */}
          <div className="flex items-center justify-between px-6 py-2 bg-surface border-b border-slate-800">
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-md"></div>
                 <h1 className="text-md font-bold tracking-tight text-slate-100">Sonic Forge <span className="text-xs font-normal text-slate-500 ml-2">Mastering Suite</span></h1>
              </div>

              <div className="flex items-center gap-2">
                  {!isPersistedToDisk && (
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-900/20 px-2 py-1 rounded text-xs border border-amber-500/20">
                          <AlertTriangle size={12} />
                          <span>Unsaved</span>
                      </div>
                  )}
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold transition-colors"
                    title="Save Project"
                  >
                      <Save size={14} />
                      Save
                  </button>
              </div>
          </div>
          
          {/* Transport Controls */}
          <Transport />
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <EffectsRack />
          </div>
          <div className="h-48 shrink-0 border-t border-slate-700 bg-slate-900">
            <MasteringVisualizer />
          </div>
      </main>

      {/* Status Bar */}
      <footer className="h-6 bg-slate-950 text-slate-500 text-[10px] flex items-center px-4 justify-between select-none">
          <span>AUDIO ENGINE: RUNNING (44.1kHz)</span>
          <span>LATENCY: ~2ms</span>
      </footer>
    </div>
  )
}

export default App;
