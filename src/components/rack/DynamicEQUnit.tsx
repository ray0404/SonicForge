import React, { useRef, useEffect } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { DynamicEQNode } from '@/audio/worklets/DynamicEQNode';
import { Knob } from '@/components/ui/Knob';
import { ModuleShell } from '@/components/ui/ModuleShell';

interface DynamicEQUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const DynamicEQUnit: React.FC<DynamicEQUnitProps> = ({ module, onRemove, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Helper for Log scaling
  // Freq: 20Hz -> 20000Hz
  const mapFreqTo01 = (v: number) => (Math.log(v) - Math.log(20)) / (Math.log(20000) - Math.log(20));
  const mapFreqFrom01 = (v: number) => Math.exp(v * (Math.log(20000) - Math.log(20)) + Math.log(20));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // 1. Get Node Data
      // @ts-ignore - Accessing private map for visualization
      const node = audioEngine.nodeMap.get(module.id) as DynamicEQNode | undefined;
      const gr = node ? node.currentGainReduction : 0;

      // 2. Clear
      ctx.fillStyle = '#0f172a'; // Slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Draw Grid (Log Scale)
      ctx.strokeStyle = '#334155'; // Slate-700
      ctx.lineWidth = 1;
      ctx.beginPath();
      const freqs = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      freqs.forEach(f => {
        const x = getX(f, canvas.width);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      });
      ctx.stroke();

      // 4. Draw 0dB Line
      const y0 = getY(0, canvas.height);
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(canvas.width, y0);
      ctx.stroke();

      // 5. Draw Response Curve
      const params = module.parameters;
      const width = canvas.width;
      
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // Blue-500
      ctx.lineWidth = 2;

      const dynamicGain = params.gain - gr;
      
      for (let i = 0; i < width; i++) {
        const freq = getFreq(i, width);
        const mag = getPeakingMag(freq, params.frequency, params.Q, dynamicGain, 44100);
        const y = getY(mag, canvas.height);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // 6. Draw Static Curve (Ghost) if GR > 0
      if (gr > 0.1) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.lineWidth = 1;
          for (let i = 0; i < width; i++) {
            const freq = getFreq(i, width);
            // @ts-ignore
            const mag = getPeakingMag(freq, params.frequency, params.Q, params.gain, 44100);
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
      id={module.id} 
      title="Dynamic EQ" 
      bypass={module.bypass} 
      onRemove={onRemove} 
      colorClass="text-blue-400"
      className="w-full max-w-2xl"
    >
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={160} 
        className="w-full h-40 bg-slate-900 rounded mb-4 border border-slate-700 shadow-inner"
      />

      <div className="flex justify-between gap-2 px-4">
         <Knob 
            label="Freq" 
            value={module.parameters.frequency} 
            min={20} max={20000} 
            unit="Hz" 
            mapTo01={mapFreqTo01} 
            mapFrom01={mapFreqFrom01} 
            onChange={v => onUpdate('frequency', v)} 
         />
         <Knob 
            label="Gain" 
            value={module.parameters.gain} 
            min={-20} max={20} 
            unit="dB" 
            onChange={v => onUpdate('gain', v)} 
         />
         <Knob 
            label="Q" 
            value={module.parameters.Q} 
            min={0.1} max={10} 
            onChange={v => onUpdate('Q', v)} 
         />
         <div className="w-px bg-slate-700 mx-2" />
         <Knob 
            label="Thresh" 
            value={module.parameters.threshold} 
            min={-60} max={0} 
            unit="dB" 
            onChange={v => onUpdate('threshold', v)} 
         />
         <Knob 
            label="Ratio" 
            value={module.parameters.ratio} 
            min={1} max={20} 
            onChange={v => onUpdate('ratio', v)} 
         />
         <Knob 
            label="Attack" 
            value={module.parameters.attack} 
            min={0.001} max={1} step={0.001}
            unit="s" 
            onChange={v => onUpdate('attack', v)} 
         />
         <Knob 
            label="Release" 
            value={module.parameters.release} 
            min={0.001} max={1} step={0.001}
            unit="s" 
            onChange={v => onUpdate('release', v)} 
         />
      </div>
    </ModuleShell>
  );
};

// --- Math Helpers (Unchanged) ---

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

function getPeakingMag(f: number, f0: number, Q: number, gainDb: number, fs: number): number {
    const w0 = (2 * Math.PI * f0) / fs;
    const w = (2 * Math.PI * f) / fs;
    const A = Math.pow(10, gainDb / 40);
    const alpha = Math.sin(w0) / (2 * Q);
    
    const b0 = 1 + alpha * A;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha / A;

    const cosw = Math.cos(w);
    const cos2w = Math.cos(2*w);
    const sinw = Math.sin(w);
    const sin2w = Math.sin(2*w);

    const numReal = b0 + b1*cosw + b2*cos2w;
    const numImag = -b1*sinw - b2*sin2w;
    const denReal = a0 + a1*cosw + a2*cos2w;
    const denImag = -a1*sinw - a2*sin2w;

    const numMagSq = numReal*numReal + numImag*numImag;
    const denMagSq = denReal*denReal + denImag*denImag;
    
    const mag = Math.sqrt(numMagSq / denMagSq);
    return 20 * Math.log10(mag);
}
