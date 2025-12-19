import React from 'react';
import { useAudioStore, RackModule } from '@/store/useAudioStore';
import { clsx } from 'clsx';

interface SidechainControlProps {
    module: RackModule;
}

export const SidechainControl: React.FC<SidechainControlProps> = ({ module }) => {
    const { rack, updateModuleSidechain } = useAudioStore();
    const sc = module.sidechain || { enabled: false, mode: 'internal', sourceId: '' };

    // Get potential sources (all modules except self)
    const sources = rack.filter(m => m.id !== module.id);

    return (
        <div className="flex flex-col gap-2 p-2 bg-slate-900/50 rounded border border-slate-800 text-[10px]">
            <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Sidechain</span>
                <button
                    onClick={() => updateModuleSidechain(module.id, { enabled: !sc.enabled })}
                    className={clsx(
                        "w-3 h-3 rounded-full transition-all shadow-sm",
                        sc.enabled ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-slate-700"
                    )}
                />
            </div>

            {sc.enabled && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5">
                        <button
                            onClick={() => updateModuleSidechain(module.id, { mode: 'internal' })}
                            className={clsx("flex-1 py-1 rounded text-[9px] font-bold", sc.mode === 'internal' ? "bg-slate-700 text-white" : "text-slate-500")}
                        >
                            INT
                        </button>
                        <button
                            onClick={() => updateModuleSidechain(module.id, { mode: 'external' })}
                            className={clsx("flex-1 py-1 rounded text-[9px] font-bold", sc.mode === 'external' ? "bg-slate-700 text-white" : "text-slate-500")}
                        >
                            EXT
                        </button>
                    </div>

                    {sc.mode === 'external' && (
                        <select
                            value={sc.sourceId || ''}
                            onChange={(e) => updateModuleSidechain(module.id, { sourceId: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded px-1 py-1 text-slate-300 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">Select Source...</option>
                            {sources.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.type.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </div>
    );
};
