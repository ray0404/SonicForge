class DistortionProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'drive', defaultValue: 1.0, minValue: 1.0, maxValue: 100.0 }, // Drive as multiplier
            { name: 'wet', defaultValue: 1.0, minValue: 0.0, maxValue: 1.0 },
            { name: 'type', defaultValue: 0, minValue: 0, maxValue: 2 }, // 0: Tanh, 1: Atan, 2: Cubic
            { name: 'outputGain', defaultValue: 0.0, minValue: -24.0, maxValue: 24.0 }
        ];
    }

    constructor() {
        super();
        this.lastSample = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output) return true;

        const driveParam = parameters.drive;
        const wetParam = parameters.wet;
        const typeParam = parameters.type;
        const outGainParam = parameters.outputGain;

        const isConstDrive = driveParam.length === 1;
        const isConstWet = wetParam.length === 1;
        const isConstType = typeParam.length === 1;
        const isConstGain = outGainParam.length === 1;

        // Optimization: Hoist Constant Calculations
        const constDrive = isConstDrive ? driveParam[0] : 0;
        const constWet = isConstWet ? wetParam[0] : 0;
        const constTypeInt = isConstType ? Math.round(typeParam[0]) : 0;
        const constOutGain = isConstGain ? Math.pow(10, outGainParam[0] / 20.0) : 0;

        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            let lastX = this.lastSample; // Simple state for 2x oversampling interpolation

            // Optimization: Inline shaper logic and avoid function calls
            for (let i = 0; i < inputChannel.length; i++) {
                const x = inputChannel[i];
                
                const drive = isConstDrive ? constDrive : driveParam[i];
                const wet = isConstWet ? constWet : wetParam[i];
                // Resolve type once per sample if automated, otherwise use hoisted constant
                const type = isConstType ? constTypeInt : Math.round(typeParam[i]);
                const outGain = isConstGain ? constOutGain : Math.pow(10, outGainParam[i] / 20.0);

                // 2x Oversampling (Linear Interpolation + Averaging)
                const x_interp = 0.5 * (x + lastX);
                const xd = x * drive;
                const xid = x_interp * drive;

                let y_real, y_interp;

                // Inline Shaper Logic
                if (type === 0) {
                    // Soft Clipping (Tanh)
                    y_real = Math.tanh(xd);
                    y_interp = Math.tanh(xid);
                } else if (type === 1) {
                    // ArcTangent (Harder Clip)
                    // f(x) = (2/PI) * atan(x)
                    // Optimization: 2/PI is approx 0.6366197723675814
                    const k = 0.6366197723675814;
                    y_real = k * Math.atan(xd);
                    y_interp = k * Math.atan(xid);
                } else {
                    // Simple Soft Clip (Cubic)
                    // f(x) = x - x^3/3 if -1.5 < x < 1.5
                    if (xd > -1.5 && xd < 1.5) {
                        y_real = xd - (xd * xd * xd) / 3.0;
                    } else {
                        y_real = xd > 0 ? 1.0 : -1.0;
                    }

                    if (xid > -1.5 && xid < 1.5) {
                        y_interp = xid - (xid * xid * xid) / 3.0;
                    } else {
                        y_interp = xid > 0 ? 1.0 : -1.0;
                    }
                }

                // 3. Decimate (Average)
                const processed = 0.5 * (y_real + y_interp);
                
                // Mix
                outputChannel[i] = (processed * wet + x * (1 - wet)) * outGain;

                lastX = x;
            }
            // Note: Per-channel state persistence between blocks is simplified here.
        }
        
        return true;
    }
}

registerProcessor('distortion-processor', DistortionProcessor);