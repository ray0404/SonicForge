import {
    IAudioContext,
    IGainNode,
    IAudioNode,
    IAudioBufferSourceNode,
    IOfflineAudioContext,
    IStereoPannerNode,
    IAnalyserNode
} from "standardized-audio-context";
import { ContextManager } from "./context-manager";
import { RackModule } from "@/store/useAudioStore";
import { NodeFactory } from "./node-factory";
import { ConvolutionNode } from "../worklets/ConvolutionNode";

export class TrackStrip {
    public id: string;
    public inputGain: IGainNode<IAudioContext>;
    public outputGain: IGainNode<IAudioContext>; // Fader
    public panner: IStereoPannerNode<IAudioContext>;
    public analyser: IAnalyserNode<IAudioContext>;

    public sourceNode: IAudioBufferSourceNode<IAudioContext> | null = null;
    public sourceBuffer: AudioBuffer | null = null;

    // Rack State
    private nodeMap = new Map<string, IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode>();
    private connectedIds: string[] = [];

    private isPlaying: boolean = false;

    constructor(id: string) {
        this.id = id;
        const ctx = ContextManager.context;

        this.inputGain = ctx.createGain();
        this.outputGain = ctx.createGain();
        this.panner = ctx.createStereoPanner();
        this.analyser = ctx.createAnalyser();

        // Initial chain: Input -> Output -> Analyser -> Panner
        this.inputGain.connect(this.outputGain);
        this.outputGain.connect(this.analyser);
        this.analyser.connect(this.panner);

        // Default Params
        this.outputGain.gain.value = 1.0;
        this.panner.pan.value = 0;
    }

    get outputNode(): IAudioNode<IAudioContext> {
        return this.panner as unknown as IAudioNode<IAudioContext>;
    }

    connectTo(destination: IAudioNode<IAudioContext>) {
        this.outputNode.connect(destination);
    }

    disconnect() {
        this.outputNode.disconnect();
        this.fullRebuildGraph([]);
    }

    setSource(buffer: AudioBuffer) {
        this.sourceBuffer = buffer;
    }

    play(when: number, offset: number = 0) {
        if (!this.sourceBuffer) return;
        // If already playing, stop first? Or just let it overlay? Usually stop.
        if (this.isPlaying) this.stop();

        const ctx = ContextManager.context;
        this.sourceNode = ctx.createBufferSource();
        this.sourceNode.buffer = this.sourceBuffer;
        this.sourceNode.connect(this.inputGain);

        this.sourceNode.start(when, offset);
        this.isPlaying = true;

        this.sourceNode.onended = () => {
            this.isPlaying = false;
        };
    }

    stop() {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch(e) {
                // Ignore errors if already stopped
            }
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.isPlaying = false;
    }

    setVolume(value: number) {
        const ctx = ContextManager.context;
        this.outputGain.gain.setTargetAtTime(value, ctx.currentTime, 0.01);
    }

    setPan(value: number) {
        const ctx = ContextManager.context;
        this.panner.pan.setTargetAtTime(value, ctx.currentTime, 0.01);
    }

    // --- Rack Management ---

    updateRack(rack: RackModule[]) {
        const nextActiveModules = rack.filter(m => !m.bypass);
        const nextIds = nextActiveModules.map(m => m.id);

        // 1. Find the first point of difference
        let firstMismatchIndex = -1;
        const len = Math.max(this.connectedIds.length, nextIds.length);
        for (let i = 0; i < len; i++) {
            if (this.connectedIds[i] !== nextIds[i]) {
                firstMismatchIndex = i;
                break;
            }
        }

        // 2. If no structural changes, just sync params
        if (firstMismatchIndex === -1) {
            this.syncParams(rack);
            this.cleanupNodeMap(rack);
            return;
        }

        // 3. Partial Rebuild
        this.partialRebuildGraph(rack, firstMismatchIndex);
    }

    private partialRebuildGraph(rack: RackModule[], startIndex: number) {
        // Find the node that preceded the first mismatch
        let previousNode: IAudioNode<IAudioContext>;
        if (startIndex === 0) {
            previousNode = this.inputGain;
            // We disconnect inputGain from whatever it was connected to
            this.inputGain.disconnect();
        } else {
            const prevId = this.connectedIds[startIndex - 1];
            const prevNode = this.nodeMap.get(prevId);
            if (!prevNode) {
                return this.fullRebuildGraph(rack);
            }
            previousNode = (prevNode instanceof ConvolutionNode)
                ? prevNode.output as unknown as IAudioNode<IAudioContext>
                : prevNode as unknown as IAudioNode<IAudioContext>;
            previousNode.disconnect();
        }

        // Disconnect all subsequent nodes in the OLD chain
        for (let i = startIndex; i < this.connectedIds.length; i++) {
            const node = this.nodeMap.get(this.connectedIds[i]);
            if (node) node.disconnect();
        }

        // Cleanup nodes no longer in rack
        this.cleanupNodeMap(rack);

        // Reconstruct chain
        const activeIds = this.connectedIds.slice(0, startIndex);

        let foundStart = (startIndex === 0);
        const lastStableId = startIndex > 0 ? this.connectedIds[startIndex - 1] : null;

        rack.forEach(module => {
            if (!foundStart) {
                if (module.id === lastStableId) foundStart = true;
                return;
            }

            const node = this.getOrCreateNode(module);
            NodeFactory.updateParams(node, module);

            if (!module.bypass) {
                this.connectNodes(previousNode, node);
                previousNode = (node instanceof ConvolutionNode)
                    ? node.output as unknown as IAudioNode<IAudioContext>
                    : node as unknown as IAudioNode<IAudioContext>;
                activeIds.push(module.id);
            }
        });

        // Final connection to output gain (Track Output)
        // Wait, current structure: input -> [rack] -> outputGain -> panner
        // So previousNode connects to outputGain
        previousNode.connect(this.outputGain);
        this.connectedIds = activeIds;
    }

    private fullRebuildGraph(rack: RackModule[]) {
        this.inputGain.disconnect();
        this.nodeMap.forEach(node => node.disconnect());
        this.cleanupNodeMap(rack);

        let previousNode: IAudioNode<IAudioContext> = this.inputGain;
        const activeIds: string[] = [];

        rack.forEach(module => {
            let node = this.getOrCreateNode(module);
            NodeFactory.updateParams(node, module);

            if (!module.bypass) {
                this.connectNodes(previousNode, node);
                previousNode = (node instanceof ConvolutionNode)
                    ? node.output as unknown as IAudioNode<IAudioContext>
                    : node as unknown as IAudioNode<IAudioContext>;
                activeIds.push(module.id);
            }
        });

        previousNode.connect(this.outputGain);
        this.connectedIds = activeIds;
    }

    private cleanupNodeMap(rack: RackModule[]) {
        const currentIds = new Set(rack.map(m => m.id));
        for (const [id] of this.nodeMap) {
            if (!currentIds.has(id)) {
                this.nodeMap.delete(id);
            }
        }
    }

    private syncParams(rack: RackModule[]) {
        rack.forEach(module => {
            const node = this.nodeMap.get(module.id);
            if (node) {
                NodeFactory.updateParams(node, module);
            }
        });
    }

    private getOrCreateNode(module: RackModule): IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode {
        let node: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | undefined | null = this.nodeMap.get(module.id);
        if (!node) {
            node = NodeFactory.create(module, ContextManager.context);
            if (node) {
                this.nodeMap.set(module.id, node);
            } else {
                return ContextManager.context.createGain();
            }
        }
        return node!;
    }

    private connectNodes(source: IAudioNode<IAudioContext>, dest: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode) {
        if (dest instanceof ConvolutionNode) {
            source.connect(dest.input as unknown as IAudioNode<IAudioContext>);
        } else {
            source.connect(dest as unknown as IAudioNode<IAudioContext>);
        }
    }

    public updateModuleParam(id: string, param: string, value: any) {
        const node = this.nodeMap.get(id);
        const module = { id, parameters: { [param]: value } } as any; // Partial mock
        // We need the full module or just the param update logic?
        // NodeFactory.updateParams can handle it but it iterates over module.parameters.
        // So this partial mock works.
        if (node) {
             NodeFactory.updateParams(node, module);
        }
    }

    public getModuleNode(id: string) {
        return this.nodeMap.get(id);
    }
}
