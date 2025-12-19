import { logger } from "@/utils/logger";
import { RackModule, useAudioStore } from "@/store/useAudioStore";
import { DynamicEQNode } from "./worklets/DynamicEQNode";
import { TransientShaperNode } from "./worklets/TransientShaperNode";
import { LimiterNode } from "./worklets/LimiterNode";
import { MidSideEQNode } from "./worklets/MidSideEQNode";
import { MeteringNode } from "./worklets/MeteringNode";
import { ConvolutionNode } from "./worklets/ConvolutionNode";
import { SaturationNode } from "./worklets/SaturationNode";
import { DitheringNode } from "./worklets/DitheringNode";

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
// @ts-ignore
import saturationUrl from './worklets/saturation-processor.js?worker&url';
// @ts-ignore
import ditheringUrl from './worklets/dithering-processor.js?worker&url';

/**
 * Singleton AudioContext Manager.
 * Handles the lifecycle of the AudioContext, loading Worklets, and routing.
 */
export class AudioEngine {
  public context: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  public analyserL: AnalyserNode | null = null;
  public analyserR: AnalyserNode | null = null;
  public splitter: ChannelSplitterNode | null = null;
  
  // Rack Routing
  public rackInput: GainNode | null = null;
  public rackOutput: GainNode | null = null;
  
  // Source Management
  public sourceBuffer: AudioBuffer | null = null;
  public sourceNode: AudioBufferSourceNode | null = null;
  public startTime: number = 0;
  public pauseTime: number = 0;
  public isPlaying: boolean = false;

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
        await this.context.audioWorklet.addModule(saturationUrl);
        await this.context.audioWorklet.addModule(ditheringUrl);
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

      this.splitter = this.context.createChannelSplitter(2);
      this.analyserL = this.context.createAnalyser();
      this.analyserL.fftSize = 2048;
      this.analyserR = this.context.createAnalyser();
      this.analyserR.fftSize = 2048;

      this.rackInput = this.context.createGain();
      this.rackOutput = this.context.createGain();

      // 3. Routing: RackInput -> [Rack Modules] -> RackOutput
      // Parallel Paths from RackOutput:
      // Path A: -> Analyser (Mono Sum/Stereo Interleaved) -> Master -> Dest
      // Path B: -> Splitter -> AnalyserL / AnalyserR (Goniometer)
      
      this.rackInput.connect(this.rackOutput);
      
      // Main Audio Path
      this.rackOutput.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      // Analysis Path
      this.rackOutput.connect(this.splitter);
      this.splitter.connect(this.analyserL, 0);
      this.splitter.connect(this.analyserR, 1);

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
   * Loads an audio file into the source buffer
   */
  async loadSource(file: File): Promise<AudioBuffer> {
      if (!this.context) throw new Error("Audio Context not initialized");
      const arrayBuffer = await file.arrayBuffer();
      this.sourceBuffer = await this.context.decodeAudioData(arrayBuffer);
      return this.sourceBuffer;
  }

  /**
   * Plays the loaded source buffer from the current position
   */
  play() {
      if (!this.context || !this.sourceBuffer || !this.rackInput) return;
      if (this.isPlaying) return;

      this.sourceNode = this.context.createBufferSource();
      this.sourceNode.buffer = this.sourceBuffer;
      this.sourceNode.connect(this.rackInput);

      // Schedule playback
      // We need to handle the offset (pauseTime)
      // Play from pauseTime
      this.startTime = this.context.currentTime - this.pauseTime;
      this.sourceNode.start(0, this.pauseTime);
      this.isPlaying = true;
      
      this.sourceNode.onended = () => {
          // Verify if it ended naturally or was stopped
          // If we stopped it manually, isPlaying will be false (set by stop/pause)
          // But here onended fires async.
          // For now, simple logic:
          // If we reach the end, pauseTime should reset? 
          // Let's leave looping/reset logic to the Store/UI for now.
      };
  }

  /**
   * Pauses playback
   */
  pause() {
      if (!this.sourceNode || !this.context) return;
      if (!this.isPlaying) return;

      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
      
      // Calculate where we stopped
      this.pauseTime = this.context.currentTime - this.startTime;
      this.isPlaying = false;
  }

  /**
   * Seeks to a specific time (seconds)
   */
  seek(time: number) {
      if (!this.sourceBuffer) return;
      
      // Clamp time
      time = Math.max(0, Math.min(time, this.sourceBuffer.duration));
      
      const wasPlaying = this.isPlaying;
      if (wasPlaying) {
          this.pause();
      }
      
      this.pauseTime = time;
      
      if (wasPlaying) {
          this.play();
      }
  }

  // Track the IDs of modules currently connected in the signal chain (excluding bypassed)
  private connectedIds: string[] = [];

  /**
   * Rebuilds the audio graph based on the provided rack modules.
   * uses intelligent diffing to minimize audio dropouts.
   */
  rebuildGraph(rack: RackModule[]) {
    if (!this.context || !this.rackInput || !this.rackOutput) return;

    // 1. Identify the desired signal chain (exclude bypassed modules)
    const nextActiveModules = rack.filter(m => !m.bypass);
    const nextIds = nextActiveModules.map(m => m.id);

    // 2. Check for trivial cases or complex changes requiring full rebuild
    // If we have no previous state or complex changes, fall back to full rebuild.
    // Simple heuristic: If difference in length > 1, or multiple mismatches.
    
    // Let's identify the first mismatch
    let firstMismatchIndex = -1;
    const len = Math.max(this.connectedIds.length, nextIds.length);
    for (let i = 0; i < len; i++) {
        if (this.connectedIds[i] !== nextIds[i]) {
            firstMismatchIndex = i;
            break;
        }
    }

    // If no mismatch, just update params (handled by store usually, but we ensure nodes exist)
    if (firstMismatchIndex === -1) {
        // Chains are identical.
        // Ensure all nodes in rack (including bypassed ones) are instantiated/updated
        this.syncParams(rack);
        this.cleanupNodeMap(rack);
        return;
    }

    // Analyze the change
    const prevRemainder = this.connectedIds.slice(firstMismatchIndex);
    const nextRemainder = nextIds.slice(firstMismatchIndex);

    // Case: Insert (One new item)
    // prev: [A, B], next: [A, NEW, B]
    // mismatch at 1. prevRemainder: [B], nextRemainder: [NEW, B]
    if (prevRemainder.length === nextRemainder.length - 1 &&
        prevRemainder.every((id, i) => id === nextRemainder[i+1])) {

        const newNodeId = nextIds[firstMismatchIndex];
        const module = nextActiveModules.find(m => m.id === newNodeId);
        if (module) {
             this.insertNode(module, firstMismatchIndex, nextActiveModules);
             this.syncParams(rack); // Ensure other params are up to date
             this.cleanupNodeMap(rack);
             this.connectedIds = nextIds;
             return;
        }
    }

    // Case: Remove (One item gone)
    // prev: [A, OLD, B], next: [A, B]
    // mismatch at 1. prevRemainder: [OLD, B], nextRemainder: [B]
    if (nextRemainder.length === prevRemainder.length - 1 &&
        nextRemainder.every((id, i) => id === prevRemainder[i+1])) {

        this.removeNode(firstMismatchIndex, this.connectedIds);
        this.syncParams(rack); // Ensure other params are up to date
        this.cleanupNodeMap(rack);
        this.connectedIds = nextIds;
        return;
    }

    // Fallback to full rebuild for anything else (Swap, Move > 1 distance, Multiple adds/removes)
    this.fullRebuildGraph(rack);
  }

  /**
   * Standard "Stop the World" rebuild. Reliable but causes dropouts.
   */
  fullRebuildGraph(rack: RackModule[]) {
    if (!this.context || !this.rackInput || !this.rackOutput) return;

    // 1. Disconnect everything
    this.rackInput.disconnect();
    this.nodeMap.forEach(node => node.disconnect());

    // 2. Cleanup
    this.cleanupNodeMap(rack);

    // 3. Build the Chain
    let previousNode: AudioNode = this.rackInput;
    const activeIds: string[] = [];

    rack.forEach(module => {
        let node = this.getOrCreateNode(module);
        
        // Update params just in case
        this.updateNodeParams(node, module);

        if (!module.bypass) {
            this.connectNodes(previousNode, node);
            previousNode = (node instanceof ConvolutionNode) ? node.output : node;
            activeIds.push(module.id);
        }
    });

    // 4. Connect end of chain to RackOutput
    previousNode.connect(this.rackOutput);
    
    this.connectedIds = activeIds;
  }

  /**
   * Helper to insert a node into the chain at specific index
   */
  private insertNode(module: RackModule, index: number, activeModules: RackModule[]) {
      if (!this.rackInput || !this.rackOutput) return;

      const node = this.getOrCreateNode(module);
      this.updateNodeParams(node, module);

      // Find Previous Node
      let prevNode: AudioNode = this.rackInput;
      if (index > 0) {
          const prevId = activeModules[index - 1].id;
          const prevModuleNode = this.nodeMap.get(prevId);
          if (prevModuleNode) {
              prevNode = (prevModuleNode instanceof ConvolutionNode) ? prevModuleNode.output : prevModuleNode;
          }
      }

      // Find Next Node (currently connected to prevNode)
      let nextNode: AudioNode | AudioParam = this.rackOutput;
      if (index < this.connectedIds.length) {
          const nextId = this.connectedIds[index];
          const nextModuleNode = this.nodeMap.get(nextId);
          if (nextModuleNode) {
              nextNode = (nextModuleNode instanceof ConvolutionNode) ? nextModuleNode.input : nextModuleNode;
          }
      }

      // Perform Patch
      // 1. Disconnect Prev -> Next
      try {
          prevNode.disconnect(nextNode as AudioNode);
      } catch (e) {
          logger.warn("Failed to disconnect specific node", e);
      }

      // 2. Connect Prev -> New -> Next
      this.connectNodes(prevNode, node);

      const newNodeOut = (node instanceof ConvolutionNode) ? node.output : node;
      if (nextNode instanceof AudioNode || (nextNode as any) instanceof AudioParam) {
           newNodeOut.connect(nextNode as AudioNode);
      }
  }

  /**
   * Helper to remove a node from the chain at specific index
   */
  private removeNode(index: number, oldConnectedIds: string[]) {
      if (!this.rackInput || !this.rackOutput) return;

      const idToRemove = oldConnectedIds[index];
      const nodeToRemove = this.nodeMap.get(idToRemove);

      if (!nodeToRemove) return;

      // Find Prev Node
      let prevNode: AudioNode = this.rackInput;
      if (index > 0) {
          const prevId = oldConnectedIds[index - 1];
          const prevModuleNode = this.nodeMap.get(prevId);
          if (prevModuleNode) {
              prevNode = (prevModuleNode instanceof ConvolutionNode) ? prevModuleNode.output : prevModuleNode;
          }
      }

      // Find Next Node
      let nextNode: AudioNode | AudioParam = this.rackOutput;
      if (index + 1 < oldConnectedIds.length) {
          const nextId = oldConnectedIds[index + 1];
          const nextModuleNode = this.nodeMap.get(nextId);
          if (nextModuleNode) {
               nextNode = (nextModuleNode instanceof ConvolutionNode) ? nextModuleNode.input : nextModuleNode;
          }
      }

      // Perform Patch
      // 1. Disconnect Prev -> NodeToRemove
      const nodeToRemoveIn = (nodeToRemove instanceof ConvolutionNode) ? nodeToRemove.input : nodeToRemove;
      try {
          prevNode.disconnect(nodeToRemoveIn as AudioNode);
      } catch (e) {}

      // 2. Disconnect NodeToRemove -> Next
      try {
          nodeToRemove.disconnect();
      } catch (e) {}

      // 3. Connect Prev -> Next
      if (nextNode instanceof AudioNode || (nextNode as any) instanceof AudioParam) {
           prevNode.connect(nextNode as AudioNode);
      }
  }

  private cleanupNodeMap(rack: RackModule[]) {
      const currentIds = new Set(rack.map(m => m.id));
      for (const [id] of this.nodeMap) {
        if (!currentIds.has(id)) {
            this.nodeMap.delete(id);
        }
    }
  }

  private syncParams(rack: RackModule[]) {
      rack.forEach(module => {
          const node = this.nodeMap.get(module.id);
          if (node) {
              this.updateNodeParams(node, module);
          }
      });
  }

  private getOrCreateNode(module: RackModule): AudioNode | ConvolutionNode {
      let node = this.nodeMap.get(module.id);
      if (!node) {
          node = this.createModuleNode(module);
          if (node) {
            this.nodeMap.set(module.id, node);
          } else {
             return this.context!.createGain();
          }
      }
      return node!;
  }

  private connectNodes(source: AudioNode, dest: AudioNode | ConvolutionNode) {
      if (dest instanceof ConvolutionNode) {
          source.connect(dest.input);
      } else {
          source.connect(dest);
      }
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
            case 'SATURATION':
                const satNode = new SaturationNode(this.context);
                this.updateNodeParams(satNode, module);
                return satNode;
            case 'DITHERING':
                const dithNode = new DitheringNode(this.context);
                this.updateNodeParams(dithNode, module);
                return dithNode;
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
      } else if (module.type === 'SATURATION' && node instanceof SaturationNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
      } else if (module.type === 'DITHERING' && node instanceof DitheringNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
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
          } else if (node instanceof SaturationNode) {
              node.setParam(param as any, value);
          } else if (node instanceof DitheringNode) {
              node.setParam(param as any, value);
          }
          // Add logic for other node types here
      }
  }

  /**
   * Renders the current rack state to an offline buffer (WAV export)
   */
  async renderOffline(rack: RackModule[], assets: Record<string, AudioBuffer>): Promise<AudioBuffer | null> {
      if (!this.sourceBuffer) {
          logger.warn("No source buffer loaded. Cannot export.");
          return null;
      }

      // 1. Create Offline Context
      const length = this.sourceBuffer.length;
      const sampleRate = this.sourceBuffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

      // 2. Load Worklets into Offline Context (Crucial!)
      // Note: We need to re-add modules because it's a separate context.
      try {
        await offlineCtx.audioWorklet.addModule(dynamicEqUrl);
        await offlineCtx.audioWorklet.addModule(transientUrl);
        await offlineCtx.audioWorklet.addModule(limiterUrl);
        await offlineCtx.audioWorklet.addModule(midsideUrl);
        await offlineCtx.audioWorklet.addModule(saturationUrl);
        await offlineCtx.audioWorklet.addModule(ditheringUrl);
        // We skip LUFS meter for offline render usually, or add it if we want to measure stats.
      } catch (err) {
          logger.error("Failed to load worklets for offline render", err);
          return null;
      }

      // 3. Rebuild Graph in Offline Context
      const source = offlineCtx.createBufferSource();
      source.buffer = this.sourceBuffer;

      // Create nodes manually since 'createModuleNode' uses 'this.context' (the realtime one).
      // We need a helper or just duplicate logic here for safety.
      // Ideally 'createModuleNode' takes a context arg.
      // Let's refactor createModuleNode to be static or take context.
      // For now, we'll inline the graph building for the offline export to be explicit.
      
      let previousNode: AudioNode = source;

      // Map module IDs to new Offline nodes
      const offlineNodeMap = new Map<string, AudioNode | ConvolutionNode>();

      for (const module of rack) {
          if (module.bypass) continue;

          let node: AudioNode | ConvolutionNode | null = null;

          if (module.type === 'DYNAMIC_EQ') {
              const n = new DynamicEQNode(offlineCtx as unknown as AudioContext); // Cast for TS
              Object.entries(module.parameters).forEach(([k, v]) => n.setParam(k, v));
              node = n;
          } else if (module.type === 'TRANSIENT_SHAPER') {
              const n = new TransientShaperNode(offlineCtx as unknown as AudioContext);
              Object.entries(module.parameters).forEach(([k, v]) => n.setParam(k as any, v));
              node = n;
          } else if (module.type === 'LIMITER') {
              const n = new LimiterNode(offlineCtx as unknown as AudioContext);
              Object.entries(module.parameters).forEach(([k, v]) => n.setParam(k as any, v));
              node = n;
          } else if (module.type === 'MIDSIDE_EQ') {
              const n = new MidSideEQNode(offlineCtx as unknown as AudioContext);
              Object.entries(module.parameters).forEach(([k, v]) => n.setParam(k as any, v));
              node = n;
          } else if (module.type === 'CAB_SIM') {
              const n = new ConvolutionNode(offlineCtx as unknown as AudioContext);
              if (module.parameters.mix !== undefined) n.setMix(module.parameters.mix);
              
              if (module.parameters.irAssetId) {
                  const buffer = assets[module.parameters.irAssetId];
                  if (buffer) {
                      n.setBuffer(buffer);
                  }
              }
              node = n;
          } else if (module.type === 'SATURATION') {
              const n = new SaturationNode(offlineCtx as unknown as AudioContext);
              Object.entries(module.parameters).forEach(([k, v]) => n.setParam(k as any, v));
              node = n;
          } else if (module.type === 'DITHERING') {
              const n = new DitheringNode(offlineCtx as unknown as AudioContext);
              Object.entries(module.parameters).forEach(([k, v]) => n.setParam(k as any, v));
              node = n;
          }
          // Skip Metering for offline

          if (node) {
              if (node instanceof ConvolutionNode) {
                  previousNode.connect(node.input);
                  previousNode = node.output;
              } else {
                  previousNode.connect(node as AudioNode);
                  previousNode = node as AudioNode;
              }
              offlineNodeMap.set(module.id, node);
          }
      }

      previousNode.connect(offlineCtx.destination);

      // 4. Render
      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();
      return renderedBuffer;
  }
}

export const audioEngine = new AudioEngine();