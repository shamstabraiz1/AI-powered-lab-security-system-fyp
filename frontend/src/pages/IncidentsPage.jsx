import React, { useState } from 'react';
import { AlertTriangle, Eye, CheckCircle, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { incidentService } from '../services/incidentService';
import { EvidenceModal } from '../components/modals/EvidenceModal';

export const IncidentsPage = () => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: incidentsData } = useQuery({
    queryKey: ['incidents', statusFilter],
    queryFn: () => incidentService.getIncidents({ status: statusFilter }),
  });

  const incidents = incidentsData?.results || [
    {
      id: 15,
      asset_details: { name: 'Mouse' },
      camera_details: { name: 'Cam 1: Overhead Main' },
      lab_details: { name: 'SE AI Lab 1' },
      expected_quantity: 20,
      detected_quantity: 19,
      confidence: 0.92,
      status: 'Open',
      detected_at: new Date().toISOString(),
      description: '1 Mouse unit missing at Workstation PC04.',
    },
  ];

  const handleInspect = (inc) => {
    setSelectedIncident({
      id: inc.id,
      assetName: inc.asset_details?.name || 'Mouse',
      cameraName: inc.camera_details?.name || 'Cam 1',
      labName: inc.lab_details?.name || 'SE AI Lab 1',
      confidence: inc.confidence,
      time: new Date(inc.detected_at).toLocaleTimeString(),
      missing: inc.expected_quantity - inc.detected_quantity,
    });
    setIsEvidenceOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Security Incidents Management
          </h2>
          <p className="text-xs text-slate-400">Review missing asset security incidents, verified anomalies, and video evidence.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap justify-between gap-4 items-center text-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search asset or camera..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <span className="text-slate-400 font-semibold">{incidents.length} Incident(s) Logged</span>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 uppercase text-[11px]">
              <th className="p-3">ID</th>
              <th className="p-3">Asset</th>
              <th className="p-3">Camera</th>
              <th className="p-3">Expected / Detected</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {incidents.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-800/30 transition">
                <td className="p-3 font-bold text-white">#{inc.id}</td>
                <td className="p-3 font-bold text-cyan-400">{inc.asset_details?.name || 'Asset'}</td>
                <td className="p-3 text-slate-300">{inc.camera_details?.name}</td>
                <td className="p-3 text-slate-300">{inc.expected_quantity} / {inc.detected_quantity} (<span className="text-red-400 font-bold">-{inc.expected_quantity - inc.detected_quantity}</span>)</td>
                <td className="p-3 font-bold text-emerald-400">{(inc.confidence * 100).toFixed(1)}%</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {inc.status}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleInspect(inc)}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                  >
                    <Eye className="w-3 h-3" /> View Evidence
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EvidenceModal isOpen={isEvidenceOpen} onClose={() => setIsEvidenceOpen(false)} incident={selectedIncident} />
    </div>
  );
};
