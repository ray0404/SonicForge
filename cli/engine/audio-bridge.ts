import puppeteer from 'puppeteer-core';
import { EventEmitter } from 'events';
import fs from 'fs';

export class AudioBridge extends EventEmitter {
  private browser: any;
  private page: any;
  private url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  async init() {
    // Attempt to locate Chromium. 
    // On Termux it is typically at /data/data/com.termux/files/usr/bin/chromium-browser or .../chromium
    const possiblePaths = [
      process.env.CHROME_BIN,
      '/data/data/com.termux/files/usr/bin/chromium',
      '/data/data/com.termux/files/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome'
    ];

    const executablePath = possiblePaths.find(p => p && fs.existsSync(p));

    if (!executablePath) {
      throw new Error(
        'Could not find Chromium executable. Please install it (e.g., `pkg install chromium` on Termux) or set CHROME_BIN environment variable.'
      );
    }

    console.log(`[CLI] Launching Engine with: ${executablePath}`);

    this.browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=9222',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-running-insecure-content',
        '--autoplay-policy=no-user-gesture-required',
        '--allow-file-access-from-files'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Expose log function to see browser logs in node
    this.page.on('console', (msg: any) => console.log('[Browser]', msg.text()));

    console.log(`[CLI] Navigating to: ${this.url}`);
    await this.page.goto(this.url, { timeout: 60000 });
    
    // Wait for the bridge to be ready
    try {
        await this.page.waitForFunction('!!window.__SONICFORGE_BRIDGE__', { timeout: 10000 });
        // Initialize the engine inside the browser
        await this.page.evaluate(() => window.__SONICFORGE_BRIDGE__.init());
    } catch (e) {
        console.error("Failed to connect to SonicForge Bridge via Headless Browser.");
        throw e;
    }
  }

  async loadAudioFile(buffer: Buffer) {
    // Pass buffer as array (Puppeteer serialization)
    // In a real app we might use a more efficient transfer or serve the file via URL
    const data = [...buffer];
    return this.page.evaluate(async (buf: number[]) => {
        const arrayBuf = new Uint8Array(buf).buffer;
        return window.__SONICFORGE_BRIDGE__.loadAudio(arrayBuf);
    }, data);
  }

  async updateParam(moduleId: string, paramId: string, value: number) {
    return this.page.evaluate((m: string, p: string, v: number) => {
        return window.__SONICFORGE_BRIDGE__.updateParam(m, p, v);
    }, moduleId, paramId, value);
  }

  async getMetering() {
    return this.page.evaluate(() => {
        return window.__SONICFORGE_BRIDGE__.getMeteringData();
    });
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

// Type definition helper for the browser context
declare global {
  interface Window {
    __SONICFORGE_BRIDGE__: any;
  }
}
