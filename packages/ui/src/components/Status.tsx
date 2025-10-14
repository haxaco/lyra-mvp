import React from 'react';
import { Badge } from '../primitives/badge';
import { CheckCircle2, AlertTriangle, XCircle, Activity, Database, Zap, Clock } from 'lucide-react';

export const Status: React.FC = () => {
  const services = [
    { name: 'API Gateway', status: 'operational', uptime: 99.99, latency: 45 },
    { name: 'Music Generation', status: 'operational', uptime: 99.87, latency: 320 },
    { name: 'Analytics Service', status: 'operational', uptime: 99.95, latency: 78 },
    { name: 'Authentication', status: 'operational', uptime: 100, latency: 23 },
    { name: 'Database Primary', status: 'operational', uptime: 99.98, latency: 12 },
    { name: 'Database Replica', status: 'degraded', uptime: 98.45, latency: 156 },
    { name: 'CDN / Assets', status: 'operational', uptime: 99.99, latency: 8 },
    { name: 'Webhook Service', status: 'operational', uptime: 99.92, latency: 56 }
  ];

  const jobQueue = [
    { type: 'Playlist Generation', pending: 3, processing: 5, completed: 142, failed: 2 },
    { type: 'Analytics Processing', pending: 0, processing: 1, completed: 489, failed: 0 },
    { type: 'Export Tasks', pending: 1, processing: 0, completed: 78, failed: 1 }
  ];

  const storage = [
    { name: 'Audio Files', used: 45.2, total: 100, unit: 'GB' },
    { name: 'Database', used: 12.8, total: 50, unit: 'GB' },
    { name: 'Backups', used: 78.5, total: 200, unit: 'GB' },
    { name: 'Temp Files', used: 2.1, total: 10, unit: 'GB' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            Operational
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            Degraded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            Down
          </Badge>
        );
    }
  };

  const overallStatus = services.every(s => s.status === 'operational') 
    ? 'operational' 
    : services.some(s => s.status === 'down') 
    ? 'down' 
    : 'degraded';

  return (
    <div className="p-8 space-y-8">
      {/* Overall Status Header */}
      <div className="bg-gradient-to-br from-[#FF6F61]/10 via-[#E6B8C2]/10 to-transparent rounded-[16px] p-8 border border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-coral flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-foreground mb-1">System Status</h1>
              <p className="text-muted-foreground">
                Internal monitoring dashboard
              </p>
            </div>
          </div>
          {getStatusBadge(overallStatus)}
        </div>

        {/* System-Wide Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <p className="text-muted-foreground">Services Up</p>
            </div>
            <span className="text-foreground">
              {services.filter(s => s.status === 'operational').length} / {services.length}
            </span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-muted-foreground">Avg. Uptime</p>
            </div>
            <span className="text-foreground">
              {(services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(2)}%
            </span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-muted-foreground">Avg. Latency</p>
            </div>
            <span className="text-foreground">
              {Math.round(services.reduce((acc, s) => acc + s.latency, 0) / services.length)}ms
            </span>
          </div>
          <div className="bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-muted-foreground">Last Updated</p>
            </div>
            <span className="text-foreground">Just now</span>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-card rounded-[16px] border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-foreground">Service Health</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground">Service</th>
                <th className="text-center p-4 text-muted-foreground">Status</th>
                <th className="text-right p-4 text-muted-foreground">Uptime</th>
                <th className="text-right p-4 text-muted-foreground">Latency</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.name}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <span className="text-foreground">{service.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(service.status)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`${
                      service.uptime >= 99.9 
                        ? 'text-green-600 dark:text-green-400' 
                        : service.uptime >= 99 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {service.uptime.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`${
                      service.latency < 100 
                        ? 'text-green-600 dark:text-green-400' 
                        : service.latency < 300 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {service.latency}ms
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Queue Status */}
      <div className="bg-card rounded-[16px] p-6 border border-border">
        <h2 className="text-foreground mb-4">Job Queue Status</h2>
        <div className="space-y-4">
          {jobQueue.map((queue) => (
            <div key={queue.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground">{queue.type}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Pending: <span className="text-foreground">{queue.pending}</span></span>
                  <span>Processing: <span className="text-primary">{queue.processing}</span></span>
                  <span>Completed: <span className="text-green-600 dark:text-green-400">{queue.completed}</span></span>
                  {queue.failed > 0 && (
                    <span>Failed: <span className="text-red-600 dark:text-red-400">{queue.failed}</span></span>
                  )}
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-500"
                    style={{ width: `${(queue.pending / (queue.pending + queue.processing + queue.completed)) * 100}%` }}
                  />
                  <div 
                    className="bg-primary"
                    style={{ width: `${(queue.processing / (queue.pending + queue.processing + queue.completed)) * 100}%` }}
                  />
                  <div 
                    className="bg-green-500"
                    style={{ width: `${(queue.completed / (queue.pending + queue.processing + queue.completed)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-card rounded-[16px] p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-foreground">Storage Usage</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {storage.map((item) => (
            <div key={item.name} className="p-4 rounded-lg bg-secondary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.used} / {item.total} {item.unit}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className={`rounded-full h-2 transition-all duration-500 ${
                    (item.used / item.total) * 100 > 80 
                      ? 'bg-red-500' 
                      : (item.used / item.total) * 100 > 60 
                      ? 'bg-yellow-500' 
                      : 'bg-gradient-coral'
                  }`}
                  style={{ width: `${(item.used / item.total) * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground">
                {((item.used / item.total) * 100).toFixed(1)}% used
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
