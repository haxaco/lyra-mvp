import React from 'react';
import { Card } from '../primitives/card';
import { Button } from '../primitives/button';
import { Badge } from '../primitives/badge';
import { Check } from 'lucide-react';

interface PlanCardProps {
  name: string;
  price: number | null;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
  current?: boolean;
  onSelect?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  recommended = false,
  current = false,
  onSelect
}) => {
  return (
    <Card className={`p-6 relative hover:shadow-lg transition-all duration-200 ${
      recommended 
        ? 'border-2 border-primary shadow-lg' 
        : 'hover-coral'
    }`}>
      {/* Recommended Badge */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-coral text-white border-0 px-4 py-1">
            Recommended
          </Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {current && (
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="border-primary text-primary">
            Current Plan
          </Badge>
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className="text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex items-baseline gap-2">
          {price !== null ? (
            <>
              <h2 className="text-foreground">${price}</h2>
              <span className="text-muted-foreground">
                {period}
              </span>
            </>
          ) : (
            <h2 className="text-foreground">{period}</h2>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-foreground flex-1">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        className={`w-full ${
          recommended 
            ? 'bg-gradient-coral text-white hover:opacity-90' 
            : current
            ? 'bg-secondary text-secondary-foreground'
            : 'border-primary/20 hover:bg-primary/5'
        }`}
        variant={recommended ? 'default' : current ? 'secondary' : 'outline'}
        onClick={onSelect}
        disabled={current}
      >
        {current ? 'Current Plan' : price === null ? 'Contact Sales' : recommended ? 'Upgrade Now' : 'Select Plan'}
      </Button>
    </Card>
  );
};
