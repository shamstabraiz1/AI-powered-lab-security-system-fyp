import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FlaskConical,
  Camera,
  Eye,
  AlertTriangle,
  FileVideo,
  Bell,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react';

export const MainLayout = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Sessions', path: '/sessions', icon: FlaskConical },
    { name: 'Monitoring', path: '/monitoring', icon: Eye },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { name: 'Evidence', path: '/evidence', icon: FileVideo },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Reference', path: '/reference', icon: Camera },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
              DEPARTMENT OF SOFTWARE ENGINEERING
            </span>
            <h1 className="text-sm font-bold text-white font-heading">AI Powered Lab Security System</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400">
            User: <strong className="text-white">{user?.username || 'admin_user'}</strong>
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition flex items-center gap-1.5 font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main Content & Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-1 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
