import React, { useState } from 'react';
import { Save, AlertTriangle, Layers, Activity } from 'lucide-react';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { EffectsRack } from '@/components/rack/EffectsRack';
import { Transport } from '@/components/Transport';
import { MasteringVisualizer } from '@/components/visualizers/MasteringVisualizer';
import { AddModuleMenu } from '@/components/rack/AddModuleMenu';
import { clsx } from 'clsx';

type Tab = 'rack' | 'visualizer';

export const MasteringWorkspace: React.FC = () => {
  const { saveProject, isPersistedToDisk } = useProjectPersistence();
  const [activeTab, setActiveTab] = useState<Tab>('rack');

  const handleSave = async () => {
      await saveProject();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-slate-200 overflow-hidden font-sans">
        {/* === HEADER === */}
        <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface border-b border-slate-700 shadow-lg z-50">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg shadow-inner flex items-center justify-center">
                    <Activity size={18} className="text-white mix-blend-overlay" />
                 </div>
                 <div className="leading-tight">
                     <h1 className="text-sm font-bold tracking-tight text-slate-100">Sonic Forge</h1>
                     <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Mastering</span>
                 </div>
             </div>

             <div className="flex items-center gap-3">
                 {!isPersistedToDisk && (
                     <div className="hidden sm:flex items-center gap-1 text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded text-[10px] border border-amber-500/20 animate-pulse">
                         <AlertTriangle size={10} />
                         <span>Unsaved</span>
                     </div>
                 )}
                 <button
                   onClick={handleSave}
                   className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                   title="Save Project"
                 >
                     <Save size={16} className="sm:w-3 sm:h-3" />
                     <span className="hidden sm:inline">Save</span>
                 </button>
                 <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>
                 <AddModuleMenu />
             </div>
        </header>

        {/* === MAIN CONTENT (Desktop Grid / Mobile Flex) === */}
        <main className="flex-1 overflow-hidden relative">
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid h-full grid-rows-[1fr_260px]">
                {/* Rack Area */}
                <div className="overflow-y-auto p-8 bg-rack-bg scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                    <div className="max-w-5xl mx-auto pb-10">
                         <EffectsRack />
                    </div>
                </div>
                
                {/* Bottom Section: Transport & Visuals */}
                <div className="bg-surface border-t border-slate-700 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40">
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-center shadow-inner">
                        <Transport />
                    </div>
                    <div className="flex-1 p-4 bg-slate-900">
                        <MasteringVisualizer className="w-full h-full" />
                    </div>
                </div>
            </div>

            {/* Mobile: Tabbed Layout */}
            <div className="md:hidden h-full flex flex-col">
                <div className="flex-1 overflow-hidden relative">
                    {/* Rack Tab */}
                    <div className={clsx(
                        "absolute inset-0 overflow-y-auto bg-rack-pattern p-4 pb-24 transition-opacity duration-300",
                        activeTab === 'rack' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    )}>
                        <EffectsRack />
                    </div>
                    
                    {/* Visualizer Tab */}
                    <div className={clsx(
                        "absolute inset-0 bg-slate-900 p-4 flex flex-col gap-4 transition-opacity duration-300",
                        activeTab === 'visualizer' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    )}>
                        <MasteringVisualizer className="w-full h-full" />
                    </div>
                </div>

                {/* Mobile Bottom Bar: Transport + Tabs */}
                <div className="shrink-0 bg-surface border-t border-slate-700 pb-safe z-50">
                     {/* Mini Transport */}
                     <div className="px-2 py-2 bg-slate-950 border-b border-slate-800 flex justify-center">
                         <Transport />
                     </div>
                     
                     {/* Tab Bar */}
                     <div className="flex h-12">
                         <button 
                            onClick={() => setActiveTab('rack')}
                            className={clsx(
                                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-colors relative",
                                activeTab === 'rack' ? "text-primary bg-slate-800" : "text-slate-500 hover:bg-slate-800/50"
                            )}
                         >
                            <Layers size={18} />
                            Rack
                            {activeTab === 'rack' && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                         </button>
                         
                         <div className="w-px bg-slate-800 my-2"></div>

                         <button 
                            onClick={() => setActiveTab('visualizer')}
                            className={clsx(
                                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-colors relative",
                                activeTab === 'visualizer' ? "text-primary bg-slate-800" : "text-slate-500 hover:bg-slate-800/50"
                            )}
                         >
                            <Activity size={18} />
                            Visuals
                            {activeTab === 'visualizer' && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                         </button>
                     </div>
                </div>
            </div>
        </main>
    </div>
  );
};