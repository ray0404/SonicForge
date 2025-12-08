import { useEffect } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { EffectsRack } from '@/components/rack/EffectsRack';
import { Save, AlertTriangle, Power, Volume2 } from 'lucide-react';

function App() {
  const { isInitialized, initializeEngine, togglePlay, isPlaying, masterVolume, setMasterVolume } = useAudioStore();
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
      <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-md"></div>
             <h1 className="text-lg font-bold tracking-tight">Sonic Forge</h1>
          </div>

          <div className="flex items-center gap-4">
              <button
                 onClick={togglePlay}
                 className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${isPlaying ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                 <Power size={18} />
                 {isPlaying ? 'Stop' : 'Play Tone'}
              </button>

              <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-md border border-slate-700">
                  <Volume2 size={16} className="text-slate-400"/>
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-slate-200"
                  />
              </div>
          </div>

          <div className="flex items-center gap-2">
              {!isPersistedToDisk && (
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-900/20 px-2 py-1 rounded text-xs border border-amber-500/20">
                      <AlertTriangle size={12} />
                      <span>Browser Storage Only</span>
                  </div>
              )}
              <button
                onClick={handleSave}
                className="p-2 bg-primary hover:bg-blue-600 rounded-md transition-colors"
                title="Save Project"
              >
                  <Save size={18} />
              </button>
          </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative">
          <EffectsRack />
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
