import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const badgeVariants = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const Badge = ({ children, variant = 'info', className, dot = false, pulse = false }) => {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition',
          badgeVariants[variant] || badgeVariants.info,
          className
        )
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-emerald-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'purple' && 'bg-purple-400',
            variant === 'slate' && 'bg-slate-400',
            pulse && 'animate-ping'
          )}
        />
      )}
      {children}
    </span>
  );
};
