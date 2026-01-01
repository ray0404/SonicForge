import React, { memo } from 'react';
import { RackModule } from '@/store/useAudioStore';
import { DynamicEQUnit } from './DynamicEQUnit';
import { LimiterUnit } from './LimiterUnit';
import { MidSideEQUnit } from './MidSideEQUnit';
import { CabSimUnit } from './CabSimUnit';
import { MeteringUnit } from './MeteringUnit';
import { TransientShaperUnit } from './TransientShaperUnit';
import { SaturationUnit } from './SaturationUnit';
import { DitheringUnit } from './DitheringUnit';
import { ParametricEQUnit } from './ParametricEQUnit';
import { DistortionUnit } from './DistortionUnit';
import { BitCrusherUnit } from './BitCrusherUnit';
import { ChorusUnit } from './ChorusUnit';
import { PhaserUnit } from './PhaserUnit';
import { TremoloUnit } from './TremoloUnit';
import { AutoWahUnit } from './AutoWahUnit';
import { FeedbackDelayUnit } from './FeedbackDelayUnit';
import { CompressorUnit } from './CompressorUnit';
import { DeEsserUnit } from './DeEsserUnit';
import { StereoImagerUnit } from './StereoImagerUnit';
import { MultibandCompressorUnit } from './MultibandCompressorUnit';

interface RackModuleContainerProps {
    module: RackModule;
    removeModule: (id: string) => void;
    toggleModuleBypass: (id: string) => void;
    updateModuleParam: (id: string, param: string, value: any) => void;
    dragHandleProps?: any;
}

/**
 * RackModuleContainer
 *
 * ⚡ PERFORMANCE OPTIMIZATION:
 * This component is wrapped in React.memo() to prevent unnecessary re-renders of the entire effects rack
 * when a single module's parameter changes.
 *
 * By passing the raw store actions (removeModule, etc.) instead of inline arrow functions,
 * and relying on the immutability of the `module` object from the store, we ensure that
 * only the module being modified triggers a re-render.
 */
export const RackModuleContainer = memo(({
    module,
    removeModule,
    toggleModuleBypass,
    updateModuleParam,
    dragHandleProps
}: RackModuleContainerProps) => {

    // Memoize handlers for the specific module instance
    // Although these are created every render of this component,
    // this component only renders if props change (which means module changed).
    const onRemove = () => removeModule(module.id);
    const onBypass = () => toggleModuleBypass(module.id);
    const onUpdate = (p: string, v: any) => updateModuleParam(module.id, p, v);

    const commonProps = {
        module,
        onRemove,
        onBypass,
        dragHandleProps
    };

    switch (module.type) {
        case 'DYNAMIC_EQ': return <DynamicEQUnit {...commonProps} onUpdate={onUpdate} />;
        case 'LIMITER': return <LimiterUnit {...commonProps} onUpdate={onUpdate} />;
        case 'MIDSIDE_EQ': return <MidSideEQUnit {...commonProps} onUpdate={onUpdate} />;
        case 'CAB_SIM': return <CabSimUnit {...commonProps} onUpdate={onUpdate} />;
        case 'TRANSIENT_SHAPER': return <TransientShaperUnit {...commonProps} onUpdate={onUpdate} />;
        case 'SATURATION': return <SaturationUnit {...commonProps} onUpdate={onUpdate} />;
        case 'DITHERING': return <DitheringUnit {...commonProps} onUpdate={onUpdate} />;
        case 'LOUDNESS_METER': return <MeteringUnit {...commonProps} />;
        case 'PARAMETRIC_EQ': return <ParametricEQUnit {...commonProps} onUpdate={onUpdate} />;
        case 'DISTORTION': return <DistortionUnit {...commonProps} onUpdate={onUpdate} />;
        case 'BITCRUSHER': return <BitCrusherUnit {...commonProps} onUpdate={onUpdate} />;
        case 'CHORUS': return <ChorusUnit {...commonProps} onUpdate={onUpdate} />;
        case 'PHASER': return <PhaserUnit {...commonProps} onUpdate={onUpdate} />;
        case 'TREMOLO': return <TremoloUnit {...commonProps} onUpdate={onUpdate} />;
        case 'AUTOWAH': return <AutoWahUnit {...commonProps} onUpdate={onUpdate} />;
        case 'FEEDBACK_DELAY': return <FeedbackDelayUnit {...commonProps} onUpdate={onUpdate} />;
        case 'COMPRESSOR': return <CompressorUnit {...commonProps} onUpdate={onUpdate} />;
        case 'DE_ESSER': return <DeEsserUnit {...commonProps} onUpdate={onUpdate} />;
        case 'STEREO_IMAGER': return <StereoImagerUnit {...commonProps} onUpdate={onUpdate} />;
        case 'MULTIBAND_COMPRESSOR': return <MultibandCompressorUnit {...commonProps} onUpdate={onUpdate} />;
        default:
            return <div className="p-4 bg-red-900/50 text-red-200 rounded">Unknown Module: {module.type}</div>;
    }
}, (prevProps, nextProps) => {
    // Custom comparison to ensure strict equality check on the module reference
    // and ignore dragHandleProps changes if possible, or strictly check them too.
    // Default shallow comparison of props by memo is usually enough if module ref is stable.
    // However, dragHandleProps might change references often if dnd-kit updates them.
    // Let's rely on default React.memo behavior first (shallow compare).
    // module: stable if not updated (store behavior).
    // removeModule: stable (store action).
    // dragHandleProps: comes from useSortable. If sorting state changes, this changes.
    // If dragHandleProps changes, we SHOULD re-render to update event listeners.
    return prevProps.module === nextProps.module &&
           prevProps.removeModule === nextProps.removeModule &&
           prevProps.toggleModuleBypass === nextProps.toggleModuleBypass &&
           prevProps.updateModuleParam === nextProps.updateModuleParam &&
           prevProps.dragHandleProps === nextProps.dragHandleProps;
});
