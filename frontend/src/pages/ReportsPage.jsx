import React, { useState } from 'react';
import { FileText, Printer, Download } from 'lucide-react';
import { SummaryReportModal } from '../components/modals/SummaryReportModal';

export const ReportsPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Academic Session Security Reports
          </h2>
          <p className="text-xs text-slate-400">Generate, review, and export formal academic session security reports.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
        >
          <FileText className="w-4 h-4" /> Generate Final Report
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white font-heading">Recent Academic Session Reports</h3>
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <strong className="text-white block font-heading">Deep Learning & Computer Vision (SE-412)</strong>
            <span className="text-slate-400">Software Engineering AI Lab 1 &bull; Dr. Tabraiz Shams &bull; Today 17:30 - 19:00</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs flex items-center gap-1 transition"
          >
            <Printer className="w-3.5 h-3.5" /> View & Print Report
          </button>
        </div>
      </div>

      <SummaryReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};
