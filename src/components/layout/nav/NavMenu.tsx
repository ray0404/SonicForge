import React from 'react';
import { useUIStore, PanelView } from '@/store/useUIStore';
import { Settings, BookOpen, Sliders, AudioWaveform, Library, Download } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS: { id: PanelView; label: string; icon: React.ElementType }[] = [
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
    { id: 'DOCS', label: 'Documentation', icon: BookOpen },
    { id: 'MIXER', label: 'Mixer', icon: Sliders },
    { id: 'TIMELINE', label: 'Timeline', icon: AudioWaveform },
    { id: 'ASSETS', label: 'Assets', icon: Library },
    { id: 'EXPORT', label: 'Export', icon: Download },
];

export const NavMenu: React.FC = () => {
    const { activeView, setActiveView } = useUIStore();

    return (
        <nav className="flex flex-col gap-2 p-2">
            {NAV_ITEMS.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    aria-current={activeView === item.id ? 'page' : undefined}
                    className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                        activeView === item.id
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    )}
                >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};
