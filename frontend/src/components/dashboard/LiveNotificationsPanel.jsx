import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertTriangle, Info, Bell } from 'lucide-react';

export const LiveNotificationsPanel = ({ notifications = [], isLoading }) => {
  const notifs = notifications.length > 0 ? notifications : [
    {
      id: 101,
      title: 'Asset Missing Alert',
      message: '1 Mouse unit missing at Workstation PC04 (Cam 1).',
      severity: 'CRITICAL',
      created_at: new Date().toISOString(),
      is_read: false,
    },
    {
      id: 100,
      title: 'Monitoring Started',
      message: 'AI Scheduler initialized for 2 active cameras.',
      severity: 'INFO',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      is_read: true,
    },
  ];

  return (
    <Card
      title="Live Notifications Feed"
      subtitle="Auto-refreshing event alerts with 300s cooldown protection"
      action={<Badge variant="info">Auto-refresh 15s</Badge>}
      className="h-full"
    >
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`p-3 rounded-lg border flex items-start gap-3 transition ${
              n.severity === 'CRITICAL'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="p-1.5 rounded bg-slate-900 text-cyan-400 shrink-0 mt-0.5">
              {n.severity === 'CRITICAL' ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <Info className="w-4 h-4 text-blue-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white font-heading">{n.title}</h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
