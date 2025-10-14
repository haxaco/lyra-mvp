import React from 'react';
import { Card } from '../primitives/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  variant?: 'default' | 'gradient';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  subtitle,
  variant = 'default'
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-200 ${
      variant === 'gradient' 
        ? 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10' 
        : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-foreground">{value}</h3>
            {change !== undefined && (
              <span className={`${getTrendColor()}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-gradient-coral">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
};
