import { AudioContext, IAudioContext, IOfflineAudioContext } from "standardized-audio-context";
import { logger } from "@/utils/logger";

// @ts-ignore
import dynamicEqUrl from '../worklets/dynamic-eq-processor.js?worker&url';
// @ts-ignore
import transientUrl from '../worklets/transient-processor.js?worker&url';
// @ts-ignore
import limiterUrl from '../worklets/limiter-processor.js?worker&url';
// @ts-ignore
import midsideUrl from '../worklets/midside-eq-processor.js?worker&url';
// @ts-ignore
import lufsUrl from '../worklets/lufs-processor.js?worker&url';
// @ts-ignore
import saturationUrl from '../worklets/saturation-processor.js?worker&url';
// @ts-ignore
import ditheringUrl from '../worklets/dithering-processor.js?worker&url';
// @ts-ignore
import parametricEqUrl from '../worklets/parametric-eq-processor.js?worker&url';
// @ts-ignore
import distortionUrl from '../worklets/distortion-processor.js?worker&url';
// @ts-ignore
import bitcrusherUrl from '../worklets/bitcrusher-processor.js?worker&url';
// @ts-ignore
import chorusUrl from '../worklets/chorus-processor.js?worker&url';
// @ts-ignore
import phaserUrl from '../worklets/phaser-processor.js?worker&url';
// @ts-ignore
import tremoloUrl from '../worklets/tremolo-processor.js?worker&url';
// @ts-ignore
import autowahUrl from '../worklets/autowah-processor.js?worker&url';
// @ts-ignore
import feedbackDelayUrl from '../worklets/feedback-delay-processor.js?worker&url';
// @ts-ignore
import compressorUrl from '../worklets/compressor-processor.js?worker&url';
// @ts-ignore
import deesserUrl from '../worklets/deesser-processor.js?worker&url';
// @ts-ignore
import stereoImagerUrl from '../worklets/stereo-imager-processor.js?worker&url';
// @ts-ignore
import multibandCompressorUrl from '../worklets/multiband-compressor-processor.js?worker&url';

export class ContextManager {
  private static _context: IAudioContext | null = null;
  private static initPromise: Promise<void> | null = null;

  static get context(): IAudioContext {
      if (!this._context) {
          throw new Error("ContextManager not initialized. Call init() first.");
      }
      return this._context;
  }

  static async init(): Promise<void> {
      if (this.initPromise) return this.initPromise;

      this.initPromise = (async () => {
          logger.info("Initializing Audio Context...");
          this._context = new AudioContext();
          await this.loadWorklets(this._context);
          logger.info("Audio Engine Initialized Successfully.");
      })();

      return this.initPromise;
  }

  static async loadWorklets(ctx: IAudioContext | IOfflineAudioContext) {
      if (ctx.audioWorklet) {
          try {
            await Promise.all([
                ctx.audioWorklet.addModule(dynamicEqUrl),
                ctx.audioWorklet.addModule(transientUrl),
                ctx.audioWorklet.addModule(limiterUrl),
                ctx.audioWorklet.addModule(midsideUrl),
                ctx.audioWorklet.addModule(lufsUrl),
                ctx.audioWorklet.addModule(saturationUrl),
                ctx.audioWorklet.addModule(ditheringUrl),
                ctx.audioWorklet.addModule(parametricEqUrl),
                ctx.audioWorklet.addModule(distortionUrl),
                ctx.audioWorklet.addModule(bitcrusherUrl),
                ctx.audioWorklet.addModule(chorusUrl),
                ctx.audioWorklet.addModule(phaserUrl),
                ctx.audioWorklet.addModule(tremoloUrl),
                ctx.audioWorklet.addModule(autowahUrl),
                ctx.audioWorklet.addModule(feedbackDelayUrl),
                ctx.audioWorklet.addModule(compressorUrl),
                ctx.audioWorklet.addModule(deesserUrl),
                ctx.audioWorklet.addModule(stereoImagerUrl),
                ctx.audioWorklet.addModule(multibandCompressorUrl)
            ]);
            logger.info("AudioWorklet modules loaded successfully.");
          } catch (err) {
            logger.error(`Failed to load AudioWorklet modules`, err);
            throw err;
          }
      }
  }

  static resume() {
    if (this._context?.state === 'suspended') {
      this._context.resume();
    }
  }
}
