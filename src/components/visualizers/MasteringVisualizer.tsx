import React, { useEffect, useRef } from 'react';
import { audioEngine } from '@/audio/context';
import { ResponsiveCanvas } from './ResponsiveCanvas';

export const MasteringVisualizer: React.FC<{ className?: string }> = ({ className }) => {
  const spectrumRef = useRef<HTMLCanvasElement | null>(null);
  const gonioRef = useRef<HTMLCanvasElement | null>(null);

  // Cache buffers to avoid allocation in render loop
  const spectrumDataRef = useRef<Uint8Array | null>(null);
  const gonioDataLRef = useRef<Uint8Array | null>(null);
  const gonioDataRRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let animationId: number;
    
    const render = () => {
       const analyser = audioEngine.analyser;
       const analyserL = audioEngine.analyserL;
       const analyserR = audioEngine.analyserR;

       // --- Spectrum Render ---
       if (spectrumRef.current && analyser) {
           const canvas = spectrumRef.current;
           const ctx = canvas.getContext('2d');
           // Dimensions are logical CSS pixels (handled by ResponsiveCanvas scaling)
           const width = canvas.width / (window.devicePixelRatio || 1);
           const height = canvas.height / (window.devicePixelRatio || 1);

           if (ctx) {
               ctx.fillStyle = '#020617'; // slate-950
               ctx.fillRect(0, 0, width, height);

               const bufferLength = analyser.frequencyBinCount;

               // Reuse buffer if size matches
               if (!spectrumDataRef.current || spectrumDataRef.current.length !== bufferLength) {
                   spectrumDataRef.current = new Uint8Array(bufferLength);
               }
               const dataArray = spectrumDataRef.current;

               analyser.getByteFrequencyData(dataArray);

               ctx.lineWidth = 2;
               ctx.strokeStyle = '#3b82f6'; // primary
               ctx.beginPath();
               
               // Draw Spectrum
               const sliceWidth = width * 1.0 / bufferLength;
               let x = 0;
               for(let i = 0; i < bufferLength; i++) {
                   const v = dataArray[i] / 128.0; 
                   const y = height - (v * height / 2); // Normalize roughly

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
           const ctx = canvas.getContext('2d');
           const width = canvas.width / (window.devicePixelRatio || 1);
           const height = canvas.height / (window.devicePixelRatio || 1);
           
           if (ctx) {
               // Fade trail
               ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; 
               ctx.fillRect(0, 0, width, height);
               
               const len = analyserL.frequencyBinCount;
               
               // Reuse buffers
               if (!gonioDataLRef.current || gonioDataLRef.current.length !== len) {
                   gonioDataLRef.current = new Uint8Array(len);
               }
               if (!gonioDataRRef.current || gonioDataRRef.current.length !== len) {
                   gonioDataRRef.current = new Uint8Array(len);
               }

               const dataL = gonioDataLRef.current;
               const dataR = gonioDataRRef.current;

               analyserL.getByteTimeDomainData(dataL);
               analyserR.getByteTimeDomainData(dataR);
               
               ctx.lineWidth = 1.5;
               ctx.strokeStyle = '#22c55e'; // active-led green
               ctx.beginPath();
               
               const cx = width / 2;
               const cy = height / 2;
               const scale = Math.min(width, height) / 2;
               
               // Downsample for performance / aesthetics
               for(let i = 0; i < len; i += 4) {
                   const l = (dataL[i] / 128.0) - 1.0;
                   const r = (dataR[i] / 128.0) - 1.0;
                   
                   // Rotate 45deg
                   // S = (L-R), M = (L+R)
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
