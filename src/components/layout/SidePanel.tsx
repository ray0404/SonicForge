import React from 'react';
import { useUIStore } from '@/store/useUIStore';
import { twMerge } from 'tailwind-merge';

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
            
            <div className="flex-1 p-4 overflow-y-auto">
                {/* Content placeholder */}
                <p className="text-slate-400">Content for {activeView} goes here.</p>
            </div>
        </div>
    );
};
