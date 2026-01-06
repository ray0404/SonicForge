import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { useShallow } from 'zustand/react/shallow';
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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { SortableItem } from './SortableItem';
import { RackModuleContainer } from './RackModuleContainer';

export const EffectsRack: React.FC = () => {
  const { rack, removeModule, updateModuleParam, toggleModuleBypass, reorderRack } = useAudioStore(
    useShallow((state) => ({
      rack: state.rack,
      removeModule: state.removeModule,
      updateModuleParam: state.updateModuleParam,
      toggleModuleBypass: state.toggleModuleBypass,
      reorderRack: state.reorderRack
    }))
  );

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
        <div className="w-full flex flex-col gap-4 pb-32">
             {rack.length === 0 ? (
                 <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl py-20 text-slate-600 bg-slate-900/20">
                     <p className="font-bold">Rack is empty</p>
                     <p className="text-xs mt-2">Use the "Add Module" button to add effects.</p>
                 </div>
             ) : (
                 <SortableContext
                    items={rack.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                 >
                    {rack.map((module) => (
                        <SortableItem key={module.id} id={module.id}>
                            {(dragHandleProps) => (
                                <RackModuleContainer
                                    module={module}
                                    removeModule={removeModule}
                                    toggleModuleBypass={toggleModuleBypass}
                                    updateModuleParam={updateModuleParam}
                                    dragHandleProps={dragHandleProps}
                                />
                            )}
                        </SortableItem>
                    ))}
                 </SortableContext>
             )}
        </div>
    </DndContext>
  );
};
