import { logger } from "@/utils/logger";
import { RackModule, useAudioStore } from "@/store/useAudioStore";
import { DynamicEQNode } from "./worklets/DynamicEQNode";
import { TransientShaperNode } from "./worklets/TransientShaperNode";
import { LimiterNode } from "./worklets/LimiterNode";
import { MidSideEQNode } from "./worklets/MidSideEQNode";
import { MeteringNode } from "./worklets/MeteringNode";
import { ConvolutionNode } from "./worklets/ConvolutionNode";

// @ts-ignore
import dynamicEqUrl from './worklets/dynamic-eq-processor.js?worker&url';
// @ts-ignore
import transientUrl from './worklets/transient-processor.js?worker&url';
// @ts-ignore
import limiterUrl from './worklets/limiter-processor.js?worker&url';
// @ts-ignore
import midsideUrl from './worklets/midside-eq-processor.js?worker&url';
// @ts-ignore
import lufsUrl from './worklets/lufs-processor.js?worker&url';

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
  
  // The 'nodeMap' maps module.id -> AudioNode | ConvolutionNode
  private nodeMap = new Map<string, AudioNode | ConvolutionNode>();
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
        await this.context.audioWorklet.addModule(limiterUrl);
        await this.context.audioWorklet.addModule(midsideUrl);
        await this.context.audioWorklet.addModule(lufsUrl);
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
        let node: AudioNode | ConvolutionNode | undefined | null = this.nodeMap.get(module.id);
        
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
                // Handle Custom Node Wrappers that aren't native AudioNodes
                if (node instanceof ConvolutionNode) {
                    previousNode.connect(node.input);
                    previousNode = node.output;
                } else {
                    previousNode.connect(node as AudioNode);
                    previousNode = node as AudioNode;
                }
            }
        }
    });

    // 4. Connect end of chain to RackOutput
    previousNode.connect(this.rackOutput);
  }

  /**
   * Factory method to create AudioNodes for modules.
   */
  private createModuleNode(module: RackModule): AudioNode | ConvolutionNode | null {
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
                 const limiterNode = new LimiterNode(this.context);
                 this.updateNodeParams(limiterNode, module);
                 return limiterNode;
            case 'MIDSIDE_EQ':
                 const msNode = new MidSideEQNode(this.context);
                 this.updateNodeParams(msNode, module);
                 return msNode;
            case 'CAB_SIM':
                const cabNode = new ConvolutionNode(this.context);
                this.updateNodeParams(cabNode, module);
                return cabNode;
            case 'LOUDNESS_METER':
                return new MeteringNode(this.context);
            default:
                return null;
        }
      } catch (e) {
          logger.error(`Failed to create node for ${module.type}`, e);
          return this.context.createGain(); // Fallback
      }
  }

  private updateNodeParams(node: AudioNode | ConvolutionNode, module: RackModule) {
      if (module.type === 'DYNAMIC_EQ' && node instanceof DynamicEQNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key, value);
          });
      } else if (module.type === 'TRANSIENT_SHAPER' && node instanceof TransientShaperNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
      } else if (module.type === 'LIMITER' && node instanceof LimiterNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
      } else if (module.type === 'MIDSIDE_EQ' && node instanceof MidSideEQNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
      } else if (module.type === 'CAB_SIM' && node instanceof ConvolutionNode) {
          if (module.parameters.mix !== undefined) {
              node.setMix(module.parameters.mix);
          }
          if (module.parameters.irAssetId) {
              // Access store via direct import or pass it in? 
              // Circular dependency risk if we import store here. 
              // Better to access via module params or separate asset registry.
              // We updated store to hold assets.
              const assets = useAudioStore.getState().assets;
              const buffer = assets[module.parameters.irAssetId];
              if (buffer) {
                  node.setBuffer(buffer);
              }
          }
      }
  }

  /**
   * Updates a single parameter on a specific module node.
   */
  public updateModuleParam(id: string, param: string, value: any) {
      const node = this.nodeMap.get(id);
      if (node) {
          if (node instanceof DynamicEQNode) {
             node.setParam(param, value);
          } else if (node instanceof TransientShaperNode) {
             node.setParam(param as any, value);
          } else if (node instanceof LimiterNode) {
             node.setParam(param as any, value);
          } else if (node instanceof MidSideEQNode) {
             node.setParam(param as any, value);
          } else if (node instanceof ConvolutionNode) {
             if (param === 'mix') node.setMix(value);
             if (param === 'irAssetId') {
                 const assets = useAudioStore.getState().assets;
                 const buffer = assets[value];
                 if (buffer) node.setBuffer(buffer);
             }
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