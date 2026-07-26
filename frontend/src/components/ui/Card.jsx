import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className, title, subtitle, action, footer }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden',
          className
        )
      )}
    >
      {(title || subtitle || action) && (
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-sm font-bold text-white font-heading">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-xs">{footer}</div>}
    </div>
  );
};
