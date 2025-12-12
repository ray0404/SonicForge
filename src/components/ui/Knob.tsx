import React from 'react';
import { KnobHeadless } from 'react-knob-headless';
import { clsx } from 'clsx';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  mapTo01?: (value: number) => number;
  mapFrom01?: (value: number) => number;
  className?: string;
}

export const Knob: React.FC<KnobProps> = ({
  value,
  min,
  max,
  step = 0.01,
  label,
  unit = '',
  onChange,
  mapTo01,
  mapFrom01,
  className
}) => {
  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <KnobHeadless
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange as any}
        mapTo01={mapTo01}
        mapFrom01={mapFrom01}
        dragSensitivity={0.005}
        className="relative w-12 h-12 cursor-ns-resize group focus:outline-none"
      >
        {/* @ts-ignore */}
        {({ value01, dragOffset }: { value01: number, dragOffset: number }) => (
          <div className="relative w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#1e293b" // slate-800
                strokeWidth="10"
              />
              {/* Value Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={dragOffset !== 0 ? "#60a5fa" : "#3b82f6"} // lighter on drag
                strokeWidth="10"
                strokeDasharray={`${value01 * 251.2} 251.2`} // 2 * PI * r (40) ~= 251.2
                className="transition-[stroke-dasharray] duration-75 ease-out"
              />
            </svg>
            {/* Knob Tick/Indicator */}
            <div 
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ transform: `rotate(${value01 * 360}deg)` }}
            >
                <div className="w-1 h-2 bg-slate-200 mx-auto mt-1 rounded-full shadow-sm" />
            </div>
          </div>
        )}
      </KnobHeadless>
      
      <div className="flex flex-col items-center select-none">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className="text-xs font-mono text-blue-400">
            {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </div>
      </div>
    </div>
  );
};
