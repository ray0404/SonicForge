import React, { useRef, useEffect } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { DynamicEQNode } from '@/audio/worklets/DynamicEQNode';
import { ModuleShell } from '@/components/ui/ModuleShell';
import { Knob } from '@/components/ui/Knob';
import { getPeakingCoefficients, getMagnitudeResponse } from '@/utils/filter-coeffs';

interface DynamicEQUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: number) => void;
  dragHandleProps?: any;
}

export const DynamicEQUnit: React.FC<DynamicEQUnitProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Log Mapping Functions for Frequency
  const minF = 20;
  const maxF = 20000;
  const minLog = Math.log(minF);
  const maxLog = Math.log(maxF);
  const scale = maxLog - minLog;

  const mapTo01Freq = (val: number) => (Math.log(val) - minLog) / scale;
  const mapFrom01Freq = (val: number) => Math.exp(val * scale + minLog);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // @ts-expect-error - nodeMap access is loose
      const node = audioEngine.nodeMap.get(module.id) as DynamicEQNode | undefined;
      const gr = node ? node.currentGainReduction : 0;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const freqs = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      freqs.forEach(f => {
        const x = getX(f, canvas.width);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      });
      ctx.stroke();

      const y0 = getY(0, canvas.height);
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(canvas.width, y0);
      ctx.stroke();

      // Response
      const params = module.parameters;
      const width = canvas.width;
      
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      const dynamicGain = params.gain - gr;
      
      // Calculate coefficients once per frame (optimization)
      const dynamicCoeffs = getPeakingCoefficients(params.frequency, params.Q, dynamicGain, 44100);

      for (let i = 0; i < width; i++) {
        const freq = getFreq(i, width);
        const mag = getMagnitudeResponse(freq, 44100, dynamicCoeffs);
        const y = getY(mag, canvas.height);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      if (gr > 0.1) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.lineWidth = 1;

          // Calculate static coefficients once
          const staticCoeffs = getPeakingCoefficients(params.frequency, params.Q, params.gain, 44100);

          for (let i = 0; i < width; i++) {
            const freq = getFreq(i, width);
            const mag = getMagnitudeResponse(freq, 44100, staticCoeffs);
            const y = getY(mag, canvas.height);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
          ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [module]);

  return (
    <ModuleShell
        title="Dynamic EQ"
        color="text-blue-400"
        onBypass={onBypass}
        onRemove={onRemove}
        isBypassed={module.bypass}
        dragHandleProps={dragHandleProps}
    >
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={120}
        className="w-full h-32 bg-slate-950 rounded mb-3 border border-slate-700"
      />

      <div className="flex flex-wrap justify-center items-end gap-x-4 gap-y-3 px-1">
         <div className="flex gap-2">
            <Knob
                label="Freq" unit="Hz"
                value={module.parameters.frequency} min={20} max={20000}
                mapTo01={mapTo01Freq} mapFrom01={mapFrom01Freq}
                onChange={(v) => onUpdate('frequency', v)}
            />
            <Knob
                label="Q"
                value={module.parameters.Q} min={0.1} max={10}
                onChange={(v) => onUpdate('Q', v)}
            />
            <Knob
                label="Gain" unit="dB"
                value={module.parameters.gain} min={-20} max={20}
                onChange={(v) => onUpdate('gain', v)}
            />
         </div>

         <div className="w-px h-10 bg-slate-700 mx-1"></div>

         <div className="flex gap-2">
            <Knob
                label="Thresh" unit="dB"
                value={module.parameters.threshold} min={-60} max={0}
                onChange={(v) => onUpdate('threshold', v)}
            />
            <Knob
                label="Ratio"
                value={module.parameters.ratio} min={1} max={20}
                onChange={(v) => onUpdate('ratio', v)}
            />
            <Knob
                label="Attack" unit="s"
                value={module.parameters.attack} min={0.001} max={1} step={0.001}
                onChange={(v) => onUpdate('attack', v)}
            />
            <Knob
                label="Release" unit="s"
                value={module.parameters.release} min={0.001} max={1} step={0.001}
                onChange={(v) => onUpdate('release', v)}
            />
         </div>
      </div>
    </ModuleShell>
  );
};

// --- Math Helpers ---
function getX(freq: number, width: number): number {
    const minF = 20;
    const maxF = 20000;
    const minLog = Math.log(minF);
    const maxLog = Math.log(maxF);
    const scale = (maxLog - minLog) / width;
    return (Math.log(freq) - minLog) / scale;
}

function getFreq(x: number, width: number): number {
    const minF = 20;
    const maxF = 20000;
    const minLog = Math.log(minF);
    const maxLog = Math.log(maxF);
    const scale = (maxLog - minLog) / width;
    return Math.exp(minLog + x * scale);
}

function getY(db: number, height: number): number {
    const minDb = -20;
    const maxDb = 20;
    const range = maxDb - minDb;
    const norm = 1 - (db - minDb) / range;
    return norm * height;
}
