import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Power, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModuleShellProps {
  id: string;
  title: string;
  bypass: boolean;
  onBypassToggle?: () => void;
  onRemove: () => void;
  children: React.ReactNode;
  className?: string;
  colorClass?: string; // e.g. "text-blue-400"
}

export const ModuleShell: React.FC<ModuleShellProps> = ({
  id,
  title,
  bypass,
  onBypassToggle,
  onRemove,
  children,
  className,
  colorClass = "text-slate-300"
}) => {
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
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
        ref={setNodeRef}
        style={style}
        className={clsx(
            "bg-slate-800 rounded-lg shadow-lg border border-slate-700 relative group flex flex-col transition-colors",
            bypass && "opacity-60 grayscale",
            className
        )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/30 rounded-t-lg">
        <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <button 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 focus:outline-none"
            >
                <GripVertical size={16} />
            </button>
            <span className={clsx("font-bold text-sm tracking-wider uppercase", colorClass)}>{title}</span>
        </div>

        <div className="flex items-center gap-2">
            {onBypassToggle && (
                <button 
                    onClick={onBypassToggle}
                    className={clsx(
                        "p-1 rounded transition-colors",
                        bypass ? "text-yellow-500 hover:text-yellow-400" : "text-slate-600 hover:text-slate-400"
                    )}
                    title="Bypass"
                >
                    <Power size={14} />
                </button>
            )}
            <button 
                onClick={onRemove} 
                className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                title="Remove"
            >
                <X size={14} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
