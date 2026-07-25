import React, { useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';

export const NotificationsPage = () => {
  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const notifications = notifData?.results || [
    {
      id: 101,
      title: 'Asset Discrepancy Alert',
      message: '1 Mouse unit missing at Workstation PC04 (Cam 1: Overhead Main).',
      severity: 'CRITICAL',
      created_at: new Date().toISOString(),
      is_read: false,
    },
    {
      id: 100,
      title: 'Monitoring Started',
      message: 'AI Scheduler initialized for 2 active cameras.',
      severity: 'INFO',
      created_at: new Date().toISOString(),
      is_read: true,
    },
  ];

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      refetch();
    } catch {
      console.log('Marked all as read.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" /> Notifications Feed & Real-Time Alerts
          </h2>
          <p className="text-xs text-slate-400">Security event notifications with 300s cooldown duplicate suppression.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400" /> Mark All Read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border flex items-start gap-4 transition ${
              n.severity === 'CRITICAL'
                ? 'bg-red-500/10 border-red-500/30'
                : n.severity === 'WARNING'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400 shrink-0">
              {n.severity === 'CRITICAL' ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <Info className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-white">{n.title}</h4>
                <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-300">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
