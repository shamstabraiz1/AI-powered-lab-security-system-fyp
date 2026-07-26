import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceModal } from '../components/modals/EvidenceModal';
import { evidenceService } from '../services/evidenceService';
import {
  FileVideo,
  Search,
  Eye,
  Play,
} from 'lucide-react';

export const EvidencePage = () => {
  const [search, setSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const { data: evidenceData, isLoading } = useQuery({
    queryKey: ['evidence-list'],
    queryFn: () => evidenceService.getEvidenceList(),
  });

  const evidenceList = evidenceData?.results || (Array.isArray(evidenceData) ? evidenceData : []);

  const filteredEvidence = evidenceList.filter((ev) => {
    const term = search.toLowerCase();
    return (
      (ev.camera_name && ev.camera_name.toLowerCase().includes(term)) ||
      (ev.lab_name && ev.lab_name.toLowerCase().includes(term)) ||
      (ev.asset_name && ev.asset_name.toLowerCase().includes(term))
    );
  });

  return (
    <PageContainer>
      <PageHeader
        title="Video Evidence Center & Forensic Archive"
        subtitle="Access high-definition frame snapshots, 10-second pre/post video clips, and chronological audit timelines"
        icon={FileVideo}
      />

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
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading evidence archives from database...</div>
      ) : filteredEvidence.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center text-slate-400 text-xs">
          No evidence records found in database. Evidence clips will be generated automatically when security incidents occur.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvidence.map((ev) => (
            <Card
              key={ev.id}
              title={`Evidence Package #EV-${ev.id}`}
              subtitle={`${ev.camera_name || 'Camera'} • ${ev.lab_name || 'Lab'}`}
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
                    <span className="text-[10px] text-white font-mono mt-1">Play Recorded Video Clip</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                  <div>Missing Asset: <strong className="text-red-400">{ev.asset_name || 'Asset'} (-{ev.missing_quantity || 1})</strong></div>
                  <div>Confidence: <strong className="text-cyan-400 font-mono">{((ev.confidence || 0.94) * 100).toFixed(0)}%</strong></div>
                  <div>Timestamp: <strong className="text-white font-mono">{new Date(ev.created_at || Date.now()).toLocaleTimeString()}</strong></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EvidenceModal isOpen={!!selectedEvidence} onClose={() => setSelectedEvidence(null)} incident={selectedEvidence} />
    </PageContainer>
  );
};
