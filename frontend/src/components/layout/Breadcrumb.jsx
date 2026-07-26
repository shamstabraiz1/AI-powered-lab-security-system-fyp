import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const pathNames = {
  dashboard: 'Dashboard',
  sessions: 'Lab Sessions',
  monitoring: 'Live Monitoring',
  incidents: 'Security Incidents',
  evidence: 'Video Evidence',
  notifications: 'Notifications',
  reports: 'Academic Reports',
  reference: 'Reference Profiles',
  settings: 'System Settings',
};

export const Breadcrumb = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 py-2 px-6 border-b border-slate-800/80 bg-slate-950/40">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-white transition">
        <Home className="w-3.5 h-3.5 text-blue-400" />
        <span>Home</span>
      </Link>
      {segments.map((seg, idx) => {
        const url = `/${segments.slice(0, idx + 1).join('/')}`;
        const isLast = idx === segments.length - 1;
        const name = pathNames[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="text-cyan-400 font-bold">{name}</span>
            ) : (
              <Link to={url} className="hover:text-white transition">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
