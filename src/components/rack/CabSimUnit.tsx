import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useAudioStore, RackModule } from '@/store/useAudioStore';

interface CabSimUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: any) => void;
}

export const CabSimUnit: React.FC<CabSimUnitProps> = ({ module, onRemove, onUpdate }) => {
  const { loadAsset, assets } = useAudioStore();
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const assetId = module.parameters.irAssetId;
  const audioBuffer = assets[assetId];

  // Draw Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a'; // Slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!audioBuffer) {
        ctx.fillStyle = '#334155';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Drag WAV Here', canvas.width/2, canvas.height/2);
        return;
    }

    // Draw Buffer
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
       let min = 1.0;
       let max = -1.0;
       for (let j = 0; j < step; j++) {
           const datum = data[(i * step) + j];
           if (datum < min) min = datum;
           if (datum > max) max = datum;
       }
       ctx.moveTo(i, (1 + min) * amp);
       ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();

  }, [audioBuffer]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('audio/')) {
            try {
                const id = await loadAsset(file);
                onUpdate('irAssetId', id);
            } catch (err) {
                alert('Failed to load IR');
            }
        }
    }
  }, [loadAsset, onUpdate]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
         <span className="font-bold text-amber-400">Cab Sim / IR</span>
         <button onClick={onRemove} className="text-red-500 text-xs hover:text-red-400">Remove</button>
      </div>

      <div 
        className={`w-full h-20 rounded border-2 border-dashed mb-4 overflow-hidden transition-colors ${isDragging ? 'border-amber-400 bg-slate-700' : 'border-slate-600 bg-slate-900'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
         <canvas ref={canvasRef} width={300} height={80} className="w-full h-full" />
      </div>

      <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
              Mix <span className="text-slate-300">{(module.parameters.mix * 100).toFixed(0)}%</span>
          </label>
          <input 
              type="range" 
              className="h-1 bg-slate-600 rounded appearance-none cursor-pointer accent-amber-500"
              min={0}
              max={1}
              step={0.01}
              value={module.parameters.mix}
              onChange={(e) => onUpdate('mix', parseFloat(e.target.value))}
          />
      </div>
    </div>
  );
};
