import React, { useState } from 'react';
import { Slider } from '../primitives/slider';
import { Zap, Volume2, Gauge } from 'lucide-react';

interface EnergySliderProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showLabels?: boolean;
  icon?: 'energy' | 'volume' | 'tempo';
}

export const EnergySlider: React.FC<EnergySliderProps> = ({
  label,
  value: initialValue = 50,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showLabels = true,
  icon = 'energy'
}) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue: number[]) => {
    setValue(newValue[0]);
    onChange?.(newValue[0]);
  };

  const getEnergyLabel = (val: number) => {
    if (val < 25) return 'Low';
    if (val < 50) return 'Moderate';
    if (val < 75) return 'High';
    return 'Very High';
  };

  const getIcon = () => {
    switch (icon) {
      case 'volume':
        return <Volume2 className="w-5 h-5 text-primary" />;
      case 'tempo':
        return <Gauge className="w-5 h-5 text-primary" />;
      default:
        return <Zap className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <label className="text-foreground">{label}</label>
          </div>
          {showLabels && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{getEnergyLabel(value)}</span>
              <span className="px-2 py-1 rounded-lg bg-gradient-coral text-white min-w-[3rem] text-center">
                {value}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>

      {showLabels && (
        <div className="flex justify-between text-muted-foreground px-2">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      )}
    </div>
  );
};
