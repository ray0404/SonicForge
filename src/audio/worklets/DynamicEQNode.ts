import { logger } from "@/utils/logger";

export class DynamicEQNode extends AudioWorkletNode {
  constructor(context: AudioContext) {
    super(context, 'dynamic-eq-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2], // Default to stereo
      parameterData: {
        frequency: 1000,
        Q: 1.0,
        gain: 0,
        threshold: -20,
        ratio: 2,
        attack: 0.01,
        release: 0.1
      }
    });

    this.port.onmessage = (event) => {
      if (event.data.type === 'debug') {
        // We can expose this via an event listener or callback if needed
        // For now, we'll just log it if it's significant, or suppress it to avoid spam
        // logger.debug(`[DynamicEQ] Max GR: ${event.data.gainReduction}`);
      }
    };
  }

  // Helper to set parameters with automation support
  setParam(paramName: string, value: number, timeConstant: number = 0) {
    const param = this.parameters.get(paramName);
    if (!param) {
      logger.warn(`[DynamicEQNode] Parameter '${paramName}' not found.`);
      return;
    }

    if (timeConstant > 0) {
      // Smooth transition
      param.setTargetAtTime(value, this.context.currentTime, timeConstant);
    } else {
      // Instant change
      param.setValueAtTime(value, this.context.currentTime);
    }
  }
}
