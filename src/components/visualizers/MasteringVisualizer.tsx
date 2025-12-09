import React, { useRef, useEffect } from 'react';
import { audioEngine } from '@/audio/context';

export const MasteringVisualizer: React.FC = () => {
  const spectrumRef = useRef<HTMLCanvasElement>(null);
  const gonioRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    
    // Setup Analyser
    const analyser = audioEngine.analyser;
    // We need a separate node for Goniometer (L/R access) or just use a ScriptProcessor/Worklet
    // For visualizer, we can use a Splitter connected to the output.
    // Ideally, AudioEngine should expose this.
    // For now, let's just do Spectrum (Mono sum).
    // To do goniometer properly without a worklet, we need a ChannelSplitterNode and two Analysers.
    // Let's modify AudioEngine later to expose L/R analysers if we want high precision.
    // For now, Spectrum is easy.
    
    const render = () => {
      if (!analyser) {
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

      // Goniometer (Placeholder / Fake using Time Domain for now)
      // Real goniometer requires L/R phase comparison.
      // We'll draw a "Waveform" in the gonio box for now as a placeholder for Stereo width
      const waveData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(waveData);
      
      const gCanvas = gonioRef.current;
      const gCtx = gCanvas?.getContext('2d');
      if (gCanvas && gCtx) {
          gCtx.fillStyle = '#0f172a';
          gCtx.fillRect(0, 0, gCanvas.width, gCanvas.height);
          
          gCtx.strokeStyle = '#10b981'; // Green
          gCtx.beginPath();
          for (let i = 0; i < waveData.length; i++) {
              const v = waveData[i] / 128.0;
              const y = v * gCanvas.height / 2;
              const x = (i / waveData.length) * gCanvas.width;
              if (i === 0) gCtx.moveTo(x, y);
              else gCtx.lineTo(x, y);
          }
          gCtx.stroke();
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
