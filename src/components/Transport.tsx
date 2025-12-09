import React, { useRef, useCallback, useState } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { Play, Pause, FileAudio, Download, Loader2 } from 'lucide-react';

// WAV Encoder Helper
function bufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    // const format = 1; // PCM (removed unused)
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

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
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
  const { 
    isPlaying, 
    togglePlay, 
    currentTime, 
    sourceDuration, 
    seek, 
    loadSourceFile,
    rack,
    assets
  } = useAudioStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await loadSourceFile(e.dataTransfer.files[0]);
    }
  }, [loadSourceFile]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      seek(parseFloat(e.target.value));
  };

  const handleExport = async () => {
      if (isExporting) return;
      setIsExporting(true);
      try {
          const renderedBuffer = await audioEngine.renderOffline(rack, assets);
          if (renderedBuffer) {
              const wavBlob = bufferToWav(renderedBuffer);
              // Trigger download
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
    <div 
        className={`w-full bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between transition-colors ${isDragging ? 'bg-slate-800 border-blue-500' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
    >
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-4 w-1/3">
        <button 
            onClick={togglePlay}
            disabled={!hasSource}
            className={`p-3 rounded-full transition-colors ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-green-600 hover:bg-green-500 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        
        <div className="flex flex-col gap-1 w-full max-w-xs">
            <span className="font-mono text-xl text-blue-400 tracking-wider">
                {formatTime(currentTime)} <span className="text-slate-600 text-sm">/ {formatTime(sourceDuration)}</span>
            </span>
            <input 
                type="range"
                min={0}
                max={sourceDuration || 100}
                step={0.01}
                value={currentTime}
                onChange={handleSeek}
                disabled={!hasSource}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>
      </div>

      {/* Center: File Info / Drop Zone */}
      <div className="flex-1 flex justify-center">
          {!hasSource ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 cursor-pointer text-slate-500 hover:text-blue-400 transition-colors border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg px-8 py-2"
              >
                  <FileAudio size={24} />
                  <span className="text-xs font-bold uppercase">Drag Mix Here or Click</span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="audio/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && loadSourceFile(e.target.files[0])}
                  />
              </div>
          ) : (
              <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Source Loaded</span>
                  <span className="text-sm text-slate-300">Ready for Mastering</span>
              </div>
          )}
      </div>

      {/* Right: Tools / Export */}
      <div className="flex items-center gap-4 w-1/3 justify-end">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm font-bold transition-colors disabled:opacity-50"
            disabled={!hasSource || isExporting}
            onClick={handleExport}
          >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? 'Exporting...' : 'Export WAV'}
          </button>
      </div>
    </div>
  );
};
