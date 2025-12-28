import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

export const TransportDisplay: React.FC = () => {
  // Use granular selectors to only re-render when time or duration changes
  const currentTime = useAudioStore(state => state.currentTime);
  const sourceDuration = useAudioStore(state => state.sourceDuration);
  const seek = useAudioStore(state => state.seek);

  const hasSource = sourceDuration > 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex justify-between items-end px-1">
            <span className="font-mono text-sm font-bold text-slate-200 tracking-wider">
            {formatTime(currentTime)}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
            {formatTime(sourceDuration)}
            </span>
        </div>
        <div className="relative h-6 group flex items-center">
            {/* Custom Range Track */}
            <div className="absolute left-0 right-0 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                className="h-full bg-primary transition-all duration-75"
                style={{ width: `${(currentTime / (sourceDuration || 1)) * 100}%` }}
                />
            </div>
            <input
                type="range"
                aria-label="Seek"
                min={0}
                max={sourceDuration || 100}
                step={0.01}
                value={currentTime}
                onChange={handleSeek}
                disabled={!hasSource}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
            />
        </div>
    </div>
  );
};
