import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Server, Database, Cpu, Camera, Activity } from 'lucide-react';

export const SystemHealthPanel = () => {
  const healthItems = [
    { label: 'Django REST API', status: 'Operational', variant: 'success', icon: Server },
    { label: 'PostgreSQL Database', status: 'Connected', variant: 'success', icon: Database },
    { label: 'YOLOv8 Engine (PyTorch)', status: 'Active (yolov8m)', variant: 'success', icon: Cpu },
    { label: 'Multi-Cam Worker Threads', status: 'Running (2 Cams)', variant: 'success', icon: Activity },
    { label: 'IP Camera RTSP Streams', status: '2 Online / 0 Offline', variant: 'info', icon: Camera },
  ];

  return (
    <Card
      title="System Health & Infrastructure Diagnostics"
      subtitle="Operational readiness across backend, database, and AI pipelines"
      className="h-full"
    >
      <div className="space-y-2.5 text-xs">
        {healthItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-200">{item.label}</span>
              </div>
              <Badge variant={item.variant} dot>
                {item.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
