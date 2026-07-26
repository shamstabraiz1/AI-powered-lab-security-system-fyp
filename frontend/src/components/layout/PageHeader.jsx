import React from 'react';

export const PageHeader = ({ title, subtitle, icon: Icon, actions }) => {
  return (
    <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-400 shrink-0" />}
          <span>{title}</span>
        </h2>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
