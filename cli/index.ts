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

    // Resolve the absolute path to headless.html
    // dist/cli/index.js -> dist/headless.html
    const headlessPath = path.resolve(__dirname, '..', 'headless.html');
    const fileUrl = `file://${headlessPath}`;

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
