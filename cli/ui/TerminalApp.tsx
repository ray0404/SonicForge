import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { MeterBar } from './components/MeterBar.js';
import { AudioBridge } from '../engine/audio-bridge.js';

export const TerminalApp = ({ bridge }: { bridge: AudioBridge }) => {
  const { exit } = useApp();
  const [metering, setMetering] = useState({ input: -60, output: -60, gainReduction: 0 });
  const [threshold, setThreshold] = useState(-20);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await bridge.getMetering();
        if (data) setMetering(data);
      } catch (e) {
        // ignore errors during polling
      }
    }, 100);

    return () => clearInterval(interval);
  }, [bridge]);

  useInput((input, key) => {
    if (key.leftArrow) {
      const newVal = Math.max(-60, threshold - 1);
      setThreshold(newVal);
      // Example: Updating a module named 'Compressor'
      bridge.updateParam('Compressor', 'threshold', newVal).catch(() => {});
    }
    if (key.rightArrow) {
      const newVal = Math.min(0, threshold + 1);
      setThreshold(newVal);
      bridge.updateParam('Compressor', 'threshold', newVal).catch(() => {});
    }
    if (input === 'q') {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
      <Text bold>Sonic Forge TUI</Text>
      <Box flexDirection="column" marginTop={1}>
        <MeterBar label="Input " value={metering.input} />
        <MeterBar label="Output" value={metering.output} />
      </Box>
      <Box marginTop={1}>
        <Text>Threshold: {threshold} dB (Arrows to adjust)</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press 'q' to quit</Text>
      </Box>
    </Box>
  );
};
