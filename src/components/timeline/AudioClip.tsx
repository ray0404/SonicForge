import React from 'react';
import { useAudioStore, Track } from '@/store/useAudioStore';
import { clsx } from 'clsx';

interface AudioClipProps {
  track: Track;
}

const COLORS = {
    base: ['bg-primary/10', 'bg-accent-purple/10', 'bg-accent-orange/10'],
    border: ['border-primary/30', 'border-accent-purple/30', 'border-accent-orange/30'],
    gradient: ['from-primary/5 to-primary/20', 'from-accent-purple/5 to-accent-purple/20', 'from-accent-orange/5 to-accent-orange/20'],
    waveform: ['from-primary to-primary-dim', 'from-[#c4b5fd] to-accent-purple', 'from-[#fdba74] to-accent-orange'],
};

export const AudioClip: React.FC<AudioClipProps> = ({ track }) => {
    const { assets } = useAudioStore();
    const trackIndex = useAudioStore.getState().tracks.findIndex(t => t.id === track.id);
    const colorTheme = {
        base: COLORS.base[trackIndex % COLORS.base.length],
        border: COLORS.border[trackIndex % COLORS.border.length],
        gradient: COLORS.gradient[trackIndex % COLORS.gradient.length],
        waveform: COLORS.waveform[trackIndex % COLORS.waveform.length],
    };

    const audioBuffer = assets[track.audioAssetId];
    if (!audioBuffer) return null;

    // For now, clip is always at start.
    // Future: Use clip start/end times.
    const clipWidth = `${(audioBuffer.duration / useAudioStore.getState().sourceDuration) * 100}%`;

  return (
    <div className={clsx(
        "absolute top-1 bottom-1 left-[0px] rounded-md border overflow-hidden group",
        colorTheme.base,
        colorTheme.border,
        { 'opacity-50 grayscale': track.mute }
    )} style={{ width: clipWidth }}>
        <div className={clsx("absolute inset-0 bg-gradient-to-b", colorTheme.gradient)}></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-80">
            <div className={clsx("w-full h-[70%] waveform-bar-mask bg-gradient-to-b", colorTheme.waveform)}></div>
        </div>
        <div className="absolute top-1 left-2 flex items-center gap-1 z-10">
            <span className="text-[9px] font-bold text-white tracking-wide mix-blend-plus-lighter">{track.name}</span>
        </div>
    </div>
  );
};
