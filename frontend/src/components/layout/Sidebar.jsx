import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  FlaskConical,
  Eye,
  AlertTriangle,
  FileVideo,
  Bell,
  FileText,
  Camera,
  Shield,
  Settings,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Lab Sessions', path: '/sessions', icon: FlaskConical },
  { name: 'Live Monitoring', path: '/monitoring', icon: Eye },
  { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { name: 'Evidence', path: '/evidence', icon: FileVideo },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Reference Profiles', path: '/reference', icon: Camera },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-950 border-r border-slate-800/80 p-3 select-none">
      {/* Top Branding Section */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 px-1">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <span className="text-[9px] font-extrabold text-cyan-400 tracking-widest block uppercase font-heading">
                  DEPT OF SE
                </span>
                <h2 className="text-xs font-extrabold text-white font-heading truncate">
                  AI Security System
                </h2>
              </motion.div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'text-white bg-blue-600/20 border border-blue-500/40 font-bold shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />

                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:block sticky top-16 h-[calc(100vh-4rem)] z-20 shrink-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed top-0 left-0 bottom-0 w-64 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
