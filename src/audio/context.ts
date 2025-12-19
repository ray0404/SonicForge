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
import {
    AudioContext,
    OfflineAudioContext,
    IAudioContext,
    IOfflineAudioContext,
    IGainNode,
    IAnalyserNode,
    IAudioNode,
    IAudioBufferSourceNode
} from "standardized-audio-context";

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
class AudioEngine {
  public context: IAudioContext | null = null;
  public masterGain: IGainNode<IAudioContext> | null = null;
  public analyser: IAnalyserNode<IAudioContext> | null = null;
  public analyserL: IAnalyserNode<IAudioContext> | null = null;
  public analyserR: IAnalyserNode<IAudioContext> | null = null;
  public splitter: IAudioNode<IAudioContext> | null = null;
  
  // Rack Routing
  public rackInput: IGainNode<IAudioContext> | null = null;
  public rackOutput: IGainNode<IAudioContext> | null = null;
  
  // Source Management
  public sourceBuffer: AudioBuffer | null = null;
  public sourceNode: IAudioBufferSourceNode<IAudioContext> | null = null;
  public startTime: number = 0;
  public pauseTime: number = 0;
  public isPlaying: boolean = false;

  // The 'nodeMap' maps module.id -> AudioNode | ConvolutionNode
  // ConvolutionNode is our custom wrapper.
  // We use IAudioNode<IAudioContext | IOfflineAudioContext> to cover both cases roughly,
  // but strictly speaking ConvolutionNode is separate.
  private nodeMap = new Map<string, IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode>();
  private isInitialized = false;

  constructor() {
    // Lazy initialization handled in init()
  }

  async init() {
    if (this.isInitialized) return;

    try {
      logger.info("Initializing Audio Engine...");
      this.context = new AudioContext();

      // 1. Load AudioWorklet
      logger.info(`Loading AudioWorklet modules...`);
      if (this.context.audioWorklet) {
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
      } else {
          logger.error("AudioWorklet not supported in this context.");
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
      // standard-audio-context decodeAudioData is compatible
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
    let previousNode: IAudioNode<IAudioContext> | IGainNode<IAudioContext> = this.rackInput;

    rack.forEach(module => {
        let node: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | undefined | null = this.nodeMap.get(module.id);
        
        if (!node) {
            // Instantiate new node if missing
            node = this.createModuleNode(module, this.context!);
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
                    previousNode.connect(node.input as unknown as IAudioNode<IAudioContext>);
                    previousNode = node.output as unknown as IGainNode<IAudioContext>;
                } else {
                    // node is IAudioNode<IAudioContext | IOfflineAudioContext>.
                    // previousNode is IAudioNode<IAudioContext>.
                    // Casting to specific IAudioNode<IAudioContext> is safe because we are in rebuildGraph (realtime).
                    const realtimeNode = node as unknown as IAudioNode<IAudioContext>;
                    previousNode.connect(realtimeNode);
                    previousNode = realtimeNode;
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
  private createModuleNode(module: RackModule, context: IAudioContext | IOfflineAudioContext, assets?: Record<string, AudioBuffer>): IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | null {
      try {
        switch (module.type) {
            case 'DYNAMIC_EQ':
                const deqNode = new DynamicEQNode(context);
                this.updateNodeParams(deqNode, module, assets);
                return deqNode;
            case 'TRANSIENT_SHAPER':
                 const tsNode = new TransientShaperNode(context);
                 this.updateNodeParams(tsNode, module, assets);
                 return tsNode;
            case 'LIMITER':
                 const limiterNode = new LimiterNode(context);
                 this.updateNodeParams(limiterNode, module, assets);
                 return limiterNode;
            case 'MIDSIDE_EQ':
                 const msNode = new MidSideEQNode(context);
                 this.updateNodeParams(msNode, module, assets);
                 return msNode;
            case 'CAB_SIM':
                const cabNode = new ConvolutionNode(context);
                this.updateNodeParams(cabNode, module, assets);
                return cabNode;
            case 'LOUDNESS_METER':
                return new MeteringNode(context);
            case 'SATURATION':
                const satNode = new SaturationNode(context);
                this.updateNodeParams(satNode, module, assets);
                return satNode;
            case 'DITHERING':
                const dithNode = new DitheringNode(context);
                this.updateNodeParams(dithNode, module, assets);
                return dithNode;
            default:
                return null;
        }
      } catch (e) {
          logger.error(`Failed to create node for ${module.type}`, e);
          return context.createGain(); // Fallback
      }
  }

  private updateNodeParams(node: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode, module: RackModule, assetsOverride?: Record<string, AudioBuffer>) {
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
              const assets = assetsOverride || useAudioStore.getState().assets;
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
        if (offlineCtx.audioWorklet) {
            await offlineCtx.audioWorklet.addModule(dynamicEqUrl);
            await offlineCtx.audioWorklet.addModule(transientUrl);
            await offlineCtx.audioWorklet.addModule(limiterUrl);
            await offlineCtx.audioWorklet.addModule(midsideUrl);
            await offlineCtx.audioWorklet.addModule(saturationUrl);
            await offlineCtx.audioWorklet.addModule(ditheringUrl);
            // We skip LUFS meter for offline render usually, or add it if we want to measure stats.
        }
      } catch (err) {
          logger.error("Failed to load worklets for offline render", err);
          return null;
      }

      // 3. Rebuild Graph in Offline Context
      const source = offlineCtx.createBufferSource();
      source.buffer = this.sourceBuffer;
      
      let previousNode: IAudioNode<IOfflineAudioContext> = source;

      // Map module IDs to new Offline nodes
      const offlineNodeMap = new Map<string, IAudioNode<IOfflineAudioContext> | ConvolutionNode>();

      for (const module of rack) {
          if (module.bypass) continue;

          // Pass 'assets' so updateNodeParams uses them instead of store
          const node = this.createModuleNode(module, offlineCtx, assets);

          if (node) {
              if (node instanceof ConvolutionNode) {
                  // ConvolutionNode handles both contexts
                  previousNode.connect(node.input as unknown as IAudioNode<IOfflineAudioContext>);
                  previousNode = node.output as unknown as IAudioNode<IOfflineAudioContext>;
              } else {
                  // Node is IAudioNode<IAudioContext | IOfflineAudioContext>
                  // We need to connect previousNode (IOffline) to it.
                  const offlineNode = node as unknown as IAudioNode<IOfflineAudioContext>;
                  previousNode.connect(offlineNode);
                  previousNode = offlineNode;
              }
              // Cast node to fit offlineNodeMap expectation (it works because we know it's offline context)
              offlineNodeMap.set(module.id, node as unknown as IAudioNode<IOfflineAudioContext> | ConvolutionNode);
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
