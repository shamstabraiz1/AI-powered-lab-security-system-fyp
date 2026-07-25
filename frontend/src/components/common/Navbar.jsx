import React from 'react';
import { Bell, Shield, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const { user } = useAuth();
  const roleName = user?.roles?.[0] || 'Lab Instructor';

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between backdrop-blur-md sticky top-[68px] z-20">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          AI Monitoring Active
        </span>
        <span className="text-xs text-slate-400 hidden sm:inline">
          System Status: <strong className="text-slate-200">Healthy (2 Cameras Online)</strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info Badge */}
        <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <span className="text-xs font-bold text-white block">
              {user?.username || 'Dr. Tabraiz Shams'}
            </span>
            <span className="text-[10px] text-blue-400 font-semibold inline-flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> {roleName}
            </span>
          </div>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            1
          </span>
        </button>
      </div>
    </div>
  );
};
