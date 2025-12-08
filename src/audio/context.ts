import { logger } from "@/utils/logger";
import { SonicGainNode } from "./worklets/node";
// @ts-ignore
import processorUrl from './worklets/processor.js?worker&url';

/**
 * Singleton AudioContext Manager.
 * Handles the lifecycle of the AudioContext, loading Worklets, and routing.
 */
class AudioEngine {
  public context: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public workletNode: SonicGainNode | null = null;
  public analyser: AnalyserNode | null = null;

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
      // We use the Vite worker import URL we defined at the top
      logger.info("Loading AudioWorklet module...");
      logger.info(`Processor URL: ${processorUrl}`);
      try {
        await this.context.audioWorklet.addModule(processorUrl);
        logger.info("AudioWorklet module loaded successfully.");
      } catch (err) {
        logger.error(`Failed to load AudioWorklet module from ${processorUrl}`, err);
        throw err;
      }

      // 2. Create Nodes
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 1.0;

      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;

      this.workletNode = new SonicGainNode(this.context);

      // 3. Simple Routing for Demo: Oscillator -> Worklet -> Analyser -> Master -> Destination
      // Note: We'll create the oscillator on 'play' to allow stopping/starting

      // Connect Master chain
      this.workletNode.connect(this.analyser);
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
   * For testing: Plays a simple test tone through the worklet
   */
  playTestTone() {
    if (!this.context || !this.workletNode) return;

    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.context.currentTime);

    // Connect osc to our custom worklet
    osc.connect(this.workletNode);

    osc.start();
    osc.stop(this.context.currentTime + 2); // Play for 2 seconds
    logger.info("Playing test tone...");
  }
}

export const audioEngine = new AudioEngine();
