import React, { useRef, useState } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { Play, Pause, FileAudio, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TransportDisplay } from './TransportDisplay';
import { useShallow } from 'zustand/react/shallow';

// WAV Encoder Helper
function bufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    let result;
    if (numChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }
    return encodeWAV(result, numChannels, sampleRate, bitDepth);
}

function interleave(inputL: Float32Array, inputR: Float32Array) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

function encodeWAV(samples: Float32Array, numChannels: number, sampleRate: number, bitDepth: number) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);
    return new Blob([view], { type: 'audio/wav' });
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export const Transport: React.FC = () => {
  // Use granular selectors or shallow comparison to prevent unnecessary re-renders
  // when unrelated store state changes.
  // However, since we split the display, this component only needs:
  // isPlaying, togglePlay, sourceDuration (for hasSource check), loadSourceFile, rack, assets
  // It DOES NOT need currentTime.

  const { 
    isPlaying, 
    togglePlay, 
    sourceDuration, 
    loadSourceFile,
    rack,
    assets
  } = useAudioStore(useShallow(state => ({
    isPlaying: state.isPlaying,
    togglePlay: state.togglePlay,
    sourceDuration: state.sourceDuration,
    loadSourceFile: state.loadSourceFile,
    rack: state.rack,
    assets: state.assets
  })));
  
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
      if (isExporting) return;
      setIsExporting(true);
      try {
          const renderedBuffer = await audioEngine.renderOffline(rack, assets);
          if (renderedBuffer) {
              const wavBlob = bufferToWav(renderedBuffer);
              const url = URL.createObjectURL(wavBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sonic-forge-master-${Date.now()}.wav`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          }
      } catch (err) {
          alert("Export Failed: " + err);
      } finally {
          setIsExporting(false);
      }
  };

  const hasSource = sourceDuration > 0;

  return (
    <div className="w-full flex items-center justify-between gap-4 max-w-2xl mx-auto">
      {/* File Loader Button (Visible if no source, or distinct button) */}
      {!hasSource && (
          <div className="absolute inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <button
                type="button"
                aria-label="Load Audio File"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 w-full h-full max-h-48 border-2 border-dashed border-slate-600 rounded-2xl hover:border-blue-500 hover:bg-slate-800/50 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
                 <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform shadow-xl">
                    <FileAudio size={32} className="text-blue-400" />
                 </div>
                 <div className="text-center">
                    <p className="text-sm font-bold text-slate-200">Load Audio File</p>
                    <p className="text-xs text-slate-500 mt-1">Click to browse or drag & drop</p>
                 </div>
                 <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && loadSourceFile(e.target.files[0])}
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

      {/* Time & Seeker - Moved to subcomponent to isolate re-renders */}
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

      {/* Hidden File Input for "Load New" Action if we add a button later */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="audio/*" 
        className="hidden" 
        onChange={(e) => e.target.files && loadSourceFile(e.target.files[0])}
      />
    </div>
  );
};
