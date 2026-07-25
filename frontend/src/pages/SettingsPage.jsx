import React from 'react';
import { Settings, Save, Sliders, Shield, Database, Cpu } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" /> System Settings & AI Engine Parameters
          </h2>
          <p className="text-xs text-slate-400">Configure YOLOv8 confidence thresholds, verification windows, and evidence video buffers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 font-heading flex items-center gap-2">
            <Cpu className="w-4 h-4" /> AI Engine Configuration
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">YOLO Model Weights</label>
              <input type="text" value="yolov8m.pt (Ultralytics Medium)" disabled className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-300" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Confidence Threshold (0.25)</label>
              <input type="number" defaultValue={0.25} step={0.05} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Verification Window (Frames)</label>
              <input type="number" defaultValue={3} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 font-heading flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Video Evidence Configuration
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Pre-Event Buffer (Seconds)</label>
              <input type="number" defaultValue={10} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Post-Event Record (Seconds)</label>
              <input type="number" defaultValue={10} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Notification Cooldown (Seconds)</label>
              <input type="number" defaultValue={300} className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
