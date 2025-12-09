import { logger } from "@/utils/logger";
import { RackModule } from "@/store/useAudioStore";
import { DynamicEQNode } from "./worklets/DynamicEQNode";
import { TransientShaperNode } from "./worklets/TransientShaperNode";

// @ts-ignore
import dynamicEqUrl from './worklets/dynamic-eq-processor.js?worker&url';
// @ts-ignore
import transientUrl from './worklets/transient-processor.js?worker&url';

/**
 * Singleton AudioContext Manager.
 * Handles the lifecycle of the AudioContext, loading Worklets, and routing.
 */
class AudioEngine {
  public context: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  
  // Rack Routing
  public rackInput: GainNode | null = null;
  public rackOutput: GainNode | null = null;
  
  // The 'nodeMap' maps module.id -> AudioNode
  private nodeMap = new Map<string, AudioNode>();
  private isInitialized = false;

  constructor() {
    // Lazy initialization handled in init()
  }

  async init() {
    if (this.isInitialized) return;

    try {
      logger.info("Initializing Audio Engine...");
      this.context = new window.AudioContext();

      // 1. Load AudioWorklet
      logger.info(`Loading AudioWorklet modules...`);
      try {
        await this.context.audioWorklet.addModule(dynamicEqUrl);
        await this.context.audioWorklet.addModule(transientUrl);
        logger.info("AudioWorklet modules loaded successfully.");
      } catch (err) {
        logger.error(`Failed to load AudioWorklet modules`, err);
        throw err;
      }

      // 2. Create Infrastructure Nodes
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 1.0;

      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;

      this.rackInput = this.context.createGain();
      this.rackOutput = this.context.createGain();

      // 3. Routing: RackInput -> [Rack Modules] -> RackOutput -> Analyser -> Master -> Destination
      // Initially, connect input directly to output (empty rack)
      this.rackInput.connect(this.rackOutput);
      this.rackOutput.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      this.isInitialized = true;
      logger.info("Audio Engine Initialized Successfully.");
    } catch (e) {
      logger.error("Failed to initialize Audio Engine:", e);
      throw e;
    }
  }

  resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }

  /**
   * Rebuilds the audio graph based on the provided rack modules.
   * Handles hot-swapping and reordering of nodes.
   */
  rebuildGraph(rack: RackModule[]) {
    if (!this.context || !this.rackInput || !this.rackOutput) return;
    
    // 1. Disconnect everything to start fresh routing
    this.rackInput.disconnect();
    
    // Disconnect all existing module nodes
    this.nodeMap.forEach(node => node.disconnect());

    // 2. Cleanup: Remove nodes that are no longer in the rack
    const currentIds = new Set(rack.map(m => m.id));
    for (const [id] of this.nodeMap) {
        if (!currentIds.has(id)) {
            this.nodeMap.delete(id);
        }
    }

    // 3. Build the Chain
    let previousNode: AudioNode = this.rackInput;

    rack.forEach(module => {
        let node: AudioNode | undefined | null = this.nodeMap.get(module.id);
        
        if (!node) {
            // Instantiate new node if missing
            node = this.createModuleNode(module);
            if (node) {
                this.nodeMap.set(module.id, node);
            }
        } else {
             this.updateNodeParams(node, module);
        }

        if (node) {
            if (!module.bypass) {
                previousNode.connect(node);
                previousNode = node;
            }
        }
    });

    // 4. Connect end of chain to RackOutput
    previousNode.connect(this.rackOutput);
  }

  /**
   * Factory method to create AudioNodes for modules.
   */
  private createModuleNode(module: RackModule): AudioNode | null {
      if (!this.context) return null;

      try {
        switch (module.type) {
            case 'DYNAMIC_EQ':
                const deqNode = new DynamicEQNode(this.context);
                this.updateNodeParams(deqNode, module);
                return deqNode;
            case 'TRANSIENT_SHAPER':
                 const tsNode = new TransientShaperNode(this.context);
                 this.updateNodeParams(tsNode, module);
                 return tsNode;
            case 'LIMITER':
                return this.context.createGain();
            default:
                return null;
        }
      } catch (e) {
          logger.error(`Failed to create node for ${module.type}`, e);
          return this.context.createGain(); // Fallback
      }
  }

  private updateNodeParams(node: AudioNode, module: RackModule) {
      if (module.type === 'DYNAMIC_EQ' && node instanceof DynamicEQNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key, value);
          });
      } else if (module.type === 'TRANSIENT_SHAPER' && node instanceof TransientShaperNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
      }
  }

  /**
   * Updates a single parameter on a specific module node.
   */
  public updateModuleParam(id: string, param: string, value: number) {
      const node = this.nodeMap.get(id);
      if (node) {
          if (node instanceof DynamicEQNode) {
             node.setParam(param, value);
          } else if (node instanceof TransientShaperNode) {
             node.setParam(param as any, value);
          }
          // Add logic for other node types here
      }
  }

  /**
   * For testing: Plays a simple test tone through the rack
   */
  playTestTone() {
    if (!this.context || !this.rackInput) return;

    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.context.currentTime);

    // Connect osc to the Rack Input
    osc.connect(this.rackInput);

    osc.start();
    osc.stop(this.context.currentTime + 2); // Play for 2 seconds
    logger.info("Playing test tone...");
  }
}

export const audioEngine = new AudioEngine();