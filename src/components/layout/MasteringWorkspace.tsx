import React, { useState, useRef } from 'react';
import { Save, AlertTriangle, Layers, Activity, FileAudio, Trash2, Menu, X } from 'lucide-react';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { useAudioStore } from '@/store/useAudioStore';
import { useUIStore } from '@/store/useUIStore';
import { usePanelRouting } from '@/hooks/usePanelRouting';
import { EffectsRack } from '@/components/rack/EffectsRack';
import { Transport } from '@/components/Transport';
import { MasteringVisualizer } from '@/components/visualizers/MasteringVisualizer';
import { AddModuleMenu } from '@/components/rack/AddModuleMenu';
import { SidePanel } from './SidePanel';
import { clsx } from 'clsx';

type Tab = 'rack' | 'visualizer';

export const MasteringWorkspace: React.FC = () => {
  const { saveProject, isPersistedToDisk } = useProjectPersistence();
  const { loadSourceFile, clearSource, sourceDuration } = useAudioStore();
  const { isPanelOpen, togglePanel } = useUIStore();
  
  // Enable URL <-> Store synchronization
  usePanelRouting();
  
  const [activeTab, setActiveTab] = useState<Tab>('rack');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
      await saveProject();
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          loadSourceFile(e.target.files[0]);
      }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-slate-200 overflow-hidden font-sans">
        {/* === HEADER === */}
        <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface border-b border-slate-700 shadow-lg z-[60] relative">
             <div className="flex items-center gap-3 shrink-0">
                 <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg shadow-inner flex items-center justify-center">
                    <Activity size={18} className="text-white mix-blend-overlay" />
                 </div>
                 <div className="leading-tight">
                     <h1 className="text-sm font-bold tracking-tight text-slate-100">Sonic Forge</h1>
                     <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Mastering</span>
                 </div>
             </div>

             <div className="flex items-center gap-3 justify-end flex-1 min-w-0">
                 {!isPersistedToDisk && (
                     <div className="hidden sm:flex items-center gap-1 text-amber-500 bg-amber-900/20 px-2 py-0.5 rounded text-[10px] border border-amber-500/20 animate-pulse shrink-0">
                         <AlertTriangle size={10} />
                         <span>Unsaved</span>
                     </div>
                 )}
                 <button
                   onClick={handleSave}
                   className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shrink-0"
                   title="Save Project"
                   aria-label="Save Project"
                 >
                     <Save size={16} className="sm:w-3 sm:h-3" />
                     <span className="hidden sm:inline">Save</span>
                 </button>

                 <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shrink-0">
                    <button
                        onClick={handleImportClick}
                        className="p-2 sm:px-3 sm:py-1.5 hover:bg-slate-700 active:bg-slate-600 text-xs font-bold transition-all flex items-center gap-2 border-r border-slate-700"
                        title="Import Audio"
                        aria-label="Import Audio"
                    >
                        <FileAudio size={16} className="sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">Audio</span>
                    </button>
                    {sourceDuration > 0 && (
                        <button
                            onClick={() => clearSource()}
                            className="p-2 hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-all"
                            title="Clear Audio"
                            aria-label="Clear Audio"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                 </div>

                 <input 
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                 />

                 <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block shrink-0"></div>
                 <AddModuleMenu />
                 
                 <div className="h-6 w-px bg-slate-700 mx-1 shrink-0"></div>
                 <button
                    onClick={togglePanel}
                    className={clsx(
                        "p-2 rounded-lg transition-all shrink-0",
                        isPanelOpen ? "bg-primary text-white shadow-glow" : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                    aria-label={isPanelOpen ? "Close Menu" : "Open Menu"}
                 >
                    {isPanelOpen ? <X size={20} /> : <Menu size={20} />}
                 </button>
             </div>
        </header>

        {/* === MAIN CONTENT (Desktop Grid / Mobile Flex) === */}
        <div className="flex-1 relative overflow-hidden flex">
            
            {/* Main Workspace Area - Pushes on Desktop */}
            <main className={clsx(
                "flex-1 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden",
                // Desktop Push Logic: Add margin right when panel is open
                isPanelOpen ? "md:mr-[400px]" : "md:mr-0"
            )}>
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
                        <div className="px-4 py-2 bg-background border-b border-slate-800 flex justify-center shadow-inner">
                            <Transport />
                        </div>
                        <div className="flex-1 p-4 bg-background">
                            <MasteringVisualizer className="w-full h-full" />
                        </div>
                    </div>
                </div>

                {/* Mobile: Tabbed Layout */}
                <div className="md:hidden h-full flex flex-col">
                    <div className="flex-1 overflow-hidden relative">
                        {/* Rack Tab */}
                        <div className={clsx(
                            "absolute inset-0 overflow-y-auto bg-rack-bg p-4 pb-24 transition-opacity duration-300",
                            activeTab === 'rack' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        )}>
                            <EffectsRack />
                        </div>
                        
                        {/* Visualizer Tab */}
                        <div className={clsx(
                            "absolute inset-0 bg-background p-4 flex flex-col gap-4 transition-opacity duration-300",
                            activeTab === 'visualizer' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        )}>
                            <MasteringVisualizer className="w-full h-full" />
                        </div>
                    </div>

                    {/* Mobile Bottom Bar: Transport + Tabs */}
                    <div className="shrink-0 bg-surface border-t border-slate-700 pb-safe z-50">
                         {/* Mini Transport */}
                         <div className="px-2 py-2 bg-background border-b border-slate-800 flex justify-center">
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

            {/* Global Side Panel */}
            <SidePanel />
        </div>
    </div>
  );
};