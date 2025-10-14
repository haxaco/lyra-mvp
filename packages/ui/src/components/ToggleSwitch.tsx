import React from 'react';
import { Switch } from '../primitives/switch';
import { cn } from '../primitives/utils';

interface ToggleSwitchProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'coral';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'md',
  variant = 'default'
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 p-4 rounded-lg transition-colors",
      "hover:bg-secondary/30",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <div className="flex-1 space-y-1">
        {label && (
          <p className={cn(
            "text-foreground",
            size === 'sm' && "text-sm",
            size === 'lg' && "text-lg"
          )}>
            {label}
          </p>
        )}
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          variant === 'coral' && "data-[state=checked]:bg-gradient-coral"
        )}
      />
    </div>
  );
};
