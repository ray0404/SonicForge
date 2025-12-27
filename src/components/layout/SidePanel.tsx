import React from 'react';
import { useUIStore } from '@/store/useUIStore';
import { twMerge } from 'tailwind-merge';
import { NavMenu } from './nav/NavMenu';
import { SettingsView } from './panels/SettingsView';
import { AssetManagerView } from './panels/AssetManagerView';
import { ExportView } from './panels/ExportView';

export const SidePanel: React.FC = () => {
    const { isPanelOpen, activeView } = useUIStore();

    if (!isPanelOpen) return null;

    // Title mapping based on view
    const titles: Record<string, string> = {
        'SETTINGS': 'Global Settings',
        'DOCS': 'Documentation',
        'MIXER': 'Mixer',
        'TIMELINE': 'Timeline',
        'ASSETS': 'Asset Manager',
        'EXPORT': 'Export'
    };

    const renderContent = () => {
        switch (activeView) {
            case 'SETTINGS': return <SettingsView />;
            case 'ASSETS': return <AssetManagerView />;
            case 'EXPORT': return <ExportView />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <p>This view is under construction.</p>
                    </div>
                );
        }
    };

    return (
        <div 
            role="dialog" 
            aria-label="Side Panel" 
            aria-modal="true"
            className={twMerge(
                "fixed inset-y-0 right-0 w-full md:w-[400px] z-50",
                "bg-slate-900/80 backdrop-blur-md border-l border-slate-700",
                "shadow-2xl flex flex-col transition-transform duration-300",
                "text-slate-100"
            )}
        >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-xl font-bold">{titles[activeView] || 'Panel'}</h2>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-700 bg-slate-900/30">
                    <NavMenu />
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
