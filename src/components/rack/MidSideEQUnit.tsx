import React from 'react';
import { RackModule } from '@/store/useAudioStore';

interface MidSideEQUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const MidSideEQUnit: React.FC<MidSideEQUnitProps> = ({ module, onRemove, onUpdate }) => {
  const getMin = (p: string) => {
    if (p.includes('Freq')) return 20;
    if (p.includes('Gain')) return -15;
    return 0;
  };
  const getMax = (p: string) => {
    if (p.includes('Freq')) return 20000;
    if (p.includes('Gain')) return 15;
    return 1;
  };
  const getStep = (p: string) => {
    if (p.includes('Freq')) return 1;
    return 0.1;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 w-full max-w-lg">
      <div className="flex justify-between items-center mb-4">
         <span className="font-bold text-green-400">Mid/Side EQ</span>
         <button onClick={onRemove} className="text-red-500 text-xs hover:text-red-400">Remove</button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Mid Channel */}
        <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Mid (L+R)</h4>
            <div className="flex flex-col gap-4">
                {['midFreq', 'midGain'].map(key => (
                     <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                            {key.replace('mid', '')} <span className="text-slate-300">{module.parameters[key]}</span>
                        </label>
                        <input 
                            type="range" 
                            className="h-1 bg-slate-600 rounded appearance-none cursor-pointer accent-green-500"
                            min={getMin(key)}
                            max={getMax(key)}
                            step={getStep(key)}
                            value={module.parameters[key]}
                            onChange={(e) => onUpdate(key, parseFloat(e.target.value))}
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* Side Channel */}
        <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Side (L-R)</h4>
            <div className="flex flex-col gap-4">
                {['sideFreq', 'sideGain'].map(key => (
                     <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                            {key.replace('side', '')} <span className="text-slate-300">{module.parameters[key]}</span>
                        </label>
                        <input 
                            type="range" 
                            className="h-1 bg-slate-600 rounded appearance-none cursor-pointer accent-yellow-500"
                            min={getMin(key)}
                            max={getMax(key)}
                            step={getStep(key)}
                            value={module.parameters[key]}
                            onChange={(e) => onUpdate(key, parseFloat(e.target.value))}
                        />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
