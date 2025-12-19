import React, { useState } from 'react';
import { Save, AlertTriangle, Layers, Activity, HardDriveUpload } from 'lucide-react';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { EffectsRack } from '@/components/rack/EffectsRack';
import { Transport } from '@/components/Transport';
import { MasteringVisualizer } from '@/components/visualizers/MasteringVisualizer';
import { AddModuleMenu } from '@/components/rack/AddModuleMenu';
import { TimelineView } from '@/components/timeline/TimelineView';
import { useAudioStore } from '@/store/useAudioStore';
import { clsx } from 'clsx';

type View = 'rack' | 'timeline';

export const MasteringWorkspace: React.FC = () => {
  console.log("Rendering MasteringWorkspace");
  const { saveProject, isPersistedToDisk } = useProjectPersistence();
  const [activeView, setActiveView] = useState<View>('timeline');
  const { tracks } = useAudioStore();

  const handleSave = async () => {
      await saveProject();
  };

  const handleAddTrackClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            useAudioStore.getState().addTrack(file);
        }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-slate-200 overflow-hidden font-sans">
        <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface border-b border-slate-700 shadow-lg z-50">
             <div className="flex items-center gap-3">
                 <button onClick={() => setActiveView(v => v === 'rack' ? 'timeline' : 'rack')} className="text-text-muted hover:text-white transition-colors">
                    <span className="material-symbols-outlined">grid_view</span>
                 </button>
                 <div className="leading-tight">
                     <h1 className="text-sm font-bold tracking-tight text-slate-100">Sonic Forge</h1>
                     <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Multi-track Editor</span>
                 </div>
             </div>
             <div className="flex items-center gap-3">
                 <button
                   onClick={handleSave}
                   className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                   title="Save Project"
                 >
                     <Save size={16} className="sm:w-3 sm:h-3" />
                     <span className="hidden sm:inline">Save</span>
                 </button>
                 <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>
                 {activeView === 'rack' ? <AddModuleMenu /> : (
                    <button
                        onClick={handleAddTrackClick}
                        className="p-2 sm:px-3 sm:py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold transition-all border border-primary/30 flex items-center gap-2"
                    >
                        <HardDriveUpload size={16} className="sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">Add Track</span>
                    </button>
                 )}
             </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
            {activeView === 'timeline' && <TimelineView />}
            {activeView === 'rack' && (
                <div className="h-full overflow-y-auto p-8 bg-rack-bg scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                    <div className="max-w-5xl mx-auto pb-10">
                         <EffectsRack />
                    </div>
                </div>
            )}
        </main>

        <footer className="shrink-0 bg-surface border-t border-slate-700 z-40">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-center shadow-inner">
                <Transport />
            </div>
            {tracks.length > 0 && activeView === 'timeline' && (
                <div className="h-12 flex items-center px-6 text-xs text-text-muted font-mono">
                    CH 1 SELECTED
                </div>
            )}
        </footer>
    </div>
  );
};
