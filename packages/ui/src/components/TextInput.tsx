import React from 'react';
import { cn } from '../primitives/utils';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  icon,
  className,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-foreground"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        <input
          className={cn(
            "w-full px-4 py-2 rounded-lg bg-input-background border border-border",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "transition-all placeholder:text-muted-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon && "pl-10",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-destructive">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
