import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';
import { clsx } from 'clsx';
import { SidechainControl } from './SidechainControl';

interface Props {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const CompressorUnit: React.FC<Props> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
  const modes = ['VCA', 'FET', 'Opto', 'Tube'];

  return (
    <ModuleShell
      title="Compressor"
      isBypassed={module.bypass}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-emerald-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-col gap-3">
        {/* Knobs Row */}
        <div className="flex flex-wrap gap-2 justify-center">
            <Knob
                label="Thresh"
                value={module.parameters.threshold}
                min={-60}
                max={0}
                unit="dB"
                onChange={(v) => onUpdate('threshold', v)}
            />
            <Knob
                label="Ratio"
                value={module.parameters.ratio}
                min={1}
                max={20}
                onChange={(v) => onUpdate('ratio', v)}
            />
            <Knob
                label="Att"
                value={module.parameters.attack}
                min={0.0001}
                max={1}
                unit="s"
                onChange={(v) => onUpdate('attack', v)}
            />
            <Knob
                label="Rel"
                value={module.parameters.release}
                min={0.001}
                max={2}
                unit="s"
                onChange={(v) => onUpdate('release', v)}
            />
            <Knob
                label="Makeup"
                value={module.parameters.makeupGain}
                min={0}
                max={24}
                unit="dB"
                onChange={(v) => onUpdate('makeupGain', v)}
            />
            <Knob
                label="Mix"
                value={module.parameters.mix ?? 1}
                min={0}
                max={1}
                onChange={(v) => onUpdate('mix', v)}
            />
        </div>

        <div className="flex gap-2">
            {/* Mode Selector */}
            <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Topology</span>
                <div className="flex bg-slate-950/50 rounded p-0.5 border border-slate-800">
                    {modes.map((label, idx) => (
                        <button
                            key={label}
                            onClick={() => onUpdate('mode', idx)}
                            className={clsx(
                                "px-2 py-1 text-[9px] font-bold rounded transition-all",
                                module.parameters.mode === idx
                                    ? "bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Sidechain */}
            <div className="w-32">
                <SidechainControl module={module} />
            </div>
        </div>
      </div>
    </ModuleShell>
  );
};