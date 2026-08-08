import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Info, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../../services/notificationService';

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Synchronized with existing notification query and real-time polling
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.getNotifications(),
    refetchInterval: 3000,
  });

  const notificationsList =
    notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : []);

  const unreadNotifications = notificationsList.filter((n) => !n.is_read);
  const unreadCount = unreadNotifications.length;

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const handleNavigateToCenter = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition relative cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-heading">System Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                {notificationsList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications recorded in system.
                  </div>
                ) : (
                  notificationsList.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 transition flex items-start justify-between gap-2.5 ${
                        !n.is_read ? 'bg-slate-800/30 hover:bg-slate-800/60' : 'hover:bg-slate-800/20 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {n.severity === 'CRITICAL' || n.severity === 'WARNING' || n.level === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{n.title}</h4>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.message || n.desc}</p>
                          <span className="text-[9px] text-slate-500 mt-1 block font-mono">
                            {formatTime(n.created_at || n.time)}
                          </span>
                        </div>
                      </div>

                      {!n.is_read && (
                        <button
                          onClick={() => markReadMutation.mutate(n.id)}
                          title="Mark as read"
                          className="text-slate-400 hover:text-cyan-400 p-1 rounded transition shrink-0 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 text-center">
                <button
                  onClick={handleNavigateToCenter}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-1.5 w-full py-1 cursor-pointer transition"
                >
                  View All in Notification Center <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
