import React from 'react';
import { useRealtimeClock } from '../../hooks/useRealtimeClock';
import { NotificationBell } from './NotificationBell';
import { UserDropdown } from './UserDropdown';
import { Menu, Activity, ShieldCheck } from 'lucide-react';

export const TopNavbar = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const { formattedDate, formattedTime } = useRealtimeClock();

  return (
    <header className="h-16 bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase font-heading">
              DEPARTMENT OF SOFTWARE ENGINEERING
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-2.5 h-2.5" /> BS SE FYP
            </span>
          </div>
          <h1 className="text-xs sm:text-sm font-bold text-white font-heading">
            AI Powered Lab Security System
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Date & Real-Time Clock Ticker */}
        <div className="hidden lg:flex flex-col text-right font-mono text-[11px]">
          <span className="text-slate-400 font-sans text-[10px]">{formattedDate}</span>
          <span className="text-cyan-400 font-bold tracking-wider">{formattedTime}</span>
        </div>

        {/* System Health Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>System Operational</span>
        </div>

        <NotificationBell />
        <UserDropdown />
      </div>
    </header>
  );
};
