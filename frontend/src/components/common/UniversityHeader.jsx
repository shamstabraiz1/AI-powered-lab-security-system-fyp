import React from 'react';
import { Award, Clock, GraduationCap } from 'lucide-react';
import { useRealtimeClock } from '../../hooks/useRealtimeClock';

export const UniversityHeader = () => {
  const { formattedClock } = useRealtimeClock();

  return (
    <header className="bg-slate-950 border-b-2 border-blue-600 text-slate-100 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
              DEPARTMENT OF SOFTWARE ENGINEERING
            </span>
            <h1 className="text-base font-extrabold text-white leading-tight font-heading">
              AI Powered Laboratory Security & Asset Monitoring System
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1 text-blue-400 font-semibold">
                <Award className="w-3.5 h-3.5" /> Final Year Project
              </span>
              <span>&bull;</span>
              <span>Academic Session: Spring 2026</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg text-right shadow-inner">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> REAL-TIME SYSTEM CLOCK
            </span>
            <span className="font-mono text-xs font-bold text-cyan-400 leading-none">
              {formattedClock}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
