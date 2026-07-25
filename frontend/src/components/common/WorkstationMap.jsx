import React from 'react';
import { Monitor, AlertTriangle, CheckCircle, Video } from 'lucide-react';

export const WorkstationMap = ({ incidents = [] }) => {
  const hasIncidentAtPC04 = incidents.some((i) => i.location?.includes('PC04') || i.assetName === 'Mouse');

  const workstations = [
    { id: 'PC01', name: 'Workstation 01', status: 'OK' },
    { id: 'PC02', name: 'Workstation 02', status: 'OK' },
    { id: 'PC03', name: 'Workstation 03', status: 'OK' },
    { id: 'PC04', name: 'Workstation 04', status: hasIncidentAtPC04 ? 'ALERT' : 'OK', alertMsg: 'Mouse Missing' },
    { id: 'PC05', name: 'Workstation 05', status: 'OK' },
    { id: 'PC06', name: 'Workstation 06', status: 'OK' },
    { id: 'PC07', name: 'Workstation 07', status: 'OK' },
    { id: 'PC08', name: 'Workstation 08', status: 'OK' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" /> Laboratory 2D Workstation Map
        </h4>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-400"></span> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500"></span> Discrepancy Alert
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="w-3 h-3 text-cyan-400" /> Cam Stream
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        {workstations.slice(0, 4).map((ws) => (
          <div
            key={ws.id}
            className={`p-3 rounded-lg border text-center transition-all ${
              ws.status === 'ALERT'
                ? 'bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/20 animate-pulse'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-200'
            }`}
          >
            <div className="text-xs font-bold font-heading">{ws.id}</div>
            <div className="text-[10px] mt-1 flex items-center justify-center gap-1">
              {ws.status === 'ALERT' ? (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {ws.alertMsg}
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> All OK
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="py-2 text-center text-[10px] font-bold tracking-widest text-slate-500 border-y border-dashed border-slate-800 mb-4">
        &larr; MAIN LABORATORY AISLE &rarr;
      </div>

      <div className="grid grid-cols-4 gap-4">
        {workstations.slice(4, 8).map((ws) => (
          <div
            key={ws.id}
            className="p-3 rounded-lg border bg-slate-800/60 border-slate-700/80 text-slate-200 text-center"
          >
            <div className="text-xs font-bold font-heading">{ws.id}</div>
            <div className="text-[10px] mt-1 text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> All OK
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
