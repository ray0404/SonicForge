import React, { useRef, useEffect } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { LimiterNode } from '@/audio/worklets/LimiterNode';
import { Knob } from '@/components/ui/Knob';
import { ModuleShell } from '@/components/ui/ModuleShell';

interface LimiterUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const LimiterUnit: React.FC<LimiterUnitProps> = ({ module, onRemove, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
    <ModuleShell 
      id={module.id} 
      title="Limiter" 
      bypass={module.bypass} 
      onRemove={onRemove} 
      colorClass="text-red-400"
      className="w-full max-w-sm"
    >
      <div className="flex flex-row gap-4 h-40">
        {/* Meter */}
        <canvas 
            ref={canvasRef} 
            width={100} 
            height={160} 
            className="w-20 h-full bg-slate-900 rounded border border-slate-700 shadow-inner"
        />

        {/* Controls */}
        <div className="flex flex-col gap-2 flex-1 justify-center items-center">
            <div className="grid grid-cols-2 gap-4">
                <Knob 
                    label="Threshold" 
                    value={module.parameters.threshold} 
                    min={-60} max={0} 
                    unit="dB" 
                    onChange={v => onUpdate('threshold', v)} 
                />
                <Knob 
                    label="Ceiling" 
                    value={module.parameters.ceiling} 
                    min={-20} max={0} 
                    unit="dB" 
                    onChange={v => onUpdate('ceiling', v)} 
                />
                <Knob 
                    label="Release" 
                    value={module.parameters.release} 
                    min={0.001} max={1} 
                    unit="s" 
                    onChange={v => onUpdate('release', v)} 
                />
                <Knob 
                    label="Lookahead" 
                    value={module.parameters.lookahead} 
                    min={0} max={20} step={1}
                    unit="ms" 
                    onChange={v => onUpdate('lookahead', v)} 
                />
            </div>
        </div>
      </div>
    </ModuleShell>
  );
};
