import React, { useRef, useEffect } from 'react';
import { useAudioStore, RackModule } from '@/store/useAudioStore';
import { audioEngine } from '@/audio/context';
import { DynamicEQUnit } from './DynamicEQUnit';
import { LimiterUnit } from './LimiterUnit';
import { MidSideEQUnit } from './MidSideEQUnit';
import { CabSimUnit } from './CabSimUnit';
import { MeteringUnit } from './MeteringUnit';

export const EffectsRack: React.FC = () => {
  const { rack, addModule, removeModule, updateModuleParam, isInitialized } = useAudioStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // ... existing visualizer logic ...

  // Visualizer Loop (Bypasses React Render Cycle)
  useEffect(() => {
    if (!isInitialized || !canvasRef.current) return;

    let animationId: number;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!audioEngine.analyser) {
          animationId = requestAnimationFrame(render);
          return;
      }

      const bufferLength = audioEngine.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioEngine.analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#1e293b'; // Slate-800
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6'; // Blue-500
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();
    
    return () => cancelAnimationFrame(animationId);
  }, [isInitialized]);

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">Effects Rack</h2>
          <div className="flex gap-2">
            <button 
                onClick={async () => { await useAudioStore.getState().savePreset(); alert('Saved!'); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold transition-colors text-white"
            >
                Save
            </button>
            <button 
                onClick={() => addModule('DYNAMIC_EQ')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-colors text-white"
            >
                + Add DynEQ
            </button>
            <button 
                onClick={() => addModule('TRANSIENT_SHAPER')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold transition-colors text-white"
            >
                + Add Shaper
            </button>
            <button 
                onClick={() => addModule('LIMITER')}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-bold transition-colors text-white"
            >
                + Add Limiter
            </button>
            <button 
                onClick={() => addModule('MIDSIDE_EQ')}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-bold transition-colors text-white"
            >
                + Add MS EQ
            </button>
            <button 
                onClick={() => addModule('CAB_SIM')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-bold transition-colors text-white"
            >
                + Add Cab
            </button>
            <button 
                onClick={() => addModule('LOUDNESS_METER')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-bold transition-colors text-white"
            >
                + Add Meter
            </button>
          </div>
      </div>

      <div className="flex flex-col gap-4 items-center">
        {rack.map((module) => (
            module.type === 'DYNAMIC_EQ' ? (
                <DynamicEQUnit 
                    key={module.id} 
                    module={module} 
                    onRemove={() => removeModule(module.id)}
                    onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                />
            ) : module.type === 'LIMITER' ? (
                <LimiterUnit 
                    key={module.id} 
                    module={module} 
                    onRemove={() => removeModule(module.id)}
                    onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                />
            ) : module.type === 'MIDSIDE_EQ' ? (
                <MidSideEQUnit 
                    key={module.id} 
                    module={module} 
                    onRemove={() => removeModule(module.id)}
                    onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                />
            ) : module.type === 'CAB_SIM' ? (
                <CabSimUnit 
                    key={module.id} 
                    module={module} 
                    onRemove={() => removeModule(module.id)}
                    onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                />
            ) : module.type === 'LOUDNESS_METER' ? (
                <MeteringUnit 
                    key={module.id} 
                    module={module} 
                    onRemove={() => removeModule(module.id)}
                />
            ) : (
                <ModuleUnit 
                    key={module.id} 
                    module={module} 
                    onRemove={() => removeModule(module.id)}
                    onUpdate={(p, v) => updateModuleParam(module.id, p, v)}
                />
            )
        ))}
        {rack.length === 0 && (
            <div className="text-slate-500 text-center p-8 border border-dashed border-slate-700 rounded-lg w-full">
                Rack is empty. Add a module to start.
            </div>
        )}
      </div>

      {/* Visualizer Canvas */}
      <div className="border border-slate-700 rounded-md overflow-hidden bg-black relative h-32 shrink-0 mt-auto">
        <canvas
            ref={canvasRef}
            width={800}
            height={200}
            className="w-full h-full"
        />
      </div>
    </div>
  );
};

// Sub-component for individual modules
const ModuleUnit = ({ module, onRemove, onUpdate }: { 
    module: RackModule, 
    onRemove: () => void,
    onUpdate: (p: string, v: number) => void 
}) => {
    return (
        <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 relative group">
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-300 text-sm tracking-wider">{module.type}</span>
                <button onClick={onRemove} className="text-red-500 text-xs hover:text-red-400">Remove</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(module.parameters).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">{key}</label>
                        <input 
                            type="range" 
                            className="h-1 bg-slate-600 rounded appearance-none cursor-pointer accent-blue-500"
                            min={getMin(key)}
                            max={getMax(key)}
                            step={getStep(key)}
                            value={val}
                            onChange={(e) => onUpdate(key, parseFloat(e.target.value))}
                        />
                         <span className="text-xs text-slate-400 font-mono">{val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper for parameter ranges
function getMin(param: string) {
    if (param === 'frequency') return 20;
    if (param === 'gain') return -20;
    if (param === 'threshold') return -60;
    if (param === 'attack' || param === 'release') return 0.001;
    if (param === 'attackGain' || param === 'sustainGain') return -24;
    return 0;
}
function getMax(param: string) {
    if (param === 'frequency') return 20000;
    if (param === 'gain') return 20;
    if (param === 'threshold') return 0;
    if (param === 'attack' || param === 'release') return 1;
    if (param === 'ratio') return 20;
    if (param === 'Q') return 10;
    if (param === 'attackGain' || param === 'sustainGain') return 24;
    return 1;
}
function getStep(param: string) {
    if (param === 'frequency') return 1;
    if (param === 'ratio' || param === 'Q') return 0.1;
    if (param === 'attackGain' || param === 'sustainGain') return 0.1;
    return 0.01;
}