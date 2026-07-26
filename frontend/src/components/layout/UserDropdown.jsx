import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UserDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const username = user?.username || 'admin_user';
  const roles = user?.roles || ['Lab Instructor'];
  const primaryRole = roles[0] || 'Lab Instructor';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-left transition cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/20 shrink-0">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <span className="text-xs font-bold text-white block leading-tight">{username}</span>
          <span className="text-[10px] text-cyan-400 font-semibold">{primaryRole}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1"
          >
            <div className="p-2 border-b border-slate-800">
              <span className="text-slate-400 text-[10px] block">Signed in as</span>
              <strong className="text-white block font-heading truncate">{user?.email || `${username}@se.edu.pk`}</strong>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[10px] font-bold">
                <Shield className="w-3 h-3" /> {primaryRole}
              </span>
            </div>

            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-semibold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
