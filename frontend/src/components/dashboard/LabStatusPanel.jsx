import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FlaskConical, Camera } from 'lucide-react';

export const LabStatusPanel = ({ labs = [] }) => {
  const labList = labs.length > 0 ? labs : [
    {
      id: 1,
      name: 'Software Engineering AI Lab 1',
      code: 'Room 101',
      cameras_count: 2,
      online_cameras: 2,
      is_monitored: true,
      active_session: 'Deep Learning (SE-412)',
    },
    {
      id: 2,
      name: 'Robotics & Vision Lab 2',
      code: 'Room 202',
      cameras_count: 1,
      online_cameras: 1,
      is_monitored: true,
      active_session: 'Robotics (SE-415)',
    },
  ];

  return (
    <Card
      title="Laboratory Facilities Status Overview"
      subtitle="Computer labs and active monitoring session states"
      className="h-full"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {labList.map((lab) => (
          <div
            key={lab.id}
            className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-white font-heading">{lab.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono">{lab.code}</span>
              </div>
              <Badge variant={lab.is_monitored ? 'success' : 'slate'} dot pulse={lab.is_monitored}>
                {lab.is_monitored ? 'PROTECTED' : 'STANDBY'}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Camera className="w-3.5 h-3.5 text-cyan-400" /> Cameras:
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {lab.online_cameras} / {lab.cameras_count} Online
              </span>
            </div>

            {lab.active_session && (
              <div className="text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800 text-slate-300">
                <span className="text-slate-500 font-semibold block text-[9px] uppercase">Active Session</span>
                <strong className="text-cyan-400 font-heading">{lab.active_session}</strong>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
