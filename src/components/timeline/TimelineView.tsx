import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { TrackHeader } from './TrackHeader';
import { AudioClip } from './AudioClip';
import { TimelineRuler } from './TimelineRuler';
import { Playhead } from './Playhead';

export const TimelineView: React.FC = () => {
  const { tracks, sourceDuration } = useAudioStore();

  return (
    <div className="flex h-full w-full bg-app-bg text-text-main font-body overflow-hidden">
      <aside className="w-[160px] bg-[#0c0c0e] border-r border-border-subtle flex flex-col shrink-0 z-20 shadow-xl overflow-y-auto no-scrollbar">
        {tracks.map(track => (
          <TrackHeader key={track.id} track={track} />
        ))}
        <div className="h-16 flex items-center justify-center mt-2">
            <button
              className="flex items-center gap-2 text-text-muted hover:text-white transition-colors group"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        useAudioStore.getState().addTrack(file);
                    }
                };
                input.click();
              }}
            >
                <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-[10px] font-medium">Add Track</span>
            </button>
        </div>
      </aside>
      <div className="flex-1 overflow-auto no-scrollbar relative timeline-grid">
        <Playhead />
        <div className="h-8 sticky top-0 bg-header-bg/95 backdrop-blur border-b border-border-subtle w-full min-w-[2000px] z-30">
            <TimelineRuler duration={sourceDuration} />
        </div>
        <div className="w-full min-w-[2000px]">
          {tracks.map(track => (
            <div key={track.id} className="h-track border-b border-border-subtle relative">
              <AudioClip track={track} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
