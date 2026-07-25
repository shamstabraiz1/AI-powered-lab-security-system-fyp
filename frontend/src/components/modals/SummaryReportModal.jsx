import React from 'react';
import { X, Printer, FileText, GraduationCap, ShieldCheck } from 'lucide-react';


export const SummaryReportModal = ({ isOpen, onClose, sessionData }) => {
  if (!isOpen) return null;

  const data = sessionData || {
    instructor: 'Dr. Tabraiz Shams',
    course: 'Deep Learning & Computer Vision (SE-412)',
    lab: 'Software Engineering AI Lab 1 (Room 101)',
    topic: 'Lab 08: Real-Time YOLOv8 Object Tracking',
    startTime: '17:30:00',
    endTime: '19:00:00',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto printable-area">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 no-print">
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" /> Academic Session Final Security Report
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Academic Report Body */}
        <div className="space-y-6 my-4 text-slate-200">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-white font-heading">DEPARTMENT OF SOFTWARE ENGINEERING</h2>
              <p className="text-xs text-slate-400">AI Powered Laboratory Security & Asset Monitoring System</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-400 font-bold">
              SE
            </div>
          </div>

          {/* Section 1: Session Metadata */}
          <div>
            <h4 className="text-sm font-bold text-cyan-400 mb-2 font-heading">1. SESSION METADATA</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div><strong>Instructor:</strong> {data.instructor}</div>
              <div><strong>Course:</strong> {data.course}</div>
              <div><strong>Lab Location:</strong> {data.lab}</div>
              <div><strong>Session Topic:</strong> {data.topic}</div>
              <div><strong>Start Time:</strong> {data.startTime}</div>
              <div><strong>End Time:</strong> {data.endTime}</div>
            </div>
          </div>

          {/* Section 2: Final Asset Audit */}
          <div>
            <h4 className="text-sm font-bold text-cyan-400 mb-2 font-heading">2. FINAL ASSET AUDIT</h4>
            <table className="w-full text-left text-xs border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300">
                  <th className="p-2.5 border border-slate-800">Asset Category</th>
                  <th className="p-2.5 border border-slate-800">Reference Baseline</th>
                  <th className="p-2.5 border border-slate-800">Final Audit Count</th>
                  <th className="p-2.5 border border-slate-800">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr><td className="p-2.5">Monitors</td><td className="p-2.5">20</td><td className="p-2.5">20</td><td className="p-2.5 text-emerald-400 font-bold">Verified OK</td></tr>
                <tr><td className="p-2.5">Keyboards</td><td className="p-2.5">20</td><td className="p-2.5">20</td><td className="p-2.5 text-emerald-400 font-bold">Verified OK</td></tr>
                <tr><td className="p-2.5">Mice</td><td className="p-2.5">20</td><td className="p-2.5">19</td><td className="p-2.5 text-red-400 font-bold">1 Missing (Alerted)</td></tr>
                <tr><td className="p-2.5">Laptops</td><td className="p-2.5">10</td><td className="p-2.5">10</td><td className="p-2.5 text-emerald-400 font-bold">Verified OK</td></tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: AI Engine Statistics */}
          <div>
            <h4 className="text-sm font-bold text-cyan-400 mb-2 font-heading">3. AI ENGINE STATISTICS</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div><strong>Detection Accuracy:</strong> 96.85%</div>
              <div><strong>Frames Processed:</strong> 108,000 Frames</div>
              <div><strong>Avg Inference Time:</strong> 14.2 ms / frame</div>
              <div><strong>Camera Uptime:</strong> 100% (2/2 Cameras)</div>
              <div><strong>Scheduler Performance:</strong> Stable</div>
              <div><strong>System Health:</strong> HEALTHY</div>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-8 flex justify-between items-end text-xs border-t border-dashed border-slate-800">
            <div className="w-1/3">
              <p className="border-b border-slate-700 pb-1 mb-1">Instructor Signature:</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="border-2 border-dashed border-cyan-500/40 p-2 text-[10px] text-cyan-400 font-bold rounded">
                [ DEPARTMENT SEAL ]
              </div>
            </div>
            <div className="w-1/3 text-right">
              <p className="border-b border-slate-700 pb-1 mb-1">Security Officer Signature:</p>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
