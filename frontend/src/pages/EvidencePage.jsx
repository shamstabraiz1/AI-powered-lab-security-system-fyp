import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EvidenceModal } from '../components/modals/EvidenceModal';
import { evidenceService } from '../services/evidenceService';
import {
  FileVideo,
  Search,
  Download,
  Eye,
  Camera,
  Play,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const EvidencePage = () => {
  const [search, setSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const { data: evidenceData, isLoading } = useQuery({
    queryKey: ['evidence-list'],
    queryFn: () => evidenceService.getEvidenceList(),
  });

  const evidenceList = evidenceData?.results || (Array.isArray(evidenceData) ? evidenceData : [
    {
      id: 501,
      incident_id: 881,
      camera_name: 'Cam 1: Overhead Main',
      lab_name: 'Software Engineering AI Lab 1',
      asset_name: 'Mouse',
      missing_quantity: 1,
      timestamp: new Date().toISOString(),
      file_size: '14.2 MB',
      confidence: 0.94,
    },
    {
      id: 502,
      incident_id: 882,
      camera_name: 'Cam 2: Desk Array',
      lab_name: 'Software Engineering AI Lab 1',
      asset_name: 'Keyboard',
      missing_quantity: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      file_size: '18.6 MB',
      confidence: 0.92,
    },
  ]);

  const filteredEvidence = evidenceList.filter((ev) => {
    const term = search.toLowerCase();
    return (
      (ev.camera_name && ev.camera_name.toLowerCase().includes(term)) ||
      (ev.lab_name && ev.lab_name.toLowerCase().includes(term)) ||
      (ev.asset_name && ev.asset_name.toLowerCase().includes(term))
    );
  });

  const timelineSteps = [
    { step: 'Reference Baseline Image Captured', time: '09:00 AM', status: 'Completed ✓' },
    { step: 'Session Monitoring Started', time: '09:05 AM', status: 'Completed ✓' },
    { step: 'YOLO Missing Asset Detected (Mouse -1)', time: '09:42 AM', status: 'Detected' },
    { step: '3-Frame Verification Window Passed', time: '09:42 AM', status: 'Verified' },
    { step: 'Incident #INC-881 Registered', time: '09:42 AM', status: 'Registered' },
    { step: 'Pre/Post 10s MP4 Clip Recorded', time: '09:42 AM', status: 'Recorded' },
    { step: 'Security Notification Dispatched', time: '09:42 AM', status: 'Sent' },
    { step: 'Officer Review & Audit', time: '09:45 AM', status: 'Under Review' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Video Evidence Center & Forensic Archive"
        subtitle="Access high-definition frame snapshots, 10-second pre/post video clips, and chronological audit timelines"
        icon={FileVideo}
      />

      {/* Audit Timeline */}
      <Card title="Chronological Evidence Audit Timeline" subtitle="Verification steps executed from initial camera snapshot to evidence recording">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {timelineSteps.map((t, idx) => (
            <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 relative">
              <span className="text-[10px] font-mono text-cyan-400 block">{t.time}</span>
              <strong className="text-white block font-heading text-xs">{t.step}</strong>
              <Badge variant="success" dot>{t.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search evidence by camera, lab, or missing asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredEvidence.length} Evidence Record(s)</span>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvidence.map((ev) => (
          <Card
            key={ev.id}
            title={`Evidence Package #EV-${ev.id}`}
            subtitle={`${ev.camera_name} • ${ev.lab_name}`}
            action={
              <Button size="sm" variant="outline" icon={Eye} onClick={() => setSelectedEvidence(ev)}>
                Inspect Evidence
              </Button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center group cursor-pointer" onClick={() => setSelectedEvidence(ev)}>
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center group-hover:bg-slate-950/60 transition">
                  <Play className="w-10 h-10 text-cyan-400 opacity-90 group-hover:scale-110 transition" />
                  <span className="text-[10px] text-white font-mono mt-1">Play 10s Video Clip ({ev.file_size})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div>Missing Asset: <strong className="text-red-400">{ev.asset_name} (-{ev.missing_quantity})</strong></div>
                <div>Confidence: <strong className="text-cyan-400 font-mono">{((ev.confidence || 0.94) * 100).toFixed(0)}%</strong></div>
                <div>Timestamp: <strong className="text-white font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</strong></div>
                <div>File Size: <strong className="text-emerald-400 font-mono">{ev.file_size}</strong></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <EvidenceModal isOpen={!!selectedEvidence} onClose={() => setSelectedEvidence(null)} incident={selectedEvidence} />
    </PageContainer>
  );
};
