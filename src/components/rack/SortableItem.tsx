import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    id: string;
    children: (dragHandleProps: any) => React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
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

    // Memoize the dragHandleProps object to ensure reference stability
    // unless attributes or listeners actually change.
    const dragHandleProps = useMemo(() => ({
        ...attributes,
        ...listeners
    }), [attributes, listeners]);

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            {children(dragHandleProps)}
        </div>
    );
};
