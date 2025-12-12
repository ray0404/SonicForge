import React from 'react';
import { RackModule } from '@/store/useAudioStore';
import { Knob } from '@/components/ui/Knob';
import { ModuleShell } from '@/components/ui/ModuleShell';

interface MidSideEQUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const MidSideEQUnit: React.FC<MidSideEQUnitProps> = ({ module, onRemove, onUpdate }) => {
  return (
    <ModuleShell 
      id={module.id} 
      title="Mid/Side EQ" 
      bypass={module.bypass} 
      onRemove={onRemove} 
      colorClass="text-green-400"
      className="w-full max-w-lg"
    >
      <div className="grid grid-cols-2 gap-8">
        {/* Mid Channel */}
        <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wide text-center">Mid (L+R)</h4>
            <div className="flex justify-center gap-4">
                <Knob 
                    label="Freq" 
                    value={module.parameters.midFreq} 
                    min={20} max={20000} 
                    unit="Hz" 
                    onChange={v => onUpdate('midFreq', v)} 
                />
                <Knob 
                    label="Gain" 
                    value={module.parameters.midGain} 
                    min={-15} max={15} 
                    unit="dB" 
                    onChange={v => onUpdate('midGain', v)} 
                />
            </div>
        </div>

        {/* Side Channel */}
        <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wide text-center">Side (L-R)</h4>
            <div className="flex justify-center gap-4">
                <Knob 
                    label="Freq" 
                    value={module.parameters.sideFreq} 
                    min={20} max={20000} 
                    unit="Hz" 
                    onChange={v => onUpdate('sideFreq', v)} 
                />
                <Knob 
                    label="Gain" 
                    value={module.parameters.sideGain} 
                    min={-15} max={15} 
                    unit="dB" 
                    onChange={v => onUpdate('sideGain', v)} 
                />
            </div>
        </div>
      </div>
    </ModuleShell>
  );
};
