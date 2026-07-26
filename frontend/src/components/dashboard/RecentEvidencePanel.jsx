import React from 'react';
import { Card } from '../ui/Card';
import { FileVideo, Download, Play, Video } from 'lucide-react';

export const RecentEvidencePanel = ({ evidenceList = [] }) => {
  const list = evidenceList.length > 0 ? evidenceList : [
    {
      id: 15,
      incident: 15,
      camera_name: 'Cam 1: Overhead Main',
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <Card
      title="Recent Video Evidence Clips"
      subtitle="Recorded 10s pre-event + 10s post-event evidence MP4 packages"
      className="h-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.map((ev) => (
          <div
            key={ev.id}
            className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-2 group hover:border-slate-700 transition"
          >
            <div className="aspect-video bg-black rounded relative flex items-center justify-center overflow-hidden border border-slate-800">
              <Video className="w-8 h-8 text-blue-400/80 group-hover:scale-110 transition" />
              <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800">
                Incident #{ev.incident}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block truncate font-heading">
                  {ev.camera_name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <a
                href={`/api/evidence/${ev.id}/download/`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Download MP4 Evidence"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
