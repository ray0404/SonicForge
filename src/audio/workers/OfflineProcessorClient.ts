/**
 * Client-side bridge for the Offline Processor Worker.
 */

// @ts-ignore - Vite worker import
import ProcessorWorker from './offline-processor.worker?worker';

export type ProcessType = 'NORMALIZE' | 'DC_OFFSET' | 'STRIP_SILENCE' | 'ANALYZE_LUFS';

export interface ProcessResult {
  leftChannel: Float32Array;
  rightChannel: Float32Array;
  metadata?: any;
}

export class OfflineProcessorClient {
  private worker: Worker;
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    this.worker = new ProcessorWorker();
    this.worker.onmessage = (event) => this.handleMessage(event);
  }

  private handleMessage(event: MessageEvent) {
    const { id, success, payload, error } = event.data;
    const request = this.pendingRequests.get(id);

    if (request) {
      if (success) {
        request.resolve(payload);
      } else {
        request.reject(new Error(error));
      }
      this.pendingRequests.delete(id);
    }
  }

  async process(
    type: ProcessType,
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number,
    params?: any
  ): Promise<ProcessResult> {
    const id = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Transfer the buffers to the worker to avoid copying large data
      this.worker.postMessage({
        id,
        type,
        payload: {
          leftChannel,
          rightChannel,
          sampleRate,
          params
        }
      }, [leftChannel.buffer, rightChannel.buffer]);
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

// Singleton instance
export const offlineProcessor = new OfflineProcessorClient();
