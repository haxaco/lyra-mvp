import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '../primitives/badge';
import { Button } from '../primitives/button';

interface Tag {
  id: string;
  label: string;
  color?: string;
}

interface TagSelectorProps {
  label?: string;
  availableTags?: Tag[];
  selectedTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  label,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  maxTags,
  placeholder = 'Select tags...'
}) => {
  const [selected, setSelected] = useState<Tag[]>(selectedTags);

  const defaultTags: Tag[] = [
    { id: 'jazz', label: 'Jazz', color: '#FF6F61' },
    { id: 'pop', label: 'Pop', color: '#E6B8C2' },
    { id: 'rock', label: 'Rock', color: '#F5CBA7' },
    { id: 'electronic', label: 'Electronic', color: '#FF8A80' },
    { id: 'classical', label: 'Classical', color: '#D4A59A' },
    { id: 'acoustic', label: 'Acoustic', color: '#FF6F61' },
    { id: 'ambient', label: 'Ambient', color: '#E6B8C2' },
    { id: 'indie', label: 'Indie', color: '#F5CBA7' },
  ];

  const tags = availableTags.length > 0 ? availableTags : defaultTags;

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selected.some(t => t.id === tag.id);
    let newSelected: Tag[];

    if (isSelected) {
      newSelected = selected.filter(t => t.id !== tag.id);
    } else {
      if (maxTags && selected.length >= maxTags) {
        return; // Don't add if max reached
      }
      newSelected = [...selected, tag];
    }

    setSelected(newSelected);
    onTagsChange?.(newSelected);
  };

  const handleRemoveTag = (tagId: string) => {
    const newSelected = selected.filter(t => t.id !== tagId);
    setSelected(newSelected);
    onTagsChange?.(newSelected);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-foreground">
          {label}
          {maxTags && (
            <span className="ml-2 text-muted-foreground">
              ({selected.length}/{maxTags})
            </span>
          )}
        </label>
      )}

      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
          {selected.map((tag) => (
            <Badge
              key={tag.id}
              className="bg-gradient-coral text-white border-0 pl-3 pr-2 py-1 gap-1"
            >
              {tag.label}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Available Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.some(t => t.id === tag.id);
          const isDisabled = maxTags ? selected.length >= maxTags && !isSelected : false;

          return (
            <Button
              key={tag.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleToggleTag(tag)}
              disabled={isDisabled}
              className={`
                transition-all duration-200
                ${isSelected 
                  ? 'bg-gradient-coral text-white border-primary hover:opacity-90' 
                  : 'border-border hover:bg-secondary/50'
                }
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              {tag.label}
            </Button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
};
