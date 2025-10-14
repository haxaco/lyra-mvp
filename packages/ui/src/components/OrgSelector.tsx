import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../primitives/dropdown-menu';
import { Button } from '../primitives/button';
import { Avatar, AvatarFallback, AvatarImage } from '../primitives/avatar';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  logo?: string;
  initials: string;
}

interface OrgSelectorProps {
  organizations?: Organization[];
  currentOrgId?: string;
  onSelectOrg?: (orgId: string) => void;
  onAddOrg?: () => void;
  variant?: 'sidebar' | 'topbar';
}

export const OrgSelector: React.FC<OrgSelectorProps> = ({
  organizations = [],
  currentOrgId,
  onSelectOrg,
  onAddOrg,
  variant = 'sidebar'
}) => {
  // Default organizations if none provided
  const defaultOrgs: Organization[] = [
    {
      id: '1',
      name: 'Café Harmony',
      initials: 'CH'
    },
    {
      id: '2',
      name: 'FitZone Gym',
      initials: 'FZ'
    },
    {
      id: '3',
      name: 'Boutique Store Co.',
      initials: 'BS'
    }
  ];

  const displayOrgs = organizations.length > 0 ? organizations : defaultOrgs;
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrgId || displayOrgs[0].id);
  
  const currentOrg = displayOrgs.find(org => org.id === selectedOrgId) || displayOrgs[0];

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
    onSelectOrg?.(orgId);
  };

  const isTopbar = variant === 'topbar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`w-full justify-between px-3 py-2 h-auto ${
            isTopbar 
              ? 'hover:bg-muted border border-border/50 rounded-lg' 
              : 'hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Avatar className={`h-8 w-8 ${isTopbar ? 'border-2 border-border' : 'border-2 border-white/20'}`}>
              <AvatarImage src={currentOrg.logo} alt={currentOrg.name} />
              <AvatarFallback className="bg-gradient-coral text-white">
                {currentOrg.initials}
              </AvatarFallback>
            </Avatar>
            <span className={`truncate max-w-[140px] ${
              isTopbar ? 'text-foreground' : 'text-white/90'
            }`}>
              {currentOrg.name}
            </span>
          </div>
          <ChevronsUpDown className={`w-4 h-4 ${isTopbar ? 'text-muted-foreground' : 'text-white/60'}`} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {displayOrgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrg(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={org.logo} alt={org.name} />
                <AvatarFallback className="bg-gradient-coral text-white text-xs">
                  {org.initials}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1">{org.name}</span>
              {org.id === selectedOrgId && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onAddOrg}
          className="cursor-pointer text-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
