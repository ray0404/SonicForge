import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { clsx } from 'clsx';
import { MoveHorizontal, Trash2, Plus } from 'lucide-react';

const TrackStripUI = ({ track, isActive, onSelect, onVolume, onPan, onMute, onRemove }: any) => {
    return (
        <div
            onClick={onSelect}
            className={clsx(
                "w-24 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col p-2 gap-2 relative transition-colors cursor-pointer group select-none",
                isActive ? "bg-slate-800 ring-1 ring-primary ring-inset" : "hover:bg-slate-800/50"
            )}
        >
            <div className="text-xs font-bold truncate text-slate-300 mb-2 text-center" title={track.name}>{track.name}</div>

            {/* Pan Knob */}
            <div className="flex flex-col items-center gap-1">
                 <div className="flex items-center gap-1 text-[10px] text-slate-500">
                     <MoveHorizontal size={10} />
                     <span>{track.pan.toFixed(2)}</span>
                 </div>
                 <input
                    type="range"
                    min="-1" max="1" step="0.01"
                    value={track.pan}
                    onChange={(e) => onPan(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    onClick={(e) => e.stopPropagation()}
                 />
            </div>

            {/* Volume Fader */}
            <div className="flex-1 flex items-center justify-center py-2 relative min-h-[140px]">
                <input
                    type="range"
                    min="0" max="1.5" step="0.01"
                    value={track.volume}
                    onChange={(e) => onVolume(parseFloat(e.target.value))}
                    className="h-32 w-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary -rotate-90 origin-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: '128px' }} // Width becomes height when rotated
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="text-center text-[10px] text-slate-400 font-mono">
                {Math.round(track.volume * 100)}%
            </div>

            {/* Controls */}
            <div className="flex gap-1 justify-center mt-2">
                 <button
                    onClick={(e) => { e.stopPropagation(); onMute(); }}
                    className={clsx(
                        "p-1 rounded text-[10px] font-bold w-6 h-6 flex items-center justify-center border transition-colors",
                        track.isMuted ? "bg-red-500/20 text-red-500 border-red-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    )}
                 >
                    M
                 </button>
                 <button
                     onClick={(e) => { e.stopPropagation(); /* Solo */ }}
                     className={clsx(
                        "p-1 rounded text-[10px] font-bold w-6 h-6 flex items-center justify-center border transition-colors",
                        track.isSoloed ? "bg-yellow-500/20 text-yellow-500 border-yellow-500" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                     )}
                 >
                    S
                 </button>
            </div>

            {/* Remove */}
            {track.id !== 'MASTER' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Track"
                >
                    <Trash2 size={12} />
                </button>
            )}
        </div>
    );
};

export const MixerView = () => {
    const {
        tracks, trackOrder, master, activeTrackId,
        selectTrack, setTrackVolume, setTrackPan, toggleTrackMute, removeTrack, addTrack
    } = useAudioStore();

    const orderedTracks = trackOrder.map(id => tracks[id]).filter(Boolean);

    return (
        <div className="flex h-full w-full overflow-x-auto bg-slate-950 border-t border-slate-800">
            {orderedTracks.map(track => (
                <TrackStripUI
                    key={track.id}
                    track={track}
                    isActive={activeTrackId === track.id}
                    onSelect={() => selectTrack(track.id)}
                    onVolume={(v: number) => setTrackVolume(track.id, v)}
                    onPan={(v: number) => setTrackPan(track.id, v)}
                    onMute={() => toggleTrackMute(track.id)}
                    onRemove={() => removeTrack(track.id)}
                />
            ))}

            {/* Add Track Button */}
            <div className="w-12 shrink-0 flex items-center justify-center border-r border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 transition-colors cursor-pointer" onClick={() => addTrack()}>
                <Plus size={20} className="text-slate-500" />
            </div>

            {/* Master Strip */}
            <div className="w-24 shrink-0 border-l border-slate-700 ml-auto bg-slate-900/50">
                 <TrackStripUI
                    track={master}
                    isActive={activeTrackId === 'MASTER'}
                    onSelect={() => selectTrack('MASTER')}
                    onVolume={(v: number) => setTrackVolume('MASTER', v)}
                    onPan={(v: number) => setTrackPan('MASTER', v)}
                    onMute={() => {}} // Master mute usually different
                    onRemove={() => {}}
                />
            </div>
        </div>
    );
};
