import React from 'react';
import { Button } from '../primitives/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'gradient';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${
      variant === 'gradient' 
        ? 'bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl' 
        : ''
    }`}>
      {Icon && (
        <div className="mb-6 p-6 rounded-full bg-gradient-coral/10">
          <Icon className="w-12 h-12 text-primary" />
        </div>
      )}
      
      <h3 className="text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-coral text-white hover:opacity-90"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
