import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const mockNotifications = [
    {
      id: 1,
      title: 'Asset Discrepancy Alert',
      desc: '1 Mouse missing at Workstation PC04 (Cam 1).',
      time: '2 mins ago',
      severity: 'danger',
    },
    {
      id: 2,
      title: 'Session Monitoring Active',
      desc: 'YOLOv8 monitoring loop running for Room 101.',
      time: '15 mins ago',
      severity: 'info',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition relative cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">System Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Check className="w-3 h-3" /> Mark read
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
              {mockNotifications.map((n) => (
                <div key={n.id} className="p-3 hover:bg-slate-800/40 transition flex items-start gap-2.5">
                  {n.severity === 'danger' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                    <p className="text-[11px] text-slate-400">{n.desc}</p>
                    <span className="text-[9px] text-slate-500 mt-1 block">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
