import React, { useRef, useEffect } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { logger } from '@/utils/logger';

export const EffectsRack: React.FC = () => {
  const { dspGain, setDspGain, isInitialized } = useAudioStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Visualizer Loop (Bypasses React Render Cycle)
  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return;

    let animationId: number;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!audioEngine.analyser) {
          animationId = requestAnimationFrame(render);
          return;
      }

      const bufferLength = audioEngine.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioEngine.analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#1e293b'; // Slate-800 background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6'; // Blue-500
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();
    logger.info("Visualizer started.");

    return () => cancelAnimationFrame(animationId);
  }, [isInitialized]);

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4">
      <div className="bg-surface rounded-lg p-4 shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-slate-100">Effects Rack: SonicGain</h2>

        {/* DSP Parameter Control */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-sm font-medium text-slate-400">DSP Input Gain (Worklet)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={dspGain}
            onChange={(e) => setDspGain(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-slate-500">
             <span>0.0</span>
             <span>{dspGain.toFixed(2)}</span>
             <span>1.0</span>
          </div>
        </div>

        {/* Visualizer Canvas */}
        <div className="border border-slate-700 rounded-md overflow-hidden bg-black relative h-48">
            <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="w-full h-full"
            />
        </div>
      </div>
    </div>
  );
};
