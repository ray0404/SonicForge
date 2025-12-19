import React from 'react';
import { useAudioStore, Track } from '@/store/useAudioStore';
import { clsx } from 'clsx';

interface TrackHeaderProps {
  track: Track;
}

const COLORS = ['bg-primary', 'bg-accent-purple', 'bg-accent-orange'];

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track }) => {
  const { updateTrackParams } = useAudioStore();
  const trackIndex = useAudioStore.getState().tracks.findIndex(t => t.id === track.id);
  const color = COLORS[trackIndex % COLORS.length];

  return (
    <div className="h-track px-3 py-3 border-b border-border-subtle flex flex-col justify-between relative group hover:bg-white/[0.02] transition-colors">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${color}`}></div>
      <div className="flex justify-between items-start">
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-bold text-white truncate font-display">{track.name}</span>
        </div>
        <span className="material-symbols-outlined text-text-muted text-[14px]">mic</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => updateTrackParams(track.id, { mute: !track.mute })}
              className={clsx(
                "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded",
                track.mute ? 'bg-red-500/80 text-white' : 'bg-border-subtle text-text-muted hover:text-white'
              )}
            >
              M
            </button>
            <button
              onClick={() => updateTrackParams(track.id, { solo: !track.solo })}
              className={clsx(
                "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded",
                track.solo ? 'bg-primary text-black' : 'bg-border-subtle text-text-muted hover:text-white'
              )}
            >
              S
            </button>
          </div>
          <span className="text-[9px] font-mono text-primary">{track.volume.toFixed(1)}dB</span>
        </div>
        <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`absolute top-0 left-0 bottom-0 ${color} w-[${track.volume * 100}%]`}></div>
        </div>
      </div>
    </div>
  );
};
