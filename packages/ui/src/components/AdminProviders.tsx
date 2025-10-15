import React, { useState } from 'react';
import { Button } from '../primitives/button';
import { Switch } from '../primitives/switch';
import { Badge } from '../primitives/badge';
import { Settings, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export const AdminProviders: React.FC = () => {
  const [providers, setProviders] = useState([
    {
      id: 'mureka',
      name: 'Mureka',
      description: 'AI-generated royalty-free music',
      enabled: true,
      publicPerformance: true,
      watermark: false,
      costPerMinute: 0.15,
      uptime: 99.9,
      status: 'healthy'
    },
    {
      id: 'suno',
      name: 'Suno AI',
      description: 'Advanced AI music generation',
      enabled: true,
      publicPerformance: false,
      watermark: true,
      costPerMinute: 0.25,
      uptime: 98.5,
      status: 'healthy'
    },
    {
      id: 'musicgen',
      name: 'MusicGen (Meta)',
      description: 'Open-source music generation',
      enabled: false,
      publicPerformance: false,
      watermark: false,
      costPerMinute: 0.08,
      uptime: 95.2,
      status: 'degraded'
    },
    {
      id: 'audiocraft',
      name: 'AudioCraft',
      description: 'Meta\'s audio generation suite',
      enabled: true,
      publicPerformance: true,
      watermark: false,
      costPerMinute: 0.12,
      uptime: 99.5,
      status: 'healthy'
    }
  ]);

  const toggleProvider = (id: string, field: 'enabled' | 'publicPerformance' | 'watermark') => {
    setProviders(providers.map(p => 
      p.id === id ? { ...p, [field]: !p[field] } : p
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Degraded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Down
          </Badge>
        );
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-[#FF6F61]/10 via-[#E6B8C2]/10 to-transparent rounded-[16px] p-8 border border-primary/20">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-foreground">Model Compliance</h1>
            <p className="text-muted-foreground">
              Manage AI music generation providers and ensure legal compliance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-muted-foreground">Active Providers</p>
              <p className="text-foreground">
                {providers.filter(p => p.enabled).length} / {providers.length}
              </p>
            </div>
            <Button className="bg-gradient-coral text-white hover:opacity-90">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Avg. Cost/Min</p>
            <span className="text-foreground">
              ${(providers.reduce((acc, p) => acc + p.costPerMinute, 0) / providers.length).toFixed(2)}
            </span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Avg. Uptime</p>
            <span className="text-foreground">
              {(providers.reduce((acc, p) => acc + p.uptime, 0) / providers.length).toFixed(1)}%
            </span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Licensed</p>
            <span className="text-foreground">
              {providers.filter(p => p.publicPerformance).length} Providers
            </span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <p className="text-muted-foreground mb-1">Watermark-Free</p>
            <span className="text-foreground">
              {providers.filter(p => !p.watermark).length} Providers
            </span>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-card rounded-[16px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground">Provider</th>
                <th className="text-left p-4 text-muted-foreground">Status</th>
                <th className="text-center p-4 text-muted-foreground">Enabled</th>
                <th className="text-center p-4 text-muted-foreground">Public Performance</th>
                <th className="text-center p-4 text-muted-foreground">Watermark</th>
                <th className="text-right p-4 text-muted-foreground">Cost/Min</th>
                <th className="text-right p-4 text-muted-foreground">Uptime</th>
                <th className="text-center p-4 text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr
                  key={provider.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="text-foreground">{provider.name}</p>
                      <p className="text-muted-foreground">{provider.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(provider.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={() => toggleProvider(provider.id, 'enabled')}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Switch
                        checked={provider.publicPerformance}
                        onCheckedChange={() => toggleProvider(provider.id, 'publicPerformance')}
                        disabled={!provider.enabled}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <Switch
                        checked={provider.watermark}
                        onCheckedChange={() => toggleProvider(provider.id, 'watermark')}
                        disabled={!provider.enabled}
                      />
                    </div>
                  </td>
                  <td className="p-4 text-right text-foreground">
                    ${provider.costPerMinute.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`${
                      provider.uptime >= 99 
                        ? 'text-green-600 dark:text-green-400' 
                        : provider.uptime >= 95 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {provider.uptime}%
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[16px] p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-foreground">Legal Compliance Notice</h3>
            <p className="text-muted-foreground">
              Ensure all enabled providers have proper licensing for public performance rights. 
              Providers without public performance licenses should only be used for private or 
              non-commercial purposes. Always verify watermark requirements with your legal team.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="border-yellow-500/30">
                View Licensing Guide
              </Button>
              <Button variant="outline" className="border-yellow-500/30">
                Contact Legal Team
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details Cards */}
      <div className="grid grid-cols-2 gap-6">
        {providers.filter(p => p.enabled).map((provider) => (
          <div key={provider.id} className="bg-card rounded-[16px] p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-foreground mb-1">{provider.name}</h3>
                <p className="text-muted-foreground">{provider.description}</p>
              </div>
              {getStatusBadge(provider.status)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Public Performance License</span>
                <span className={`${
                  provider.publicPerformance 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {provider.publicPerformance ? '✓ Licensed' : '✗ Not Licensed'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Watermark Required</span>
                <span className={`${
                  provider.watermark 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {provider.watermark ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                <span className="text-muted-foreground">Generation Cost</span>
                <span className="text-foreground">
                  ${provider.costPerMinute}/min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
