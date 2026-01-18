import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { AudioBridge } from './engine/audio-bridge.js';
import { runTUI } from './ui/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const program = new Command();

program
  .name('sonicforge')
  .description('Sonic Forge CLI & TUI')
  .version('0.1.0');

program
  .command('start')
  .description('Start the Interactive TUI')
  .action(async () => {
    console.log('Starting Sonic Forge TUI...');

    // Resolve the absolute path to headless.html in dist/
    // Whether running from cli/ (source) or dist/cli/ (built), we want the built dist/headless.html
    const headlessPath = path.resolve(__dirname, '..', 'dist', 'headless.html');
    
    // Fallback: If running from dist/cli/, '..' is dist/, so we might need just 'headless.html'
    // But __dirname in dist/cli/ is .../sonicforge/dist/cli
    // path.resolve(..., '..', 'dist', 'headless.html') -> .../sonicforge/dist/dist/headless.html (WRONG if in dist)
    
    // Better logic:
    // If we are in 'dist/cli', we want '../headless.html'.
    // If we are in 'cli' (source), we want '../dist/headless.html'.
    
    let targetPath = path.resolve(__dirname, '..', 'dist', 'headless.html');
    
    // Check if we are running from dist
    if (__dirname.includes(path.join('dist', 'cli'))) {
        targetPath = path.resolve(__dirname, '..', 'headless.html');
    }

    // Verify existence
    const fs = await import('fs');
    if (!fs.existsSync(targetPath)) {
        // Try one more fallback for safety (if running tsx from root, __dirname is .../cli)
        const altPath = path.resolve(__dirname, '..', 'headless.html');
        // If dist doesn't exist but root does, warn user they need to build
        if (fs.existsSync(altPath)) {
             console.error('Error: "dist/headless.html" not found.');
             console.error('Please run "npm run build" to generate the headless engine before running the CLI.');
             process.exit(1);
        }
        console.error(`Error: Could not find headless.html at ${targetPath}`);
        process.exit(1);
    }

    const fileUrl = `file://${targetPath}`;

    try {
      // 1. Launch the Headless Bridge via File Protocol
      const bridge = new AudioBridge(fileUrl);
      await bridge.init();
      console.log('Engine Connected.');

      // 2. Launch TUI
      await runTUI(bridge);

      // Cleanup on exit
      await bridge.close();
      process.exit(0);

    } catch (error) {
      console.error('Fatal Error:', error);
      process.exit(1);
    }
  });

program.parse();
