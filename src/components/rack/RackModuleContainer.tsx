import React, { useCallback } from 'react';
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
  dragHandleProps?: any;
  removeModule: (id: string) => void;
  toggleModuleBypass: (id: string) => void;
  updateModuleParam: (id: string, param: string, value: any) => void;
}

export const RackModuleContainer = React.memo(({
  module,
  dragHandleProps,
  removeModule,
  toggleModuleBypass,
  updateModuleParam
}: RackModuleContainerProps) => {

  const onRemove = useCallback(() => removeModule(module.id), [removeModule, module.id]);
  const onBypass = useCallback(() => toggleModuleBypass(module.id), [toggleModuleBypass, module.id]);
  const onUpdate = useCallback((param: string, value: any) => updateModuleParam(module.id, param, value), [updateModuleParam, module.id]);

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
});

RackModuleContainer.displayName = 'RackModuleContainer';
