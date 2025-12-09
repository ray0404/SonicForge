import React, { useRef, useEffect } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { DynamicEQNode } from '@/audio/worklets/DynamicEQNode';

interface DynamicEQUnitProps {
  module: RackModule;
  onRemove: () => void;
  onUpdate: (param: string, value: number) => void;
}

export const DynamicEQUnit: React.FC<DynamicEQUnitProps> = ({ module, onRemove, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Helper to get ranges (reused from EffectsRack but scoped here)
  const getMin = (p: string) => {
    if (p === 'frequency') return 20;
    if (p === 'gain') return -20;
    if (p === 'threshold') return -60;
    if (p === 'attack' || p === 'release') return 0.001;
    return 0;
  };
  const getMax = (p: string) => {
    if (p === 'frequency') return 20000;
    if (p === 'gain') return 20;
    if (p === 'threshold') return 0;
    if (p === 'attack' || p === 'release') return 1;
    if (p === 'ratio') return 20;
    if (p === 'Q') return 10;
    return 1;
  };
  const getStep = (p: string) => {
      if (p === 'frequency') return 1;
      if (p === 'ratio' || p === 'Q') return 0.1;
      return 0.01;
  };

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
      // We calculate the response for the Peaking Filter
      const params = module.parameters;
      const width = canvas.width;
      
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // Blue-500
      ctx.lineWidth = 2;

      // Dynamic curve (with GR applied)
      // Since GR reduces the gain, the effective gain is params.gain - gr
      // But wait, the GR is positive (dB reduction). 
      // If gain is 0, and GR is 5, effective gain is -5?
      // Check processor logic: const dynamicGain = staticGain - gainReduction;
      // Yes.
      const dynamicGain = params.gain - gr;
      
      for (let i = 0; i < width; i++) {
        // Map pixel x to frequency
        const freq = getFreq(i, width);
        // Calculate Magnitude (dB)
        const mag = getPeakingMag(freq, params.frequency, params.Q, dynamicGain, 44100);
        const y = getY(mag, canvas.height);
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();

      // 6. Draw Static Curve (Ghost) if GR > 0
      if (gr > 0.1) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; // Blue-500 transparent
          ctx.lineWidth = 1;
          for (let i = 0; i < width; i++) {
            const freq = getFreq(i, width);
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
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-2">
         <span className="font-bold text-blue-400">Dynamic EQ</span>
         <button onClick={onRemove} className="text-red-500 text-xs hover:text-red-400">Remove</button>
      </div>

      <canvas 
        ref={canvasRef} 
        width={600} 
        height={200} 
        className="w-full h-40 bg-slate-900 rounded mb-4 border border-slate-700"
      />

      <div className="grid grid-cols-4 gap-4">
         {Object.entries(module.parameters).map(([key, val]) => (
            <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                    {key} <span className="text-slate-300">{val.toFixed(2)}</span>
                </label>
                <input 
                    type="range" 
                    className="h-1 bg-slate-600 rounded appearance-none cursor-pointer accent-blue-500"
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
  );
};

// --- Math Helpers ---

function getX(freq: number, width: number): number {
    const minF = 20;
    const maxF = 20000;
    // Log scale mapping
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
    // Range: +20dB to -20dB
    const minDb = -20;
    const maxDb = 20;
    const range = maxDb - minDb;
    // Map db to 0-1 (inverse, 0 is top)
    const norm = 1 - (db - minDb) / range;
    return norm * height;
}

// Magnitude response of a Peaking EQ filter
function getPeakingMag(f: number, f0: number, Q: number, gainDb: number, fs: number): number {
    const w0 = (2 * Math.PI * f0) / fs;
    const w = (2 * Math.PI * f) / fs;
    const A = Math.pow(10, gainDb / 40);
    const alpha = Math.sin(w0) / (2 * Q);
    
    // Coefficients (Standard RBJ)
    const b0 = 1 + alpha * A;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha / A;

    // Evaluate H(z) at z = e^(jw)
    // H(e^jw) = (b0 + b1*e^-jw + b2*e^-2jw) / (a0 + a1*e^-jw + a2*e^-2jw)
    
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
