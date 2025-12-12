import React, { useState } from 'react';
import { useAudioStore, RackModule, RackModuleType } from '@/store/useAudioStore';
import { DynamicEQUnit } from './DynamicEQUnit';
import { LimiterUnit } from './LimiterUnit';
import { MidSideEQUnit } from './MidSideEQUnit';
import { CabSimUnit } from './CabSimUnit';
import { MeteringUnit } from './MeteringUnit';
import { TransientShaperUnit } from './TransientShaperUnit';
import { Knob } from '@/components/ui/Knob';
import { ModuleShell } from '@/components/ui/ModuleShell';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, ChevronDown } from 'lucide-react';

export const EffectsRack: React.FC = () => {
  const { rack, addModule, removeModule, updateModuleParam, reorderRack } = useAudioStore();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        const oldIndex = rack.findIndex((item) => item.id === active.id);
        const newIndex = rack.findIndex((item) => item.id === over?.id);
        reorderRack(oldIndex, newIndex);
    }
  };

  const categories: Record<string, RackModuleType[]> = {
      Dynamics: ['LIMITER', 'TRANSIENT_SHAPER'],
      EQ: ['DYNAMIC_EQ', 'MIDSIDE_EQ'],
      Spatial: ['CAB_SIM'],
      Utility: ['LOUDNESS_METER']
  };

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 ml-2">Rack</h2>
          <div className="flex gap-2 relative">
            <button 
                onClick={async () => { await useAudioStore.getState().savePreset(); alert('Saved!'); }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors text-white"
            >
                Save
            </button>
            
            {/* Add Module Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors text-white"
                >
                    <Plus size={14} /> Add Module <ChevronDown size={14} />
                </button>
                
                {isAddMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsAddMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                            {Object.entries(categories).map(([cat, types]) => (
                                <div key={cat} className="border-b border-slate-700 last:border-0">
                                    <div className="px-3 py-1.5 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat}</div>
                                    {types.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { addModule(type); setIsAddMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
          </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rack.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 items-center flex-1 pb-20">
                {rack.map((module) => (
                    module.type === 'DYNAMIC_EQ' ? (
                        <DynamicEQUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                            onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                        />
                    ) : module.type === 'LIMITER' ? (
                        <LimiterUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                            onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                        />
                    ) : module.type === 'MIDSIDE_EQ' ? (
                        <MidSideEQUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                            onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                        />
                    ) : module.type === 'TRANSIENT_SHAPER' ? (
                        <TransientShaperUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                            onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                        />
                    ) : module.type === 'CAB_SIM' ? (
                        <CabSimUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                            onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                        />
                    ) : module.type === 'LOUDNESS_METER' ? (
                        <MeteringUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                        />
                    ) : (
                        <ModuleUnit 
                            key={module.id} 
                            module={module} 
                            onRemove={() => removeModule(module.id)}
                            onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                        />
                    )
                ))}
                {rack.length === 0 && (
                    <div className="text-slate-500 text-center p-12 border-2 border-dashed border-slate-700/50 rounded-xl w-full max-w-lg mt-8">
                        <p className="mb-2">Rack is empty</p>
                        <button 
                            onClick={() => setIsAddMenuOpen(true)}
                            className="text-blue-400 hover:text-blue-300 font-bold"
                        >
                            + Add a Module
                        </button>
                    </div>
                )}
            </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};


// Sub-component for individual modules
const ModuleUnit = ({ module, onRemove, onUpdate }: { 
    module: RackModule, 
    onRemove: () => void,
    onUpdate: (p: string, v: number) => void 
}) => {
    return (
        <ModuleShell 
            id={module.id} 
            title={module.type} 
            bypass={module.bypass} 
            onRemove={onRemove}
            className="w-full max-w-sm"
        >
            <div className="grid grid-cols-4 gap-4">
                {Object.entries(module.parameters).map(([key, val]) => (
                    <Knob 
                        key={key}
                        label={key} 
                        value={val as number} 
                        min={getMin(key)} 
                        max={getMax(key)} 
                        step={getStep(key)}
                        onChange={v => onUpdate(key, v)} 
                    />
                ))}
            </div>
        </ModuleShell>
    );
};

// Helper for parameter ranges
function getMin(param: string) {
    if (param === 'frequency') return 20;
    if (param === 'gain') return -20;
    if (param === 'threshold') return -60;
    if (param === 'attack' || param === 'release') return 0.001;
    if (param === 'attackGain' || param === 'sustainGain') return -24;
    return 0;
}
function getMax(param: string) {
    if (param === 'frequency') return 20000;
    if (param === 'gain') return 20;
    if (param === 'threshold') return 0;
    if (param === 'attack' || param === 'release') return 1;
    if (param === 'ratio') return 20;
    if (param === 'Q') return 10;
    if (param === 'attackGain' || param === 'sustainGain') return 24;
    return 1;
}
function getStep(param: string) {
    if (param === 'frequency') return 1;
    if (param === 'ratio' || param === 'Q') return 0.1;
    if (param === 'attackGain' || param === 'sustainGain') return 0.1;
    return 0.01;
}