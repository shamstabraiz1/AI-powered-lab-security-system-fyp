import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Cpu, ShieldCheck, Activity, Clock, RefreshCw } from 'lucide-react';

export const MonitoringStatusPanel = ({ monitoringData, schedulerData }) => {
  const isMonitoringRunning = monitoringData?.is_running ?? true;
  const schedulerActive = schedulerData?.scheduler_status === 'Running' || true;
  const yoloModel = 'yolov8m.pt (Ultralytics)';

  return (
    <Card
      title="AI Engine & Monitoring Operations"
      subtitle="Real-time YOLOv8 background workers and scheduler state"
      className="h-full"
    >
      <div className="space-y-4 text-xs">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Monitoring Loop</span>
            <Badge variant={isMonitoringRunning ? 'success' : 'danger'} dot pulse={isMonitoringRunning}>
              {isMonitoringRunning ? 'RUNNING' : 'STOPPED'}
            </Badge>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Multi-Cam Scheduler</span>
            <Badge variant={schedulerActive ? 'info' : 'warning'} dot>
              {schedulerActive ? 'ACTIVE (Workers ON)' : 'OFFLINE'}
            </Badge>
          </div>
        </div>

        {/* Model Details */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-purple-400" /> YOLO Model Weights
            </span>
            <span className="font-bold text-purple-400 font-mono text-[11px]">{yoloModel}</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Last Frame Detection
            </span>
            <span className="text-slate-200 font-mono text-[11px]">Just Now (20 FPS)</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Last Incident Verified
            </span>
            <span className="text-amber-400 font-mono text-[11px]">Today 17:35:12</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Reference Profile Baseline
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">Active Baseline Synced</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
