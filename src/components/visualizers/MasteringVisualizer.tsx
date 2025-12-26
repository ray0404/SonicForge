import React, { useEffect, useRef } from 'react';
import { audioEngine } from '@/audio/context';
import { ResponsiveCanvas } from './ResponsiveCanvas';

// Pre-define colors to avoid reallocation
const COLOR_BG = '#020617'; // slate-950
const COLOR_SPECTRUM = '#3b82f6'; // primary
const COLOR_GONIO_BG = 'rgba(2, 6, 23, 0.2)';
const COLOR_GONIO_TRACE = '#22c55e'; // active-led green

export const MasteringVisualizer: React.FC<{ className?: string }> = ({ className }) => {
  const spectrumRef = useRef<HTMLCanvasElement | null>(null);
  const gonioRef = useRef<HTMLCanvasElement | null>(null);

  // Cache contexts
  const spectrumCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gonioCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Reuse buffers to avoid GC
  const spectrumBufferRef = useRef<Uint8Array | null>(null);
  const gonioLBufferRef = useRef<Uint8Array | null>(null);
  const gonioRBufferRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let animationId: number;
    
    const render = () => {
       const analyser = audioEngine.analyser;
       const analyserL = audioEngine.analyserL;
       const analyserR = audioEngine.analyserR;

       // --- Spectrum Render ---
       if (spectrumRef.current && analyser) {
           const canvas = spectrumRef.current;
           // Get context only if not cached or canvas changed (rare)
           if (!spectrumCtxRef.current || spectrumCtxRef.current.canvas !== canvas) {
               spectrumCtxRef.current = canvas.getContext('2d', { alpha: false }); // alpha: false hint
           }
           const ctx = spectrumCtxRef.current;

           if (ctx) {
               // Dimensions are logical CSS pixels
               const dpr = window.devicePixelRatio || 1;
               const width = canvas.width / dpr;
               const height = canvas.height / dpr;

               ctx.fillStyle = COLOR_BG;
               ctx.fillRect(0, 0, width, height);

               const bufferLength = analyser.frequencyBinCount;

               // Re-allocate only if size changes
               if (!spectrumBufferRef.current || spectrumBufferRef.current.length !== bufferLength) {
                   spectrumBufferRef.current = new Uint8Array(bufferLength);
               }
               const dataArray = spectrumBufferRef.current;

               analyser.getByteFrequencyData(dataArray);

               ctx.lineWidth = 2;
               ctx.strokeStyle = COLOR_SPECTRUM;
               ctx.beginPath();
               
               const sliceWidth = width * 1.0 / bufferLength;
               let x = 0;

               // Optimization: Skip points if buffer is huge relative to width?
               // For now, keeping logic same but allocation-free.
               for(let i = 0; i < bufferLength; i++) {
                   const v = dataArray[i] / 128.0; 
                   const y = height - (v * height / 2);

                   if(i === 0) ctx.moveTo(x, y);
                   else ctx.lineTo(x, y);

                   x += sliceWidth;
               }
               ctx.stroke();
           }
       }

       // --- Goniometer Render ---
       if (gonioRef.current && analyserL && analyserR) {
           const canvas = gonioRef.current;
           if (!gonioCtxRef.current || gonioCtxRef.current.canvas !== canvas) {
               gonioCtxRef.current = canvas.getContext('2d');
           }
           const ctx = gonioCtxRef.current;
           
           if (ctx) {
               const dpr = window.devicePixelRatio || 1;
               const width = canvas.width / dpr;
               const height = canvas.height / dpr;

               // Fade trail
               ctx.fillStyle = COLOR_GONIO_BG;
               ctx.fillRect(0, 0, width, height);
               
               const len = analyserL.frequencyBinCount;
               
               if (!gonioLBufferRef.current || gonioLBufferRef.current.length !== len) {
                   gonioLBufferRef.current = new Uint8Array(len);
                   gonioRBufferRef.current = new Uint8Array(len);
               }
               const dataL = gonioLBufferRef.current!;
               const dataR = gonioRBufferRef.current!; // We know this is set if L is set

               analyserL.getByteTimeDomainData(dataL);
               analyserR.getByteTimeDomainData(dataR);
               
               ctx.lineWidth = 1.5;
               ctx.strokeStyle = COLOR_GONIO_TRACE;
               ctx.beginPath();
               
               const cx = width / 2;
               const cy = height / 2;
               const scale = Math.min(width, height) / 2;
               
               for(let i = 0; i < len; i += 4) {
                   const l = (dataL[i] / 128.0) - 1.0;
                   const r = (dataR[i] / 128.0) - 1.0;
                   
                   const x = cx + (l - r) * 0.707 * scale;
                   const y = cy - (l + r) * 0.707 * scale;
                   
                   if (i===0) ctx.moveTo(x, y);
                   else ctx.lineTo(x, y);
               }
               ctx.stroke();
           }
       }

       animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={`flex flex-col md:flex-row gap-4 w-full h-full ${className || ''}`}>
        <ResponsiveCanvas 
            className="flex-[2] bg-slate-950 rounded-lg border border-slate-800 shadow-inner"
            label="Spectrum"
            onMount={(el) => spectrumRef.current = el}
        />
        <ResponsiveCanvas 
            className="flex-1 bg-slate-950 rounded-lg border border-slate-800 shadow-inner min-h-[200px] md:min-h-0"
            label="Stereo Field"
            onMount={(el) => gonioRef.current = el}
        />
    </div>
  );
};
