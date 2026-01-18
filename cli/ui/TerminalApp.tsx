import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { MeterBar } from './components/MeterBar.js';
import { AudioBridge } from '../engine/audio-bridge.js';
import fs from 'fs';
import path from 'path';

// --- Types ---
type View = 'MAIN' | 'RACK' | 'ADD_MODULE' | 'MODULE_EDIT' | 'LOAD_FILE' | 'EXPORT';

// --- Constants ---
const MODULE_TYPES = [
  'COMPRESSOR', 'PARAMETRIC_EQ', 'SATURATION', 'LIMITER', 
  'DYNAMIC_EQ', 'TRANSIENT_SHAPER', 'MIDSIDE_EQ', 'CAB_SIM', 'DITHERING',
  'DISTORTION', 'BITCRUSHER', 'CHORUS', 'PHASER', 'TREMOLO', 'AUTOWAH',
  'FEEDBACK_DELAY', 'DE_ESSER', 'STEREO_IMAGER', 'MULTIBAND_COMPRESSOR'
];

// Parameter Ranges for Clamping (matching Worklet parameterDescriptors)
const PARAM_RANGES: Record<string, { min: number, max: number }> = {
    // Compressor
    'threshold': { min: -60, max: 0 },
    'ratio': { min: 1, max: 20 },
    'attack': { min: 0.0001, max: 1 },
    'release': { min: 0.001, max: 2 },
    'knee': { min: 0, max: 20 },
    'makeupGain': { min: 0, max: 24 },
    'mix': { min: 0, max: 1 },
    // Parametric EQ
    'lowFreq': { min: 20, max: 1000 },
    'lowGain': { min: -24, max: 24 },
    'midFreq': { min: 200, max: 5000 },
    'midGain': { min: -24, max: 24 },
    'midQ': { min: 0.1, max: 10 },
    'highFreq': { min: 2000, max: 20000 },
    'highGain': { min: -24, max: 24 },
    // Saturation
    'drive': { min: 0, max: 1 },
    'outputGain': { min: -24, max: 24 },
    // Limiter
    'ceiling': { min: -60, max: 0 },
    'lookahead': { min: 0, max: 50 }, // ms usually
    // Common
    'gain': { min: -24, max: 24 },
    'frequency': { min: 20, max: 20000 },
    'depth': { min: 0, max: 1 },
    'feedback': { min: 0, max: 1 },
    'wet': { min: 0, max: 1 },
    'bits': { min: 1, max: 16 }, // Bitcrusher
    'normFreq': { min: 0, max: 1 }, // Bitcrusher
};

const getParamRange = (paramName: string) => {
    // Exact match
    if (PARAM_RANGES[paramName]) return PARAM_RANGES[paramName];
    // Partial match fallback
    if (paramName.toLowerCase().includes('gain')) return { min: -24, max: 24 };
    if (paramName.toLowerCase().includes('freq')) return { min: 20, max: 20000 };
    if (paramName.toLowerCase().includes('mix') || paramName.toLowerCase().includes('wet')) return { min: 0, max: 1 };
    
    // Default safe range
    return { min: -1000, max: 1000 };
};

export const TerminalApp = ({ bridge }: { bridge: AudioBridge }) => {
  const { exit } = useApp();
  const [view, setView] = useState<View>('MAIN');
  const [rack, setRack] = useState<any[]>([]);
  const [playback, setPlayback] = useState({ isPlaying: false, currentTime: 0, duration: 0 });
  const [metering, setMetering] = useState({ input: -60, output: -60, gainReduction: 0 });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [filePath, setFilePath] = useState('');
  const [exportPath, setExportPath] = useState('output.wav');
  const [message, setMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Sync State
  useEffect(() => {
    const sync = async () => {
      try {
        const r = await bridge.getRack();
        setRack(r || []);
        const p = await bridge.getPlaybackState();
        setPlayback(p || { isPlaying: false, currentTime: 0, duration: 0 });
      } catch (e) {}
    };
    sync();
    const interval = setInterval(async () => {
      try {
        // Only poll if NOT exporting to avoid bridge congestion
        if (isExporting) return;
        
        const m = await bridge.getMetering();
        if (m) setMetering(m);
        const p = await bridge.getPlaybackState();
        if (p) setPlayback(p);
      } catch (e) {}
    }, 250); // Slowed down to 250ms to reduce UI flicker
    return () => clearInterval(interval);
  }, [bridge, isExporting]);

  // Main Menu Items (ASCII)
  const mainItems = [
    { label: '[#] Manage Rack', value: 'RACK' },
    { label: '[F] Load Audio File', value: 'LOAD_FILE' },
    { label: playback.isPlaying ? '|| Pause' : '> Play', value: 'TOGGLE_PLAY' },
    { label: '[] Stop', value: 'STOP' },
    { label: '<< Rewind (5s)', value: 'REWIND' },
    { label: '>> Forward (5s)', value: 'FORWARD' },
    { label: '[S] Export Audio', value: 'EXPORT' },
    { label: '[X] Exit', value: 'EXIT' }
  ];

  const handleMainSelect = async (item: any) => {
    if (item.value === 'EXIT') exit();
    else if (item.value === 'TOGGLE_PLAY') {
      await bridge.togglePlay();
    }
    else if (item.value === 'STOP') {
      if (playback.isPlaying) await bridge.togglePlay();
      await bridge.seek(0);
    }
    else if (item.value === 'REWIND') {
      await bridge.seek(Math.max(0, playback.currentTime - 5));
    }
    else if (item.value === 'FORWARD') {
      await bridge.seek(Math.min(playback.duration, playback.currentTime + 5));
    }
    else {
      setView(item.value);
    }
  };

  // File Loader
  const handleLoadFile = async (pathStr: string) => {
    setMessage('Loading...');
    try {
      if (!fs.existsSync(pathStr)) throw new Error('File not found');
      const buffer = fs.readFileSync(pathStr);
      await bridge.loadAudio(buffer);
      setMessage(`Loaded: ${path.basename(pathStr)}`);
      setTimeout(() => { setMessage(''); setView('MAIN'); }, 1500);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  const handleExport = async (pathStr: string) => {
      setIsExporting(true);
      setMessage('Rendering offline... please wait.');
      try {
          const target = path.isAbsolute(pathStr) ? pathStr : path.resolve(process.cwd(), pathStr);
          await bridge.exportAudio(target);
          setMessage(`Success! Saved to: ${target}`);
          setTimeout(() => { setMessage(''); setIsExporting(false); setView('MAIN'); }, 2500);
      } catch (e: any) {
          setMessage(`Export Error: ${e.message}`);
          setIsExporting(false);
      }
  };

  // Renderers
  const renderMain = () => (
    <Box flexDirection="column">
      <Text color="cyan" bold>Sonic Forge TUI</Text>
      <Box marginY={1}>
        <MeterBar label="IN " value={metering.input} />
        <MeterBar label="OUT" value={metering.output} />
      </Box>
      <Text>Time: {playback.currentTime.toFixed(2)}s / {playback.duration.toFixed(2)}s</Text>
      {message && <Text color="green" bold>{message}</Text>}
      <Box marginTop={1}>
        <SelectInput items={mainItems} onSelect={handleMainSelect} />
      </Box>
    </Box>
  );

  const renderRack = () => {
    // ASCII indicators
    const items = rack.map(m => ({ label: `${m.bypass ? '( )' : '(*)'} ${m.type}`, value: m.id }));
    items.push({ label: '+ Add Module', value: 'ADD' });
    items.push({ label: '< Back', value: 'BACK' });

    return (
      <Box flexDirection="column">
        <Text bold>Effects Rack</Text>
        <SelectInput items={items} onSelect={(item) => {
          if (item.value === 'BACK') setView('MAIN');
          else if (item.value === 'ADD') setView('ADD_MODULE');
          else {
            setSelectedModuleId(item.value);
            setView('MODULE_EDIT');
          }
        }} />
      </Box>
    );
  };

  const renderAddModule = () => {
    const items = MODULE_TYPES.map(t => ({ label: t, value: t }));
    items.push({ label: '< Cancel', value: 'BACK' });
    
    return (
      <Box flexDirection="column">
        <Text bold>Add Module</Text>
        <SelectInput limit={10} items={items} onSelect={async (item) => {
          if (item.value === 'BACK') setView('RACK');
          else {
            await bridge.addModule(item.value);
            const r = await bridge.getRack();
            setRack(r);
            setView('RACK');
          }
        }} />
      </Box>
    );
  };

  const renderModuleEdit = () => {
    const module = rack.find(m => m.id === selectedModuleId);
    if (!module) return <Text>Module not found</Text>;

    return <ModuleEditor bridge={bridge} module={module} onBack={() => setView('RACK')} />;
  };

  const renderLoadFile = () => (
    <Box flexDirection="column">
      <Text bold>Enter absolute path to audio file:</Text>
      <Box borderStyle="round" borderColor="gray">
        <TextInput 
          value={filePath} 
          onChange={setFilePath} 
          onSubmit={handleLoadFile} 
        />
      </Box>
      <Text color="gray">Press Enter to load, Esc to cancel</Text>
      {message && <Text color={message.startsWith('Error') ? 'red' : 'green'}>{message}</Text>}
      <InputListener onEsc={() => setView('MAIN')} />
    </Box>
  );

  const renderExport = () => (
      <Box flexDirection="column">
        <Text bold>Export Filename (WAV):</Text>
        <Box borderStyle="round" borderColor="gray">
          <TextInput 
            value={exportPath} 
            onChange={setExportPath} 
            onSubmit={handleExport}
          />
        </Box>
        {isExporting ? (
             <Box><Spinner type="dots" /><Text> Rendering... This may take a moment.</Text></Box>
        ) : (
             <Text color="gray">Press Enter to render & save, Esc to cancel</Text>
        )}
        {message && !isExporting && <Text color={message.startsWith('Error') ? 'red' : 'green'}>{message}</Text>}
        {!isExporting && <InputListener onEsc={() => setView('MAIN')} />}
      </Box>
  );

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan" minHeight={15}>
      {view === 'MAIN' && renderMain()}
      {view === 'RACK' && renderRack()}
      {view === 'ADD_MODULE' && renderAddModule()}
      {view === 'MODULE_EDIT' && renderModuleEdit()}
      {view === 'LOAD_FILE' && renderLoadFile()}
      {view === 'EXPORT' && renderExport()}
    </Box>
  );
};

// Helper for inputs
const InputListener = ({ onEsc }: { onEsc: () => void }) => {
  useInput((input, key) => {
    if (key.escape) onEsc();
  });
  return null;
};

// Module Editor Component
const ModuleEditor = ({ bridge, module, onBack }: { bridge: AudioBridge, module: any, onBack: () => void }) => {
  const [params, setParams] = useState(Object.keys(module.parameters));
  const [selectedParamIdx, setSelectedParamIdx] = useState(0);

  useInput(async (input, key) => {
    if (key.escape) { onBack(); return; }
    
    // Navigation
    if (key.upArrow) setSelectedParamIdx(prev => Math.max(0, prev - 1));
    if (key.downArrow) setSelectedParamIdx(prev => Math.min(params.length + 1, prev + 1)); // +1 for actions

    // Value editing
    const currentParam = params[selectedParamIdx];
    if (currentParam) {
        const val = module.parameters[currentParam];
        const range = getParamRange(currentParam);

        let step = 1;
        // Basic heuristics for step size
        if (currentParam.toLowerCase().includes('gain')) step = 0.5;
        if (currentParam.toLowerCase().includes('threshold')) step = 1;
        if (currentParam.toLowerCase().includes('ratio')) step = 0.5;
        if (currentParam.toLowerCase().includes('attack') || currentParam.toLowerCase().includes('release')) step = 0.01;
        if (currentParam.toLowerCase().includes('freq')) step = 10;
        if (currentParam.toLowerCase().includes('mix') || currentParam.toLowerCase().includes('wet')) step = 0.05;
        
        let newVal = val;
        if (key.leftArrow) newVal -= step;
        if (key.rightArrow) newVal += step;

        // Clamp
        newVal = Math.max(range.min, Math.min(range.max, newVal));

        if (newVal !== val) {
            // Update local module state optimistically for UI responsiveness
            module.parameters[currentParam] = newVal;
            // Send update
             bridge.updateParam(module.id, currentParam, newVal).catch(() => {});
        }
    } else {
        // Actions at the bottom
        if (key.return) {
             if (selectedParamIdx === params.length) {
                 // Remove
                 await bridge.removeModule(module.id);
                 onBack();
             }
        }
    }
    
    if (input === 'b') {
        bridge.toggleModuleBypass(module.id).catch(() => {});
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold underline color={module.bypass ? 'gray' : 'yellow'}>
        {module.type} {module.bypass ? '(BYPASSED)' : ''}
      </Text>
      <Box flexDirection="column" marginY={1}>
         {params.map((p, i) => (
             <Box key={p}>
                 <Text color={i === selectedParamIdx ? 'green' : 'white'}>
                    {i === selectedParamIdx ? '> ' : '  '}
                    {p}: {typeof module.parameters[p] === 'number' ? module.parameters[p].toFixed(2) : module.parameters[p]}
                 </Text>
             </Box>
         ))}
         <Box marginTop={1}>
             <Text color={selectedParamIdx === params.length ? 'red' : 'gray'}>
                {selectedParamIdx === params.length ? '> ' : '  '}
                [DELETE MODULE]
             </Text>
         </Box>
      </Box>
      <Text dimColor>Use Up/Down to select, Left/Right to adjust. Esc to back. 'b' to bypass.</Text>
    </Box>
  );
};