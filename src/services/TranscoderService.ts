import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { logger } from '../utils/logger';

export type ExportFormat = 'wav' | 'mp3' | 'aac' | 'flac';

export interface ExportSettings {
    format: ExportFormat;
    bitDepth: 16 | 24 | 32; // For WAV/FLAC
    kbps: 128 | 192 | 256 | 320; // For MP3/AAC
    sampleRate: 44100 | 48000 | 88200 | 96000;
}

export class TranscoderService {
    private static ffmpeg: FFmpeg | null = null;

    static async init() {
        if (this.ffmpeg) return;

        this.ffmpeg = new FFmpeg();
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        logger.info("FFmpeg loaded successfully");
    }

    /**
     * Transcodes a WAV buffer to the target format using FFmpeg.wasm
     */
    static async transcode(wavBuffer: ArrayBuffer, settings: ExportSettings): Promise<Blob> {
        if (settings.format === 'wav') {
            return new Blob([wavBuffer], { type: 'audio/wav' });
        }

        await this.init();
        const ffmpeg = this.ffmpeg!;

        const inputName = 'input.wav';
        const outputName = `output.${settings.format}`;

        await ffmpeg.writeFile(inputName, new Uint8Array(wavBuffer));

        let args: string[] = ['-i', inputName];

        if (settings.format === 'mp3') {
            args.push('-b:a', `${settings.kbps}k`, '-ar', `${settings.sampleRate}`, outputName);
        } else if (settings.format === 'aac') {
            args.push('-c:a', 'aac', '-b:a', `${settings.kbps}k`, '-ar', `${settings.sampleRate}`, outputName);
        } else if (settings.format === 'flac') {
            // FLAC ignores kbps, uses compression level
            args.push('-c:a', 'flac', outputName);
        }

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const typeMap: Record<string, string> = {
            mp3: 'audio/mpeg',
            aac: 'audio/aac',
            flac: 'audio/flac'
        };

        // Cleanup
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        return new Blob([(data as Uint8Array).buffer], { type: typeMap[settings.format] });
    }
}
