import { logger } from "@/utils/logger";
import { RackModule, useAudioStore, Track } from "@/store/useAudioStore";
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
    IAudioBufferSourceNode,
    IStereoPannerNode,
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

type AnyAudioContext = IAudioContext | IOfflineAudioContext;
type AnyAudioNode = IAudioNode<AnyAudioContext>;

interface TrackNodes {
    source: IAudioBufferSourceNode<AnyAudioContext>;
    gain: IGainNode<AnyAudioContext>;
    pan: IStereoPannerNode<AnyAudioContext>;
    rackInput: IGainNode<AnyAudioContext>;
    nodes: Map<string, AnyAudioNode | ConvolutionNode>;
}

class AudioEngine {
  public context: IAudioContext | null = null;
  public masterGain: IGainNode<IAudioContext> | null = null;
  public analyser: IAnalyserNode<IAudioContext> | null = null;
  public analyserL: IAnalyserNode<IAudioContext> | null = null;
  public analyserR: IAnalyserNode<IAudioContext> | null = null;
  public splitter: IAudioNode<IAudioContext> | null = null;
  
  public masterRackInput: IGainNode<IAudioContext> | null = null;
  private summingBus: IGainNode<IAudioContext> | null = null;

  public startTime: number = 0;
  public pauseTime: number = 0;
  public isPlaying: boolean = false;

  private nodeMap = new Map<string, AnyAudioNode | ConvolutionNode>(); // For master rack
  private trackNodesMap = new Map<string, TrackNodes>();
  private isInitialized = false;

  constructor() {}

  async init() {
    if (this.isInitialized) return;

    try {
      logger.info("Initializing Audio Engine...");
      this.context = new AudioContext();

      const workletPromises = [
        dynamicEqUrl, transientUrl, limiterUrl, midsideUrl,
        lufsUrl, saturationUrl, ditheringUrl
      ].map(url => this.context!.audioWorklet.addModule(url));
      await Promise.all(workletPromises);
      logger.info("AudioWorklet modules loaded successfully.");

      this.masterGain = this.context.createGain();
      this.analyser = this.context.createAnalyser();
      this.splitter = this.context.createChannelSplitter(2);
      this.analyserL = this.context.createAnalyser();
      this.analyserR = this.context.createAnalyser();
      this.summingBus = this.context.createGain();
      this.masterRackInput = this.context.createGain();
      
      this.summingBus.connect(this.masterRackInput);
      this.masterRackInput.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);

      this.masterRackInput.connect(this.splitter);
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

  play(tracks: Track[]) {
      if (!this.context || this.isPlaying) return;

      this.startTime = this.context.currentTime - this.pauseTime;
      this.isPlaying = true;

      tracks.forEach(track => {
          const trackNodes = this.trackNodesMap.get(track.id);
          const buffer = useAudioStore.getState().assets[track.audioAssetId];
          if (trackNodes && buffer) {
              const source = this.context!.createBufferSource();
              source.buffer = buffer;
              source.connect(trackNodes.gain);
              source.start(0, this.pauseTime);
              trackNodes.source = source;
          }
      });
  }

  pause() {
      if (!this.context || !this.isPlaying) return;
      this.pauseTime = this.context.currentTime - this.startTime;
      this.isPlaying = false;
      this.trackNodesMap.forEach(trackNodes => {
          trackNodes.source?.stop();
      });
  }

  seek(time: number, tracks: Track[]) {
      const wasPlaying = this.isPlaying;
      if (wasPlaying) this.pause();
      
      this.pauseTime = time;
      
      if (wasPlaying) this.play(tracks);
  }

  rebuildGraph(masterRack: RackModule[], tracks: Track[], assets: Record<string, AudioBuffer>) {
    if (!this.context || !this.summingBus || !this.masterRackInput) return;

    this.summingBus.disconnect();
    this.summingBus = this.context.createGain(); // Create a new summing bus

    const activeSolo = tracks.some(t => t.solo);

    // 1. Build/Update Track Chains
    tracks.forEach(track => {
        let trackNodes = this.trackNodesMap.get(track.id);
        if (!trackNodes) {
            trackNodes = {
                source: this.context!.createBufferSource(),
                gain: this.context!.createGain(),
                pan: this.context!.createStereoPanner(),
                rackInput: this.context!.createGain(),
                nodes: new Map(),
            };
            this.trackNodesMap.set(track.id, trackNodes);
        }
        
        // Disconnect to re-route
        trackNodes.gain.disconnect();
        trackNodes.gain.connect(trackNodes.pan);
        trackNodes.pan.connect(trackNodes.rackInput);

        // Apply track params
        const isMuted = track.mute || (activeSolo && !track.solo);
        trackNodes.gain.gain.setValueAtTime(isMuted ? 0 : track.volume, this.context.currentTime);
        trackNodes.pan.pan.setValueAtTime(track.pan, this.context.currentTime);

        // Build rack for this track
        this.buildRackChain(track.rack, trackNodes.rackInput, this.summingBus, trackNodes.nodes);

        // Update assets if needed (e.g., for Convolution)
        track.rack.forEach(module => {
            const node = trackNodes!.nodes.get(module.id);
            if (node) this.updateNodeParams(node, module, assets);
        });
    });

    // 2. Build Master Rack Chain
    this.buildRackChain(masterRack, this.masterRackInput, this.analyser!, this.nodeMap);
    masterRack.forEach(module => {
        const node = this.nodeMap.get(module.id);
        if (node) this.updateNodeParams(node, module, assets);
    });

    // Cleanup unused track nodes
    const trackIds = new Set(tracks.map(t => t.id));
    this.trackNodesMap.forEach((_, id) => {
        if (!trackIds.has(id)) this.trackNodesMap.delete(id);
    });
  }

  private buildRackChain(rack: RackModule[], input: AnyAudioNode, output: AnyAudioNode, nodeMap: Map<string, AnyAudioNode | ConvolutionNode>) {
      input.disconnect();
      let previousNode = input;
      rack.forEach(module => {
          let node = nodeMap.get(module.id);
          if (!node) {
              node = this.createModuleNode(module, this.context!);
              if (node) nodeMap.set(module.id, node);
          }
          if (node && !module.bypass) {
              this.connectNodes(previousNode, node);
              previousNode = (node instanceof ConvolutionNode) ? node.output : node;
          }
      });
      previousNode.connect(output);
  }

  private connectNodes(source: AnyAudioNode, dest: AnyAudioNode | ConvolutionNode) {
      if (dest instanceof ConvolutionNode) {
          source.connect(dest.input);
      } else {
          source.connect(dest);
      }
  }

  private createModuleNode(module: RackModule, context: AnyAudioContext, assets?: Record<string, AudioBuffer>): AnyAudioNode | ConvolutionNode | null {
      try {
        switch (module.type) {
            case 'DYNAMIC_EQ': return new DynamicEQNode(context);
            case 'TRANSIENT_SHAPER': return new TransientShaperNode(context);
            case 'LIMITER': return new LimiterNode(context);
            case 'MIDSIDE_EQ': return new MidSideEQNode(context);
            case 'CAB_SIM': return new ConvolutionNode(context);
            case 'LOUDNESS_METER': return new MeteringNode(context);
            case 'SATURATION': return new SaturationNode(context);
            case 'DITHERING': return new DitheringNode(context);
            default: return null;
        }
      } catch (e) {
          logger.error(`Failed to create node for ${module.type}`, e);
          return context.createGain(); // Fallback
      }
  }

  private updateNodeParams(node: AnyAudioNode | ConvolutionNode, module: RackModule, assetsOverride?: Record<string, AudioBuffer>) {
      if (node instanceof DynamicEQNode || node instanceof TransientShaperNode || node instanceof LimiterNode || node instanceof MidSideEQNode || node instanceof SaturationNode || node instanceof DitheringNode) {
          Object.entries(module.parameters).forEach(([key, value]) => {
              node.setParam(key as any, value);
          });
      } else if (node instanceof ConvolutionNode) {
          node.setMix(module.parameters.mix);
          if (module.parameters.irAssetId) {
              const assets = assetsOverride || useAudioStore.getState().assets;
              const buffer = assets[module.parameters.irAssetId];
              if (buffer) node.setBuffer(buffer);
          }
      }
  }

  public getModuleNode(id: string, trackId?: string): AnyAudioNode | ConvolutionNode | undefined {
      if (trackId) {
          return this.trackNodesMap.get(trackId)?.nodes.get(id);
      }
      return this.nodeMap.get(id);
  }

  public updateModuleParam(id: string, param: string, value: any, trackId?: string) {
      const node = this.getModuleNode(id, trackId);
      if (!node) return;

      if (node instanceof DynamicEQNode || node instanceof TransientShaperNode || node instanceof LimiterNode || node instanceof MidSideEQNode || node instanceof SaturationNode || node instanceof DitheringNode) {
         node.setParam(param as any, value);
      } else if (node instanceof ConvolutionNode) {
         if (param === 'mix') node.setMix(value);
         if (param === 'irAssetId') {
             const buffer = useAudioStore.getState().assets[value];
             if (buffer) node.setBuffer(buffer);
         }
      }
  }
}

export const audioEngine = new AudioEngine();
