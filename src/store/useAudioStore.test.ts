import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAudioStore } from './useAudioStore';

// Mock the AudioEngine singleton
vi.mock('@/audio/context', () => ({
  audioEngine: {
    init: vi.fn(),
    resume: vi.fn(),
    playTestTone: vi.fn(),
    rebuildGraph: vi.fn(),
    updateModuleParam: vi.fn(),
    context: { currentTime: 0 },
    masterGain: { gain: { setTargetAtTime: vi.fn() } }
  }
}));

// Mock idb-keyval for persistence
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

describe('useAudioStore', () => {
  beforeEach(() => {
    // Reset store state
    useAudioStore.setState({
      isInitialized: false,
      isPlaying: false,
      masterVolume: 1.0,
      rack: []
    });
    vi.clearAllMocks();
  });

  it('should add a Dynamic EQ module', () => {
    const { addModule } = useAudioStore.getState();
    addModule('DYNAMIC_EQ');
    
    const state = useAudioStore.getState();
    expect(state.rack).toHaveLength(1);
    expect(state.rack[0].type).toBe('DYNAMIC_EQ');
    expect(state.rack[0].parameters.frequency).toBe(1000);
  });

  it('should add a Transient Shaper module', () => {
    const { addModule } = useAudioStore.getState();
    addModule('TRANSIENT_SHAPER');
    
    const state = useAudioStore.getState();
    expect(state.rack).toHaveLength(1);
    expect(state.rack[0].type).toBe('TRANSIENT_SHAPER');
    expect(state.rack[0].parameters.attackGain).toBe(0);
  });

  it('should add a Limiter module', () => {
    const { addModule } = useAudioStore.getState();
    addModule('LIMITER');
    
    const state = useAudioStore.getState();
    expect(state.rack).toHaveLength(1);
    expect(state.rack[0].type).toBe('LIMITER');
    expect(state.rack[0].parameters.threshold).toBe(-0.5);
  });

  it('should add a MidSide EQ module', () => {
    const { addModule } = useAudioStore.getState();
    addModule('MIDSIDE_EQ');
    
    const state = useAudioStore.getState();
    expect(state.rack).toHaveLength(1);
    expect(state.rack[0].type).toBe('MIDSIDE_EQ');
    expect(state.rack[0].parameters.midGain).toBe(0);
  });

  it('should add a Cab Sim module', () => {
    const { addModule } = useAudioStore.getState();
    addModule('CAB_SIM');
    
    const state = useAudioStore.getState();
    expect(state.rack).toHaveLength(1);
    expect(state.rack[0].type).toBe('CAB_SIM');
    expect(state.rack[0].parameters.mix).toBe(1.0);
    expect(state.rack[0].parameters.irAssetId).toBeDefined();
  });

  it('should add a Loudness Meter module', () => {
    const { addModule } = useAudioStore.getState();
    addModule('LOUDNESS_METER');
    
    const state = useAudioStore.getState();
    expect(state.rack).toHaveLength(1);
    expect(state.rack[0].type).toBe('LOUDNESS_METER');
  });

  it('should remove a module', () => {
    const { addModule, removeModule } = useAudioStore.getState();
    addModule('DYNAMIC_EQ');
    const id = useAudioStore.getState().rack[0].id;
    
    removeModule(id);
    expect(useAudioStore.getState().rack).toHaveLength(0);
  });

  it('should update module params', () => {
    const { addModule, updateModuleParam } = useAudioStore.getState();
    addModule('DYNAMIC_EQ');
    const id = useAudioStore.getState().rack[0].id;

    updateModuleParam(id, 'frequency', 500);
    
    expect(useAudioStore.getState().rack[0].parameters.frequency).toBe(500);
  });
});
