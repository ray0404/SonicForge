import React, { useMemo, useCallback } from 'react';
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
  dragHandleProps: any;
}

export const RackModuleContainer = React.memo(({
  module,
  removeModule,
  toggleModuleBypass,
  updateModuleParam,
  dragHandleProps
}: RackModuleContainerProps) => {

  // Memoize handlers to prevent unnecessary re-renders of children
  const handleRemove = useCallback(() => removeModule(module.id), [removeModule, module.id]);
  const handleBypass = useCallback(() => toggleModuleBypass(module.id), [toggleModuleBypass, module.id]);
  const handleUpdate = useCallback((p: string, v: any) => updateModuleParam(module.id, p, v), [updateModuleParam, module.id]);

  const commonProps = {
      module,
      onRemove: handleRemove,
      onBypass: handleBypass,
      dragHandleProps
  };

  switch (module.type) {
      case 'DYNAMIC_EQ': return <DynamicEQUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'LIMITER': return <LimiterUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'MIDSIDE_EQ': return <MidSideEQUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'CAB_SIM': return <CabSimUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'TRANSIENT_SHAPER': return <TransientShaperUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'SATURATION': return <SaturationUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'DITHERING': return <DitheringUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'LOUDNESS_METER': return <MeteringUnit {...commonProps} />;
      case 'PARAMETRIC_EQ': return <ParametricEQUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'DISTORTION': return <DistortionUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'BITCRUSHER': return <BitCrusherUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'CHORUS': return <ChorusUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'PHASER': return <PhaserUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'TREMOLO': return <TremoloUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'AUTOWAH': return <AutoWahUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'FEEDBACK_DELAY': return <FeedbackDelayUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'COMPRESSOR': return <CompressorUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'DE_ESSER': return <DeEsserUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'STEREO_IMAGER': return <StereoImagerUnit {...commonProps} onUpdate={handleUpdate} />;
      case 'MULTIBAND_COMPRESSOR': return <MultibandCompressorUnit {...commonProps} onUpdate={handleUpdate} />;
      default:
          return <div className="p-4 bg-red-900/50 text-red-200 rounded">Unknown Module: {module.type}</div>;
  }
}, (prevProps, nextProps) => {
    return (
        prevProps.module === nextProps.module &&
        prevProps.removeModule === nextProps.removeModule &&
        prevProps.toggleModuleBypass === nextProps.toggleModuleBypass &&
        prevProps.updateModuleParam === nextProps.updateModuleParam &&
        prevProps.dragHandleProps === nextProps.dragHandleProps
    );
});
