import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { DynamicEQUnit } from './DynamicEQUnit';
import { LimiterUnit } from './LimiterUnit';
import { MidSideEQUnit } from './MidSideEQUnit';
import { CabSimUnit } from './CabSimUnit';
import { MeteringUnit } from './MeteringUnit';
import { TransientShaperUnit } from './TransientShaperUnit';

// Sortable Item Wrapper
function SortableItem({ id, children }: { id: string, children: (dragHandleProps: any) => React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full touch-none">
            {children({ ...attributes, ...listeners })}
        </div>
    );
}

export const EffectsRack: React.FC = () => {
  const { rack, removeModule, updateModuleParam, toggleModuleBypass, reorderRack } = useAudioStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
        const oldIndex = rack.findIndex((item) => item.id === active.id);
        const newIndex = rack.findIndex((item) => item.id === over?.id);
        reorderRack(oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
        <div className="w-full flex flex-col gap-4 pb-20">
             {rack.length === 0 ? (
                 <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl py-20 text-slate-600 bg-slate-900/20">
                     <p className="font-bold">Rack is empty</p>
                     <p className="text-xs mt-2">Use the "Add Module" button in the top bar to begin.</p>
                 </div>
             ) : (
                 <SortableContext
                    items={rack.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                 >
                    {rack.map((module) => (
                        <SortableItem key={module.id} id={module.id}>
                            {(dragHandleProps) => {
                                const commonProps = {
                                    module,
                                    onRemove: () => removeModule(module.id),
                                    onBypass: () => toggleModuleBypass(module.id),
                                    dragHandleProps
                                };
                                const onUpdate = (p: string, v: any) => updateModuleParam(module.id, p, v);

                                switch (module.type) {
                                    case 'DYNAMIC_EQ':
                                        return <DynamicEQUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'LIMITER':
                                        return <LimiterUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'MIDSIDE_EQ':
                                        return <MidSideEQUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'CAB_SIM':
                                        return <CabSimUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'TRANSIENT_SHAPER':
                                        return <TransientShaperUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'LOUDNESS_METER':
                                        return <MeteringUnit {...commonProps} />;
                                    default:
                                        return <div className="p-4 bg-red-900/50 text-red-200 rounded">Unknown Module: {module.type}</div>;
                                }
                            }}
                        </SortableItem>
                    ))}
                 </SortableContext>
             )}
        </div>
    </DndContext>
  );
};
