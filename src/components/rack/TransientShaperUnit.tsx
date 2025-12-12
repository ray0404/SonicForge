import React from 'react';
import { RackModule } from '@/store/useAudioStore';
import { Knob } from '@/components/ui/Knob';
import { ModuleShell } from '@/components/ui/ModuleShell';

interface TransientShaperUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const TransientShaperUnit: React.FC<TransientShaperUnitProps> = ({ module, onRemove, onUpdate }) => {
  return (
    <ModuleShell 
      id={module.id} 
      title="Transient Shaper" 
      bypass={module.bypass} 
      onRemove={onRemove} 
      colorClass="text-purple-400"
      className="w-full max-w-sm"
    >
      <div className="grid grid-cols-2 gap-4">
         <Knob 
            label="Attack" 
            value={module.parameters.attackGain} 
            min={-24} max={24} 
            unit="dB" 
            onChange={v => onUpdate('attackGain', v)} 
         />
         <Knob 
            label="Sustain" 
            value={module.parameters.sustainGain} 
            min={-24} max={24} 
            unit="dB" 
            onChange={v => onUpdate('sustainGain', v)} 
         />
      </div>
    </ModuleShell>
  );
};
