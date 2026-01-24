import React, { useRef, useState } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { Play, Pause, FileAudio, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TransportDisplay } from './TransportDisplay';
import { useShallow } from 'zustand/react/shallow';

export const Transport: React.FC = () => {
  const { 
    isPlaying, 
    togglePlay, 
    loadSourceFile,
    tracks,
    addTrack,
    activeTrackId
  } = useAudioStore(useShallow(state => ({
    isPlaying: state.isPlaying,
    togglePlay: state.togglePlay,
    loadSourceFile: state.loadSourceFile,
    tracks: state.tracks,
    addTrack: state.addTrack,
    activeTrackId: state.activeTrackId
  })));
  
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
      // Export temporarily disabled during refactor
      alert("Export coming soon to Multi-Track Engine");
  };

  const sourceDuration = Object.values(tracks).reduce((max, track) => Math.max(max, track.sourceDuration), 0);
  const hasSource = sourceDuration > 0;

  const handleFileLoad = (file: File) => {
      let targetTrackId = activeTrackId;
      if (activeTrackId === 'MASTER') {
          // If on master, create a new track for the file
          // We can't get the ID sync easily from addTrack as currently implemented.
          // So we'll add track, but we can't load immediately without the ID.
          // Simplest fix: Just add track. The user can then select it and load (or we auto-load if we update store).
          // For now, let's auto-create "Audio 1" if no tracks exist?
          // Actually, let's just create a track and tell user to drop file there?
          // Or update store to return ID.
          alert("Please add a track first.");
          return;
      }
      loadSourceFile(targetTrackId, file);
  }

  return (
    <div className="w-full flex items-center justify-between gap-4 max-w-2xl mx-auto">
      {/* File Loader Button (Visible if no source) */}
      {!hasSource && (
          <div className="absolute inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <button
                type="button"
                aria-label="Load Audio File"
                onClick={() => {
                    if (Object.keys(tracks).length === 0) {
                        addTrack("Audio 1");
                        // We need to wait for track to exist.
                        // Just showing file picker is tricky if we don't know where to put it.
                        // Let's just create the track and close this overlay?
                        // No, the overlay stays if !hasSource.
                        // We need the file picker.
                        // Let's assume user clicked "Load Audio".
                        // We trigger file input.
                        fileInputRef.current?.click();
                    } else {
                        fileInputRef.current?.click();
                    }
                }}
                className="flex flex-col items-center justify-center gap-4 w-full h-full max-h-48 border-2 border-dashed border-slate-600 rounded-2xl hover:border-blue-500 hover:bg-slate-800/50 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
                 <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform shadow-xl">
                    <FileAudio size={32} className="text-blue-400" />
                 </div>
                 <div className="text-center">
                    <p className="text-sm font-bold text-slate-200">Start Project</p>
                    <p className="text-xs text-slate-500 mt-1">Load audio to a track</p>
                 </div>
                 <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            // If no tracks, add one?
                            // This is async in UI...
                            // Quick hack: if activeTrack is MASTER, warn.
                             handleFileLoad(e.target.files[0]);
                        }
                    }}
                  />
             </button>
          </div>
      )}

      {/* Play/Pause */}
      <button 
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlay}
          disabled={!hasSource}
          className={clsx(
              "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
              isPlaying ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/20' : 'bg-primary hover:bg-blue-400 text-white shadow-blue-500/20',
              !hasSource && 'opacity-50 cursor-not-allowed grayscale'
          )}
      >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
      </button>

      {/* Time & Seeker */}
      <TransportDisplay />

      {/* Export / Menu */}
      <button 
        type="button"
        aria-label="Export WAV"
        className="shrink-0 p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        disabled={!hasSource || isExporting}
        onClick={handleExport}
        title="Export WAV"
      >
          {isExporting ? <Loader2 size={20} className="animate-spin text-blue-400" /> : <Download size={20} />}
      </button>

      <input 
        ref={fileInputRef}
        type="file" 
        accept="audio/*" 
        className="hidden" 
        onChange={(e) => e.target.files && handleFileLoad(e.target.files[0])}
      />
    </div>
  );
};
