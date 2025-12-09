import React, { useRef, useEffect } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { LimiterNode } from '@/audio/worklets/LimiterNode';

interface LimiterUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const LimiterUnit: React.FC<LimiterUnitProps> = ({ module, onRemove, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getMin = (p: string) => {
    if (p === 'threshold') return -60;
    if (p === 'ceiling') return -20;
    if (p === 'release') return 0.001;
    if (p === 'lookahead') return 0;
    return 0;
  };
  const getMax = (p: string) => {
    if (p === 'threshold') return 0;
    if (p === 'ceiling') return 0;
    if (p === 'release') return 1;
    if (p === 'lookahead') return 20;
    return 1;
  };
  const getStep = (p: string) => {
    if (p === 'lookahead') return 1;
    return 0.01;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // 1. Get GR Data
      // @ts-ignore
      const node = audioEngine.nodeMap.get(module.id) as LimiterNode | undefined;
      const gr = node ? node.currentGainReduction : 0; // Positive dB value

      // 2. Clear
      ctx.fillStyle = '#0f172a'; // Slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Draw Meter Background
      const meterWidth = 40;
      const meterX = (canvas.width - meterWidth) / 2;
      ctx.fillStyle = '#1e293b'; // Slate-800
      ctx.fillRect(meterX, 0, meterWidth, canvas.height);

      // 4. Draw GR Bar (Top Down)
      // Range: 0dB (Top) to 20dB (Bottom)
      const maxRange = 12; // Show up to 12dB reduction
      const height = (Math.min(gr, maxRange) / maxRange) * canvas.height;
      
      ctx.fillStyle = '#ef4444'; // Red-500
      ctx.fillRect(meterX, 0, meterWidth, height);

      // 5. Draw Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('-12dB', meterX + meterWidth + 5, canvas.height - 5);
      ctx.fillText('0dB', meterX + meterWidth + 5, 10);
      ctx.fillText(`-${gr.toFixed(1)}`, meterX - 30, Math.max(10, height));

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [module]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
         <span className="font-bold text-red-400">Limiter</span>
         <button onClick={onRemove} className="text-red-500 text-xs hover:text-red-400">Remove</button>
      </div>

      <div className="flex flex-row gap-4 h-40">
        {/* Meter */}
        <canvas 
            ref={canvasRef} 
            width={100} 
            height={160} 
            className="w-20 h-full bg-slate-900 rounded border border-slate-700"
        />

        {/* Controls */}
        <div className="flex flex-col gap-4 flex-1 justify-center">
            {Object.entries(module.parameters).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                        {key} <span className="text-slate-300">{val.toFixed(2)}</span>
                    </label>
                    <input 
                        type="range" 
                        className="h-1 bg-slate-600 rounded appearance-none cursor-pointer accent-red-500"
                        min={getMin(key)}
                        max={getMax(key)}
                        step={getStep(key)}
                        value={val}
                        onChange={(e) => onUpdate(key, parseFloat(e.target.value))}
                    />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
