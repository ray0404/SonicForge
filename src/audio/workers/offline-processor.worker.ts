/**
 * Sonic Forge - Offline Audio Processor Worker
 * Handles heavy DSP tasks in a background thread.
 */

interface ProcessorMessage {
  id: string;
  type: 'NORMALIZE' | 'DC_OFFSET' | 'STRIP_SILENCE' | 'ANALYZE_LUFS' | 'DENOISE';
  payload: {
    leftChannel: Float32Array;
    rightChannel: Float32Array;
    sampleRate: number;
    params?: any;
  };
}

self.onmessage = (event: MessageEvent<ProcessorMessage>) => {
  const { id, type, payload } = event.data;
  const { leftChannel, rightChannel, sampleRate, params } = payload;

  try {
    let result: { left: Float32Array; right: Float32Array; metadata?: any };

    switch (type) {
      case 'NORMALIZE':
        result = processNormalize(leftChannel, rightChannel, params?.target || -0.1);
        break;
      case 'DC_OFFSET':
        result = processDCOffset(leftChannel, rightChannel);
        break;
      case 'STRIP_SILENCE':
        result = processStripSilence(leftChannel, rightChannel, sampleRate, params?.threshold || -60, params?.minDuration || 0.1);
        break;
      case 'DENOISE':
        result = processDenoise(leftChannel, rightChannel, sampleRate);
        break;
      default:
        throw new Error(`Unknown process type: ${type}`);
    }

    // Return the result and transfer the buffers back
    self.postMessage({
      id,
      success: true,
      payload: {
        leftChannel: result.left,
        rightChannel: result.right,
        metadata: result.metadata
      }
    }, [result.left.buffer, result.right.buffer] as any);

  } catch (error: any) {
    self.postMessage({
      id,
      success: false,
      error: error.message
    });
  }
};

/**
 * Normalization Algorithm
 */
function processNormalize(left: Float32Array, right: Float32Array, targetDb: number) {
  let maxPeak = 0;

  // Find peak across both channels
  for (let i = 0; i < left.length; i++) {
    const absL = Math.abs(left[i]);
    const absR = Math.abs(right[i]);
    if (absL > maxPeak) maxPeak = absL;
    if (absR > maxPeak) maxPeak = absR;
  }

  if (maxPeak === 0) return { left, right };

  const targetLinear = Math.pow(10, targetDb / 20);
  const gain = targetLinear / maxPeak;

  // Apply gain
  for (let i = 0; i < left.length; i++) {
    left[i] *= gain;
    right[i] *= gain;
  }

  return { 
    left, 
    right, 
    metadata: { peakBefore: 20 * Math.log10(maxPeak), gainApplied: 20 * Math.log10(gain) } 
  };
}

/**
 * DC Offset Removal
 */
function processDCOffset(left: Float32Array, right: Float32Array) {
  let sumL = 0;
  let sumR = 0;

  for (let i = 0; i < left.length; i++) {
    sumL += left[i];
    sumR += right[i];
  }

  const offsetL = sumL / left.length;
  const offsetR = sumR / right.length;

  for (let i = 0; i < left.length; i++) {
    left[i] -= offsetL;
    right[i] -= offsetR;
  }

  return { 
    left, 
    right, 
    metadata: { offsetL, offsetR } 
  };
}

/**
 * Strip Silence (Simple Gate)
 */
function processStripSilence(left: Float32Array, right: Float32Array, sampleRate: number, thresholdDb: number, minDurationSec: number) {
  const threshold = Math.pow(10, thresholdDb / 20);
  const minSamples = minDurationSec * sampleRate;
  
  // Create a mask where 1 = keep, 0 = silence
  const mask = new Float32Array(left.length).fill(1);
  let silenceStart = -1;

  for (let i = 0; i < left.length; i++) {
    const amp = (Math.abs(left[i]) + Math.abs(right[i])) / 2;
    
    if (amp < threshold) {
      if (silenceStart === -1) silenceStart = i;
    } else {
      if (silenceStart !== -1) {
        // End of silence
        const duration = i - silenceStart;
        if (duration > minSamples) {
          // It was long enough, mark as silence
          for (let j = silenceStart; j < i; j++) mask[j] = 0;
        }
        silenceStart = -1;
      }
    }
  }

  // Handle trailing silence
  if (silenceStart !== -1) {
    const duration = left.length - silenceStart;
    if (duration > minSamples) {
      for (let j = silenceStart; j < left.length; j++) mask[j] = 0;
    }
  }

  // Apply mask
  for (let i = 0; i < left.length; i++) {
    left[i] *= mask[i];
    right[i] *= mask[i];
  }

  return {
    left,
    right,
    metadata: { thresholdDb }
  };
}

/**
 * Smart Denoise (Rumble + Hiss Filter)
 */
function processDenoise(left: Float32Array, right: Float32Array, sampleRate: number) {
  // 1. Remove Rumble: High-Pass @ 80Hz, Q=0.707
  const hpFilter = createBiQuadFilter('highpass', 80, sampleRate, 0.707);
  
  // 2. Remove Ultra-High Hiss: Low-Pass @ 18000Hz, Q=0.707
  const lpFilter = createBiQuadFilter('lowpass', 18000, sampleRate, 0.707);

  // Apply filters in series
  applyFilter(left, hpFilter);
  applyFilter(right, hpFilter);
  
  // Reset state for next filter (or create new ones)
  // Simple apply implementation resets internal state, so we can re-use logic but need new coefficients
  // Actually, we can just process buffer in place twice.
  
  applyFilter(left, lpFilter);
  applyFilter(right, lpFilter);

  return { left, right };
}

// --- Filter Utils ---

interface BiQuadCoeffs {
  a0: number; a1: number; a2: number;
  b0: number; b1: number; b2: number;
}

function createBiQuadFilter(type: 'lowpass' | 'highpass', freq: number, sampleRate: number, q: number): BiQuadCoeffs {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const cosW0 = Math.cos(w0);

  let b0 = 0, b1 = 0, b2 = 0, a0 = 0, a1 = 0, a2 = 0;

  if (type === 'lowpass') {
    b0 = (1 - cosW0) / 2;
    b1 = 1 - cosW0;
    b2 = (1 - cosW0) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosW0;
    a2 = 1 - alpha;
  } else if (type === 'highpass') {
    b0 = (1 + cosW0) / 2;
    b1 = -(1 + cosW0);
    b2 = (1 + cosW0) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosW0;
    a2 = 1 - alpha;
  }

  return { a0, a1, a2, b0, b1, b2 };
}

function applyFilter(data: Float32Array, coeffs: BiQuadCoeffs) {
  const { b0, b1, b2, a0, a1, a2 } = coeffs;
  
  // Normalize by a0
  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    const y = nb0 * x + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    
    data[i] = y;
    
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
}
