import React, { useState } from 'react';
import { FileVideo, Download, Image as ImageIcon, Video, Eye } from 'lucide-react';
import { EvidenceModal } from '../components/modals/EvidenceModal';

export const EvidencePage = () => {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const evidenceList = [
    {
      id: 15,
      incidentId: 15,
      assetName: 'Mouse',
      cameraName: 'Cam 1: Overhead Main',
      time: '17:35:12',
      confidence: 0.92,
      hasVideo: true,
      hasImage: true,
    },
  ];

  const handleInspect = (ev) => {
    setSelectedEvidence(ev);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-blue-400" /> Evidence Library & Archive
          </h2>
          <p className="text-xs text-slate-400">Stream recorded video clips (10s pre-event buffer) and snapshot images.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {evidenceList.map((ev) => (
          <div key={ev.id} className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <Video className="w-12 h-12 text-blue-400 opacity-80" />
              <span className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded">
                Incident #{ev.incidentId} MP4
              </span>
            </div>
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-bold text-white font-heading">Incident #{ev.incidentId} Evidence</h3>
              <p className="text-xs text-slate-400">{ev.assetName} missing at Workstation PC04 ({ev.cameraName})</p>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleInspect(ev)}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect Evidence
                </button>
                <a
                  href={`/api/evidence/${ev.id}/download/`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Download Package"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EvidenceModal isOpen={isOpen} onClose={() => setIsOpen(false)} incident={selectedEvidence} />
    </div>
  );
};
