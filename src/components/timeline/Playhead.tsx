import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';

const PIXELS_PER_SECOND = 100; // This should come from a shared zoom state later

export const Playhead: React.FC = () => {
  const { currentTime, sourceDuration } = useAudioStore();
  const leftPosition = currentTime * PIXELS_PER_SECOND;

  if (sourceDuration === 0) return null;

  return (
    <div
        className="absolute top-0 bottom-0 w-[1px] bg-white z-40 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        style={{ left: `${leftPosition}px` }}
    >
        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-white absolute -ml-[4.5px] top-0"></div>
    </div>
  );
};
