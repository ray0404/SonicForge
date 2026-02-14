// src/audio/worklets/{{kebab-name}}-processor.js

class {{PascalName}}Processor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'mix', defaultValue: 1.0, minValue: 0.0, maxValue: 1.0 },
            // Add custom parameters here
            // { name: 'paramName', defaultValue: 0.5, minValue: 0.0, maxValue: 1.0 }
        ];
    }

    constructor() {
        super();
        // Initialize state variables here (e.g., phase, delay buffers)
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        
        // Safety check for empty buffers
        if (!input || !output || input.length === 0) return true;

        // Fetch Parameters
        const mixParam = parameters.mix;
        // const customParam = parameters.paramName;

        // Optimization: check if parameters are constant arrays or single values
        const isConstMix = mixParam.length === 1;

        for (let ch = 0; ch < input.length; ch++) {
            const inputChannel = input[ch];
            const outputChannel = output[ch];

            for (let i = 0; i < inputChannel.length; i++) {
                const inSample = inputChannel[i];
                const mix = isConstMix ? mixParam[0] : mixParam[i];

                // --- DSP LOGIC START ---
                let processed = inSample; // Replace with math
                // --- DSP LOGIC END ---

                // Dry/Wet Mix
                outputChannel[i] = processed * mix + inSample * (1 - mix);
            }
        }

        return true;
    }
}

registerProcessor('{{kebab-name}}-processor', {{PascalName}}Processor);
