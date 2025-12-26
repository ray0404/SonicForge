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
import { ParametricEQNode } from "./worklets/ParametricEQNode";
import { DistortionNode } from "./worklets/DistortionNode";
import { BitCrusherNode } from "./worklets/BitCrusherNode";
import { ChorusNode } from "./worklets/ChorusNode";
import { PhaserNode } from "./worklets/PhaserNode";
import { TremoloNode } from "./worklets/TremoloNode";
import { AutoWahNode } from "./worklets/AutoWahNode";
import { FeedbackDelayNode } from "./worklets/FeedbackDelayNode";
import { CompressorNode } from "./worklets/CompressorNode";
import { DeEsserNode } from "./worklets/DeEsserNode";
import { StereoImagerNode } from "./worklets/StereoImagerNode";
import { MultibandCompressorNode } from "./worklets/MultibandCompressorNode";

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
// @ts-ignore
import parametricEqUrl from './worklets/parametric-eq-processor.js?worker&url';
// @ts-ignore
import distortionUrl from './worklets/distortion-processor.js?worker&url';
// @ts-ignore
import bitcrusherUrl from './worklets/bitcrusher-processor.js?worker&url';
// @ts-ignore
import chorusUrl from './worklets/chorus-processor.js?worker&url';
// @ts-ignore
import phaserUrl from './worklets/phaser-processor.js?worker&url';
// @ts-ignore
import tremoloUrl from './worklets/tremolo-processor.js?worker&url';
// @ts-ignore
import autowahUrl from './worklets/autowah-processor.js?worker&url';
// @ts-ignore
import feedbackDelayUrl from './worklets/feedback-delay-processor.js?worker&url';
// @ts-ignore
import compressorUrl from './worklets/compressor-processor.js?worker&url';
// @ts-ignore
import deesserUrl from './worklets/deesser-processor.js?worker&url';
// @ts-ignore
import stereoImagerUrl from './worklets/stereo-imager-processor.js?worker&url';
// @ts-ignore
import multibandCompressorUrl from './worklets/multiband-compressor-processor.js?worker&url';

class AudioEngine {
  public context: IAudioContext | null = null;
  public masterGain: IGainNode<IAudioContext> | null = null;
  public analyser: IAnalyserNode<IAudioContext> | null = null;
  public analyserL: IAnalyserNode<IAudioContext> | null = null;
  public analyserR: IAnalyserNode<IAudioContext> | null = null;
  public splitter: IAudioNode<IAudioContext> | null = null;
  
  public rackInput: IGainNode<IAudioContext> | null = null;
  public rackOutput: IGainNode<IAudioContext> | null = null;
  
  public sourceBuffer: AudioBuffer | null = null;
  public sourceNode: IAudioBufferSourceNode<IAudioContext> | null = null;
  public startTime: number = 0;
  public pauseTime: number = 0;
  public isPlaying: boolean = false;

  private nodeMap = new Map<string, IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode>();
  private isInitialized = false;
  private connectedIds: string[] = [];

  constructor() {}

  async init() {
    if (this.isInitialized) return;

    try {
      logger.info("Initializing Audio Engine...");
      this.context = new AudioContext();

      logger.info(`Loading AudioWorklet modules...`);
      if (this.context.audioWorklet) {
          try {
            await Promise.all([
                this.context.audioWorklet.addModule(dynamicEqUrl),
                this.context.audioWorklet.addModule(transientUrl),
                this.context.audioWorklet.addModule(limiterUrl),
                this.context.audioWorklet.addModule(midsideUrl),
                this.context.audioWorklet.addModule(lufsUrl),
                this.context.audioWorklet.addModule(saturationUrl),
                this.context.audioWorklet.addModule(ditheringUrl),
                this.context.audioWorklet.addModule(parametricEqUrl),
                this.context.audioWorklet.addModule(distortionUrl),
                this.context.audioWorklet.addModule(bitcrusherUrl),
                this.context.audioWorklet.addModule(chorusUrl),
                this.context.audioWorklet.addModule(phaserUrl),
                this.context.audioWorklet.addModule(tremoloUrl),
                this.context.audioWorklet.addModule(autowahUrl),
                this.context.audioWorklet.addModule(feedbackDelayUrl),
                this.context.audioWorklet.addModule(compressorUrl),
                this.context.audioWorklet.addModule(deesserUrl),
                this.context.audioWorklet.addModule(stereoImagerUrl),
                this.context.audioWorklet.addModule(multibandCompressorUrl)
            ]);
            logger.info("AudioWorklet modules loaded successfully.");
          } catch (err) {
            logger.error(`Failed to load AudioWorklet modules`, err);
            throw err;
          }
      }

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

      this.rackInput.connect(this.rackOutput);
      
      this.rackOutput.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

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

  async loadSource(file: File): Promise<AudioBuffer> {
      if (!this.context) throw new Error("Audio Context not initialized");
      const arrayBuffer = await file.arrayBuffer();
      this.sourceBuffer = await this.context.decodeAudioData(arrayBuffer);
      return this.sourceBuffer;
  }

  play() {
      if (!this.context || !this.sourceBuffer || !this.rackInput) return;
      if (this.isPlaying) return;

      this.sourceNode = this.context.createBufferSource();
      this.sourceNode.buffer = this.sourceBuffer;
      this.sourceNode.connect(this.rackInput);

      this.startTime = this.context.currentTime - this.pauseTime;
      this.sourceNode.start(0, this.pauseTime);
      this.isPlaying = true;
  }

  pause() {
      if (!this.sourceNode || !this.context) return;
      if (!this.isPlaying) return;

      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
      
      this.pauseTime = this.context.currentTime - this.startTime;
      this.isPlaying = false;
  }

  seek(time: number) {
      if (!this.sourceBuffer) return;
      time = Math.max(0, Math.min(time, this.sourceBuffer.duration));
      
      const wasPlaying = this.isPlaying;
      if (wasPlaying) this.pause();
      this.pauseTime = time;
      if (wasPlaying) this.play();
  }

  rebuildGraph(rack: RackModule[]) {
    if (!this.context || !this.rackInput || !this.rackOutput) return;

    const nextActiveModules = rack.filter(m => !m.bypass);
    const nextIds = nextActiveModules.map(m => m.id);

    // 1. Find the first point of difference in the ACTIVE signal chain
    let firstMismatchIndex = -1;
    const len = Math.max(this.connectedIds.length, nextIds.length);
    for (let i = 0; i < len; i++) {
        if (this.connectedIds[i] !== nextIds[i]) {
            firstMismatchIndex = i;
            break;
        }
    }

    // 2. If no structural changes in active nodes, just sync params and cleanup
    if (firstMismatchIndex === -1) {
        this.syncParams(rack);
        this.cleanupNodeMap(rack);
        return;
    }

    // 3. Partial Rebuild: Only reconnect from the point of failure
    this.partialRebuildGraph(rack, firstMismatchIndex);
  }

  private partialRebuildGraph(rack: RackModule[], startIndex: number) {
    if (!this.context || !this.rackInput || !this.rackOutput) return;

    // Disconnect everything from the first mismatch onwards
    // connectedIds stores IDs of nodes currently in the chain (not bypassed)
    
    // Find the node that preceded the first mismatch
    let previousNode: IAudioNode<IAudioContext>;
    if (startIndex === 0) {
        previousNode = this.rackInput;
        this.rackInput.disconnect();
    } else {
        const prevId = this.connectedIds[startIndex - 1];
        const prevNode = this.nodeMap.get(prevId);
        if (!prevNode) {
            // Should not happen, but fallback to full
            return this.fullRebuildGraph(rack);
        }
        previousNode = (prevNode instanceof ConvolutionNode) 
            ? prevNode.output as unknown as IAudioNode<IAudioContext>
            : prevNode as unknown as IAudioNode<IAudioContext>;
        previousNode.disconnect();
    }

    // Disconnect all subsequent nodes in the OLD chain
    for (let i = startIndex; i < this.connectedIds.length; i++) {
        const node = this.nodeMap.get(this.connectedIds[i]);
        if (node) node.disconnect();
    }

    // Cleanup nodes that are no longer in the rack at all
    this.cleanupNodeMap(rack);

    // Reconstruct the chain from the mismatch point
    const activeIds = this.connectedIds.slice(0, startIndex);
    
    // We need to iterate through the FULL rack to find where we are in the sequence
    // But we only care about nodes that appear AFTER the last 'stable' node
    
    let foundStart = (startIndex === 0);
    const lastStableId = startIndex > 0 ? this.connectedIds[startIndex - 1] : null;

    rack.forEach(module => {
        if (!foundStart) {
            if (module.id === lastStableId) foundStart = true;
            return;
        }

        const node = this.getOrCreateNode(module);
        this.updateNodeParams(node, module);

        if (!module.bypass) {
            this.connectNodes(previousNode, node);
            previousNode = (node instanceof ConvolutionNode) 
                ? node.output as unknown as IAudioNode<IAudioContext> 
                : node as unknown as IAudioNode<IAudioContext>;
            activeIds.push(module.id);
        }
    });

    // Final connection to output
    previousNode.connect(this.rackOutput);
    this.connectedIds = activeIds;
  }

  fullRebuildGraph(rack: RackModule[]) {
    if (!this.context || !this.rackInput || !this.rackOutput) return;

    this.rackInput.disconnect();
    this.nodeMap.forEach(node => node.disconnect());
    this.cleanupNodeMap(rack);

    let previousNode: IAudioNode<IAudioContext> = this.rackInput;
    const activeIds: string[] = [];

    rack.forEach(module => {
        let node = this.getOrCreateNode(module);
        // Note: Params are updated inside getOrCreateNode via createModuleNode,
        // but we can call it again to be sure if reusing nodes.
        // Actually getOrCreateNode only calls createModuleNode if NEW.
        // If existing node, we MUST update params here.
        this.updateNodeParams(node, module);

        if (!module.bypass) {
            this.connectNodes(previousNode, node);
            previousNode = (node instanceof ConvolutionNode) 
                ? node.output as unknown as IAudioNode<IAudioContext> 
                : node as unknown as IAudioNode<IAudioContext>;
            activeIds.push(module.id);
        }
    });

    previousNode.connect(this.rackOutput);
    this.connectedIds = activeIds;
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

  private getOrCreateNode(module: RackModule): IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode {
      let node: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | undefined | null = this.nodeMap.get(module.id);
      if (!node) {
          node = this.createModuleNode(module, this.context!);
          if (node) {
            this.nodeMap.set(module.id, node);
          } else {
             return this.context!.createGain();
          }
      }
      return node!;
  }

  private connectNodes(source: IAudioNode<IAudioContext>, dest: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode) {
      if (dest instanceof ConvolutionNode) {
          source.connect(dest.input as unknown as IAudioNode<IAudioContext>);
      } else {
          source.connect(dest as unknown as IAudioNode<IAudioContext>);
      }
  }

  private createModuleNode(module: RackModule, context: IAudioContext | IOfflineAudioContext, assets?: Record<string, AudioBuffer>): IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | null {
      try {
        let node: any = null;
        switch (module.type) {
            case 'DYNAMIC_EQ': node = new DynamicEQNode(context); break;
            case 'TRANSIENT_SHAPER': node = new TransientShaperNode(context); break;
            case 'LIMITER': node = new LimiterNode(context); break;
            case 'MIDSIDE_EQ': node = new MidSideEQNode(context); break;
            case 'CAB_SIM': node = new ConvolutionNode(context); break;
            case 'LOUDNESS_METER': node = new MeteringNode(context); break;
            case 'SATURATION': node = new SaturationNode(context); break;
            case 'DITHERING': node = new DitheringNode(context); break;
            case 'PARAMETRIC_EQ': node = new ParametricEQNode(context); break;
            case 'DISTORTION': node = new DistortionNode(context); break;
            case 'BITCRUSHER': node = new BitCrusherNode(context); break;
            case 'CHORUS': node = new ChorusNode(context); break;
            case 'PHASER': node = new PhaserNode(context); break;
            case 'TREMOLO': node = new TremoloNode(context); break;
            case 'AUTOWAH': node = new AutoWahNode(context); break;
            case 'FEEDBACK_DELAY': node = new FeedbackDelayNode(context); break;
            case 'COMPRESSOR': node = new CompressorNode(context); break;
            case 'DE_ESSER': node = new DeEsserNode(context); break;
            case 'STEREO_IMAGER': node = new StereoImagerNode(context); break;
            case 'MULTIBAND_COMPRESSOR': node = new MultibandCompressorNode(context); break;
            default: return null;
        }
        
        if (node) {
            this.updateNodeParams(node, module, assets);
        }
        return node;
      } catch (e) {
          logger.error(`Failed to create node for ${module.type}`, e);
          return context.createGain(); 
      }
  }

  private updateNodeParams(node: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode, module: RackModule, assetsOverride?: Record<string, AudioBuffer>) {
      if (node instanceof ConvolutionNode) {
          if (module.parameters.mix !== undefined) node.setMix(module.parameters.mix);
          if (module.parameters.irAssetId) {
              const assets = assetsOverride || useAudioStore.getState().assets;
              const buffer = assets[module.parameters.irAssetId];
              if (buffer) node.setBuffer(buffer);
          }
      } else {
          const n = node as any;
          if (typeof n.setParam === 'function') {
              Object.entries(module.parameters).forEach(([key, value]) => {
                  n.setParam(key, value);
              });
          }
      }
  }

  public getModuleNode(id: string): IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | undefined {
      return this.nodeMap.get(id);
  }

  public updateModuleParam(id: string, param: string, value: any) {
      const node = this.nodeMap.get(id);
      if (node) {
          if (node instanceof ConvolutionNode) {
              if (param === 'mix') node.setMix(value);
              if (param === 'irAssetId') {
                  const assets = useAudioStore.getState().assets;
                  const buffer = assets[value];
                  if (buffer) node.setBuffer(buffer);
              }
          } else {
             const n = node as any;
             if (typeof n.setParam === 'function') {
                 n.setParam(param, value);
             }
          }
      }
  }

  async renderOffline(rack: RackModule[], assets: Record<string, AudioBuffer>): Promise<AudioBuffer | null> {
      if (!this.sourceBuffer) return null;

      const length = this.sourceBuffer.length;
      const sampleRate = this.sourceBuffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

      try {
        if (offlineCtx.audioWorklet) {
            await Promise.all([
                offlineCtx.audioWorklet.addModule(dynamicEqUrl),
                offlineCtx.audioWorklet.addModule(transientUrl),
                offlineCtx.audioWorklet.addModule(limiterUrl),
                offlineCtx.audioWorklet.addModule(midsideUrl),
                offlineCtx.audioWorklet.addModule(saturationUrl),
                offlineCtx.audioWorklet.addModule(ditheringUrl),
                offlineCtx.audioWorklet.addModule(parametricEqUrl),
                offlineCtx.audioWorklet.addModule(distortionUrl),
                offlineCtx.audioWorklet.addModule(bitcrusherUrl),
                offlineCtx.audioWorklet.addModule(chorusUrl),
                offlineCtx.audioWorklet.addModule(phaserUrl),
                offlineCtx.audioWorklet.addModule(tremoloUrl),
                offlineCtx.audioWorklet.addModule(autowahUrl),
                offlineCtx.audioWorklet.addModule(feedbackDelayUrl),
                offlineCtx.audioWorklet.addModule(compressorUrl),
                offlineCtx.audioWorklet.addModule(deesserUrl),
                offlineCtx.audioWorklet.addModule(stereoImagerUrl),
                offlineCtx.audioWorklet.addModule(multibandCompressorUrl)
            ]);
        }
      } catch (err) {
          logger.error("Failed to load worklets for offline render", err);
          return null;
      }

      const source = offlineCtx.createBufferSource();
      source.buffer = this.sourceBuffer;
      
      let previousNode: IAudioNode<IOfflineAudioContext> = source;

      for (const module of rack) {
          if (module.bypass) continue;
          const node = this.createModuleNode(module, offlineCtx, assets);
          if (node) {
              if (node instanceof ConvolutionNode) {
                  previousNode.connect(node.input as unknown as IAudioNode<IOfflineAudioContext>);
                  previousNode = node.output as unknown as IAudioNode<IOfflineAudioContext>;
              } else {
                  const offlineNode = node as unknown as IAudioNode<IOfflineAudioContext>;
                  previousNode.connect(offlineNode);
                  previousNode = offlineNode;
              }
          }
      }
      previousNode.connect(offlineCtx.destination);
      source.start(0);
      return await offlineCtx.startRendering();
  }
}

export const audioEngine = new AudioEngine();