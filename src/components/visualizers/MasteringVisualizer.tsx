import React, { useRef, useEffect } from 'react';
import { audioEngine } from '@/audio/context';

export const MasteringVisualizer: React.FC = () => {
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const gonioRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    
    // Setup Analyser
    const analyser = audioEngine.analyser;
    const analyserL = audioEngine.analyserL;
    const analyserR = audioEngine.analyserR;
    
    const render = () => {
      if (!analyser || !analyserL || !analyserR) {
          animationId = requestAnimationFrame(render);
          return;
      }

      // Spectrum
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      
      const canvas = spectrumRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          
          const bufferLength = freqData.length;
          // Logarithmic X Scale
          for (let i = 0; i < bufferLength; i++) {
              const value = freqData[i];
              const percent = value / 255;
              const height = canvas.height * percent;
              const offset = canvas.height - height - 1;
              
              // Map i to log scale x
              // minFreq = 20, maxFreq = 20000
              // This is complex to do per-bin without proper interpolation.
              // Simple Linear for now to prove concept, or approximate log.
              const x = (i / bufferLength) * canvas.width; 
              
              if (i === 0) ctx.moveTo(x, offset);
              else ctx.lineTo(x, offset);
          }
          ctx.stroke();
      }

      // Goniometer (Real)
      const dataL = new Float32Array(analyserL.frequencyBinCount);
      const dataR = new Float32Array(analyserR.frequencyBinCount);
      analyserL.getFloatTimeDomainData(dataL);
      analyserR.getFloatTimeDomainData(dataR);
      
      const gCanvas = gonioRef.current;
      const gCtx = gCanvas?.getContext('2d');
      if (gCanvas && gCtx) {
          // Fade effect
          gCtx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // slow fade
          gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
          
          gCtx.fillStyle = '#10b981'; // Green dot

          const w = gCanvas.width;
          const h = gCanvas.height;
          const cx = w / 2;
          const cy = h / 2;

          // Downsample to improve performance and look
          // Using 4096 points might be too dense, skip factor 4
          for (let i = 0; i < dataL.length; i += 4) {
              const L = dataL[i];
              const R = dataR[i];

              // Rotate -45 degrees:
              // Side = L - R (X axis)
              // Mid = L + R (Y axis)
              const side = (L - R) * 0.707; // Math.SQRT1_2
              const mid = (L + R) * 0.707;

              const x = cx + side * (w * 0.8);
              const y = cy - mid * (h * 0.8); // Invert Y for canvas

              gCtx.fillRect(x, y, 1, 1);
          }
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="flex gap-4 w-full h-48 bg-slate-900 p-4 rounded-lg border border-slate-700">
        <div className="flex-1 relative">
            <span className="absolute top-2 left-2 text-xs text-slate-500 font-bold">SPECTRUM</span>
            <canvas ref={spectrumRef} width={600} height={160} className="w-full h-full" />
        </div>
        <div className="w-48 relative border-l border-slate-700 pl-4">
            <span className="absolute top-2 left-6 text-xs text-slate-500 font-bold">WAVE / STEREO</span>
            <canvas ref={gonioRef} width={180} height={160} className="w-full h-full" />
        </div>
    </div>
  );
};
