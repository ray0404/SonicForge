import React, { useRef, useEffect } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { MeteringNode } from '@/audio/worklets/MeteringNode';

interface MeteringUnitProps {
  module: RackModule;
  onRemove: () => void;
}

export const MeteringUnit: React.FC<MeteringUnitProps> = ({ module, onRemove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // @ts-ignore
      const node = audioEngine.nodeMap.get(module.id) as MeteringNode | undefined;
      const m = node ? node.momentary : -100;
      const s = node ? node.shortTerm : -100;

      // Clear
      ctx.fillStyle = '#0f172a'; // Slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Range: -60 to 0 LUFS
      const range = 60;
      const minVal = -60;

      const getX = (val: number) => {
        const norm = (Math.max(val, minVal) - minVal) / range;
        return norm * canvas.width;
      };

      // Draw Grid
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      [-48, -36, -24, -14, -6].forEach(val => {
          const x = getX(val);
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
      });
      ctx.stroke();

      // Draw Target Zone (-14 LUFS is standard for streaming)
      const targetX = getX(-14);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(targetX - 2, 0, 4, canvas.height);

      // Draw Short Term Bar (Slow, Background)
      ctx.fillStyle = '#475569'; // Slate-600
      const sx = getX(s);
      ctx.fillRect(0, 10, sx, 30);

      // Draw Momentary Bar (Fast, Foreground)
      ctx.fillStyle = m > -14 ? '#ef4444' : '#22c55e'; // Red if loud, Green otherwise
      const mx = getX(m);
      ctx.fillRect(0, 20, mx, 10);

      // Text
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`M: ${m.toFixed(1)} LUFS`, 10, 60);
      ctx.fillText(`S: ${s.toFixed(1)} LUFS`, 10, 75);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [module]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
         <span className="font-bold text-cyan-400">LUFS Meter</span>
         <button onClick={onRemove} className="text-red-500 text-xs hover:text-red-400">Remove</button>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={300}
        height={80}
        className="w-full bg-slate-900 rounded border border-slate-700"
      />
    </div>
  );
};
