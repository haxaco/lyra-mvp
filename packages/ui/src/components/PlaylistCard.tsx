import React from 'react';
import { Card } from '../primitives/card';
import { Button } from '../primitives/button';
import { Badge } from '../primitives/badge';
import { Play, Clock, Music, MoreVertical } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PlaylistCardProps {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  trackCount?: number;
  tags?: string[];
  imageUrl?: string;
  onPlay?: () => void;
  onViewDetails?: () => void;
  variant?: 'default' | 'compact';
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  title,
  description,
  duration,
  trackCount,
  tags = [],
  imageUrl,
  onPlay,
  onViewDetails,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <Card className="p-4 hover:shadow-lg transition-all duration-200 hover-coral group">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-lg bg-gradient-coral flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <ImageWithFallback 
                  src={imageUrl} 
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-6 h-6 text-white" />
              )}
            </div>
            <Button
              size="sm"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onPlay}
            >
              <Play className="w-4 h-4 text-white fill-white" />
            </Button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-foreground truncate">{title}</h4>
            <div className="flex items-center gap-3 mt-1">
              {trackCount && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  {trackCount} tracks
                </span>
              )}
              {duration && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {duration}
                </span>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" className="shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover-coral group">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-coral">
        {imageUrl ? (
          <ImageWithFallback 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-white/50" />
          </div>
        )}
        <Button
          size="lg"
          className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onPlay}
        >
          <Play className="w-5 h-5 text-white fill-white" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        <h4 className="text-foreground mb-2">{title}</h4>
        {description && (
          <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-4">
          {trackCount && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Music className="w-4 h-4" />
              {trackCount} tracks
            </span>
          )}
          {duration && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {duration}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-secondary/50 text-secondary-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action */}
        {onViewDetails && (
          <Button 
            variant="outline" 
            className="w-full border-primary/20 hover:bg-primary/5"
            onClick={onViewDetails}
          >
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
};
