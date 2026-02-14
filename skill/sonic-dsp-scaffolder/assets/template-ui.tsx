// src/components/rack/{{PascalName}}Unit.tsx

import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface Props {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const {{PascalName}}Unit: React.FC<Props> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
  return (
    <ModuleShell
      title="{{HumanName}}"
      isBypassed={module.bypass}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-indigo-500" // Choose color: indigo, yellow, green, red, pink
      dragHandleProps={dragHandleProps}
    >
      <div className="flex gap-4 justify-center">
        {/* Replicate this Knob for every parameter */}
        <Knob
            label="Mix"
            value={module.parameters.mix}
            min={0}
            max={1}
            onChange={(v) => onUpdate('mix', v)}
        />
      </div>
    </ModuleShell>
  );
};
