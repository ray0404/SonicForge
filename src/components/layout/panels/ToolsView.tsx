import React, { useState } from 'react';
import { Wand2, RotateCcw, Zap, Sliders, Scissors, Eraser } from 'lucide-react';
import { useAudioStore } from '@/store/useAudioStore';
import { offlineProcessor, ProcessType } from '@/audio/workers/OfflineProcessorClient';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';
import { clsx } from 'clsx';

export const ToolsView: React.FC = () => {
  const { pushHistory, undo, history, updateSourceBuffer } = useAudioStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async (type: ProcessType | 'DENOISE', params?: any) => {
    const sourceBuffer = audioEngine.sourceBuffer;
    const context = audioEngine.context;

    if (!sourceBuffer || !context) {
      logger.warn('No audio loaded to process');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 1. Save state for undo
      pushHistory();

      // 2. Prepare data for worker (Clone to avoid issues with main thread)
      const left = new Float32Array(sourceBuffer.getChannelData(0));
      const right = sourceBuffer.numberOfChannels > 1 
        ? new Float32Array(sourceBuffer.getChannelData(1))
        : new Float32Array(left.length);

      // 3. Send to worker
      const result = await offlineProcessor.process(
        type as ProcessType, 
        left, 
        right, 
        sourceBuffer.sampleRate,
        params
      );

      // 4. Create new AudioBuffer from result
      const newBuffer = context.createBuffer(
        2,
        result.leftChannel.length,
        sourceBuffer.sampleRate
      );
      newBuffer.copyToChannel(result.leftChannel, 0);
      newBuffer.copyToChannel(result.rightChannel, 1);

      // 5. Update the store/engine
      updateSourceBuffer(newBuffer as any);
      logger.info(`${type} complete.`);

    } catch (error) {
      logger.error(`Processing ${type} failed`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Wand2 className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-bold tracking-tight uppercase">Smart Processing</h2>
      </div>

      <div className="space-y-4">
        {/* Normalization */}
        <button
          onClick={() => handleProcess('NORMALIZE', { target: -0.1 })}
          disabled={isProcessing}
          className={clsx(
            "w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 transition-all",
            "hover:bg-slate-800 hover:border-cyan-500/50 group",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <div className="text-left">
              <div className="font-semibold text-sm">Auto-Normalize</div>
              <div className="text-xs text-slate-400">Maximize peaks to -0.1 dB</div>
            </div>
          </div>
        </button>

        {/* Smart Denoise */}
        <button
          onClick={() => handleProcess('DENOISE')}
          disabled={isProcessing}
          className={clsx(
            "w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 transition-all",
            "hover:bg-slate-800 hover:border-cyan-500/50 group",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <Eraser className="w-5 h-5 text-pink-400" />
            <div className="text-left">
              <div className="font-semibold text-sm">Quick Clean</div>
              <div className="text-xs text-slate-400">Remove Rumble & Hiss</div>
            </div>
          </div>
        </button>

        {/* Strip Silence */}
        <button
          onClick={() => handleProcess('STRIP_SILENCE', { threshold: -60, minDuration: 0.2 })}
          disabled={isProcessing}
          className={clsx(
            "w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 transition-all",
            "hover:bg-slate-800 hover:border-cyan-500/50 group",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-red-400" />
            <div className="text-left">
              <div className="font-semibold text-sm">Strip Silence</div>
              <div className="text-xs text-slate-400">Gate audio below -60dB</div>
            </div>
          </div>
        </button>

        {/* DC Offset */}
        <button
          onClick={() => handleProcess('DC_OFFSET')}
          disabled={isProcessing}
          className={clsx(
            "w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 transition-all",
            "hover:bg-slate-800 hover:border-cyan-500/50 group",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <div className="font-semibold text-sm">Fix DC Offset</div>
              <div className="text-xs text-slate-400">Center waveform at 0.0 amplitude</div>
            </div>
          </div>
        </button>

        <div className="pt-4 border-t border-slate-800">
           <button
            onClick={undo}
            disabled={isProcessing || history.length === 0}
            className={clsx(
                "w-full flex items-center justify-center gap-2 p-2 rounded bg-slate-800 text-sm font-medium transition-all",
                "hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:grayscale"
            )}
           >
             <RotateCcw className="w-4 h-4" />
             Undo Last Edit ({history.length})
           </button>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-auto p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg animate-pulse">
           <div className="text-xs font-bold text-cyan-400 uppercase text-center">Processing Audio...</div>
        </div>
      )}
    </div>
  );
};
