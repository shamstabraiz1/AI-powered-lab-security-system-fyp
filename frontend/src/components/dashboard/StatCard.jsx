import React from 'react';
import { motion } from 'framer-motion';
import { CardSkeleton } from '../ui/Skeleton';
import { AlertCircle } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/10',
  trend,
  isLoading,
  isError,
  errorText = 'Error',
}) => {
  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between relative overflow-hidden group"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-heading">
            {title}
          </span>
          {isError ? (
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1 mt-2">
              <AlertCircle className="w-3.5 h-3.5" /> {errorText}
            </span>
          ) : (
            <h3 className="text-2xl font-extrabold text-white mt-1 font-heading tracking-tight">
              {value !== undefined && value !== null ? value : 0}
            </h3>
          )}
        </div>

        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0 shadow-inner`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">{subtitle}</span>
        {trend && (
          <span className={`font-bold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};
