import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Search, Eye, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { EvidenceModal } from '../modals/EvidenceModal';

export const RecentIncidentsTable = ({ incidents = [], isLoading }) => {
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mockIncidents = incidents.length > 0 ? incidents : [
    {
      id: 15,
      lab_details: { name: 'SE AI Lab 1' },
      camera_details: { name: 'Cam 1: Overhead Main' },
      asset_details: { name: 'Mouse' },
      severity: 'CRITICAL',
      status: 'Open',
      detected_at: new Date().toISOString(),
      expected_quantity: 20,
      detected_quantity: 19,
      confidence: 0.92,
    },
    {
      id: 14,
      lab_details: { name: 'SE AI Lab 1' },
      camera_details: { name: 'Cam 2: Desk Array' },
      asset_details: { name: 'Keyboard' },
      severity: 'WARNING',
      status: 'Investigating',
      detected_at: new Date(Date.now() - 3600000).toISOString(),
      expected_quantity: 20,
      detected_quantity: 20,
      confidence: 0.95,
    },
  ];

  const filteredIncidents = mockIncidents.filter((inc) => {
    const term = search.toLowerCase();
    return (
      inc.asset_details?.name?.toLowerCase().includes(term) ||
      inc.camera_details?.name?.toLowerCase().includes(term) ||
      inc.lab_details?.name?.toLowerCase().includes(term)
    );
  });

  const handleInspect = (inc) => {
    setSelectedIncident({
      id: inc.id,
      assetName: inc.asset_details?.name || 'Asset',
      cameraName: inc.camera_details?.name || 'Camera',
      labName: inc.lab_details?.name || 'Lab',
      confidence: inc.confidence || 0.92,
      time: new Date(inc.detected_at).toLocaleTimeString(),
      missing: inc.missing_quantity || ((inc.expected_quantity || 1) - (inc.detected_quantity || 0)),
      image: inc.evidence_details?.image || inc.evidence?.image || inc.image,
      video: inc.evidence_details?.video || inc.evidence?.video || inc.video,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <Card
        title="Recent Security Incidents"
        subtitle="Discrepancy anomalies detected by YOLOv8 vision engine"
        action={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Search incident..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                <th className="p-3">ID</th>
                <th className="p-3">Lab</th>
                <th className="p-3">Camera</th>
                <th className="p-3">Asset</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-white font-mono">#{inc.id}</td>
                  <td className="p-3 font-semibold text-slate-200">{inc.lab_details?.name}</td>
                  <td className="p-3 text-slate-300">{inc.camera_details?.name}</td>
                  <td className="p-3 font-bold text-cyan-400">{inc.asset_details?.name}</td>
                  <td className="p-3">
                    <Badge variant={inc.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {inc.severity}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    {new Date(inc.detected_at).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleInspect(inc)}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3 h-3" /> View Evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EvidenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} incident={selectedIncident} />
    </>
  );
};
