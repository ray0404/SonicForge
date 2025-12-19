import React from 'react';

interface TimelineRulerProps {
  duration: number; // in seconds
}

const PIXELS_PER_SECOND = 100; // Adjust for zoom level later

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ duration }) => {
  const totalWidth = duration * PIXELS_PER_SECOND;
  const totalBars = Math.ceil(duration / 4); // Assuming 4/4 time at 120BPM for now

  return (
    <div className="w-full h-full flex items-end select-none pointer-events-none" style={{ width: `${totalWidth}px` }}>
        {Array.from({ length: totalBars }).map((_, i) => (
            <div key={i} className="w-[400px] flex text-[9px] font-mono text-text-muted/60">
                 <div className="w-[100px] border-l border-white/10 pl-1 h-3 flex items-start">{i+1}.1</div>
                 <div className="w-[100px] border-l border-white/5 pl-1 h-2"></div>
                 <div className="w-[100px] border-l border-white/5 pl-1 h-2"></div>
                 <div className="w-[100px] border-l border-white/5 pl-1 h-2"></div>
            </div>
        ))}
    </div>
  );
};
