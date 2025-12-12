import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { EffectsRack } from '@/components/rack/EffectsRack';
import { Transport } from '@/components/Transport';
import { MasteringVisualizer } from '@/components/visualizers/MasteringVisualizer';
import { AddModuleMenu } from '@/components/rack/AddModuleMenu';

export const MasteringWorkspace: React.FC = () => {
  const { saveProject, isPersistedToDisk } = useProjectPersistence();

  const handleSave = async () => {
      // Create a dummy WAV blob for demonstration
      const dummyBlob = new Blob(['RIFF...WAVE...'], { type: 'audio/wav' });
      await saveProject(dummyBlob);
  };

  return (
    <div className="flex flex-col h-full bg-background text-slate-200 overflow-hidden font-sans">
        {/* Header / Top Bar */}
        <header className="shrink-0 flex flex-col bg-surface border-b border-slate-700 shadow-md z-40">
             {/* Title & Actions Row */}
             <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                     <div className="w-5 h-5 bg-gradient-to-br from-primary to-purple-600 rounded"></div>
                     <h1 className="text-sm font-bold tracking-tight text-slate-100">Sonic Forge <span className="text-xs font-normal text-slate-500 ml-2">Mastering Suite</span></h1>
                  </div>

                  <div className="flex items-center gap-4">
                      {/* Status */}
                      {!isPersistedToDisk && (
                          <div className="flex items-center gap-1 text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded text-[10px] border border-amber-500/20">
                              <AlertTriangle size={10} />
                              <span>Unsaved</span>
                          </div>
                      )}

                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold transition-colors border border-slate-700"
                        title="Save Project"
                      >
                          <Save size={12} />
                          Save
                      </button>

                      <div className="h-4 w-px bg-slate-700 mx-1"></div>

                      <AddModuleMenu />
                  </div>
             </div>

             {/* Transport Row */}
             <div className="px-6 py-2 bg-slate-900/50 flex justify-center border-b border-slate-800">
                 <Transport />
             </div>
        </header>

        {/* Middle: Scrollable Rack */}
        <main className="flex-1 overflow-y-auto bg-rack-bg p-4 md:p-8 relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div className="max-w-4xl mx-auto pb-32">
                 <EffectsRack />
            </div>
        </main>

        {/* Bottom: Visualizer */}
        <footer className="shrink-0 h-48 border-t border-slate-700 relative z-30 bg-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <MasteringVisualizer />
        </footer>

        {/* Status Bar */}
        <div className="h-5 bg-slate-950 text-slate-600 text-[9px] flex items-center px-4 justify-between select-none border-t border-slate-800">
             <span>AUDIO ENGINE: RUNNING (44.1kHz)</span>
             <span>LATENCY: ~2ms</span>
        </div>
    </div>
  );
};
