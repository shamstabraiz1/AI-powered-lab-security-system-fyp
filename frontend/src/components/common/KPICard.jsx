import React from 'react';
import { motion } from 'framer-motion';

export const KPICard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg backdrop-blur-md relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">{title}</span>
          <h3 className="text-2xl font-extrabold text-white font-heading">{value}</h3>
          {subtitle && <span className="text-[11px] text-slate-400 mt-1 block">{subtitle}</span>}
          {trend && (
            <span
              className={`text-[10px] font-bold mt-2 inline-block px-2 py-0.5 rounded-full ${
                trend.includes('+') || trend.includes('Up') || trend.includes('Active') || trend.includes('100%')
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {trend}
            </span>
          )}
        </div>

        <div className={`p-3 rounded-xl ${color || 'bg-blue-600/20 text-blue-400'} border border-slate-700/50`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
