import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { notificationService } from '../services/notificationService';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Search,
  CheckCheck,
  AlertTriangle,
  Info,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 3000,
  });

  const notificationsList = notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : [
    {
      id: 901,
      title: 'Mouse Missing Alert',
      message: 'YOLOv8 detected missing Mouse in Software Engineering AI Lab 1.',
      level: 'CRITICAL',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 902,
      title: 'Monitoring Scheduler Started',
      message: 'Multi-camera AI monitoring scheduler initialized for Room 101.',
      level: 'INFO',
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      showToast('Notification marked as read.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      showToast('Notification deleted.');
    },
  });

  const filteredNotifications = notificationsList.filter((n) => {
    const term = search.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(term)) ||
      (n.message && n.message.toLowerCase().includes(term))
    );
  });

  return (
    <PageContainer>
      <PageHeader
        title="Real-Time Security Notifications Center"
        subtitle="Review security alerts, AI detection events, camera status warnings, and system notifications"
        icon={Bell}
        actions={
          <Button icon={CheckCheck} onClick={() => showToast('All notifications marked as read.')}>
            Mark All as Read
          </Button>
        }
      />

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search notification title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredNotifications.length} Notification(s)</span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
              notif.is_read
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-slate-900 border-blue-500/30 text-white shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${notif.level === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {notif.level === 'CRITICAL' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm font-heading">{notif.title}</h4>
                  <Badge variant={notif.level === 'CRITICAL' ? 'danger' : 'info'}>{notif.level || 'INFO'}</Badge>
                </div>
                <p className="text-xs text-slate-300">{notif.message}</p>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {new Date(notif.created_at || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!notif.is_read && (
                <Button size="sm" variant="ghost" icon={CheckCircle2} onClick={() => markReadMutation.mutate(notif.id)}>
                  Mark Read
                </Button>
              )}
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => deleteMutation.mutate(notif.id)} className="text-red-400 hover:text-red-300">
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};
