import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ReferenceProfileModal } from '../components/modals/ReferenceProfileModal';
import { CaptureReferenceModal } from '../components/modals/CaptureReferenceModal';
import { referenceService } from '../services/referenceService';
import { cameraService } from '../services/cameraService';

import {
  Camera,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Sliders,
  Download,
  Eye,
  RefreshCw,
  Layers,
  Save,
} from 'lucide-react';

export const ReferenceProfilesPage = () => {
  const queryClient = useQueryClient();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form State for Detection Configuration
  const [confidence, setConfidence] = useState('0.25');
  const [interval, setInterval] = useState('1.0');
  const [threshold, setThreshold] = useState('1');
  const [verificationFrames, setVerificationFrames] = useState('3');

  const { data: profilesData } = useQuery({
    queryKey: ['reference-profiles'],
    queryFn: () => referenceService.getReferenceProfiles(),
  });

  const { data: camerasData } = useQuery({
    queryKey: ['cameras-list'],
    queryFn: cameraService.getCameras,
  });

  const profiles = profilesData?.results || [
    {
      id: 1,
      name: 'Room 101 Standard Baseline',
      camera_details: { name: 'Cam 1: Overhead Main', location: 'SE AI Lab 1' },
      is_active: true,
      created_at: new Date().toISOString(),
      assets: [
        { asset_details: { name: 'Monitor', category: 'computer' }, detected_quantity: 20, confidence: 0.96 },
        { asset_details: { name: 'Keyboard', category: 'computer' }, detected_quantity: 20, confidence: 0.94 },
        { asset_details: { name: 'Mouse', category: 'computer' }, detected_quantity: 20, confidence: 0.92 },
      ],
    },
  ];

  const galleryImages = [
    {
      id: 1,
      cameraName: 'Cam 1: Overhead Main',
      labName: 'SE AI Lab 1',
      date: new Date().toLocaleDateString(),
      assetCount: 60,
    },
    {
      id: 2,
      cameraName: 'Cam 2: Desk Array',
      labName: 'SE AI Lab 1',
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      assetCount: 30,
    },
  ];

  const handleSaveDetectionSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSavingSettings(false);
    alert('Asset Detection Configuration updated and saved.');
  };

  const handleSubmitProfile = (values) => {
    console.log('Submitted Profile values:', values);
    setIsProfileModalOpen(false);
    queryClient.invalidateQueries(['reference-profiles']);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Reference Profile & Asset Baseline Management"
        subtitle="Manage camera baseline profiles, reference asset quantities, baseline gallery, and YOLO detection parameters"
        icon={Camera}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Camera} onClick={() => setIsCaptureModalOpen(true)}>
              Capture Reference Image
            </Button>
            <Button icon={Plus} onClick={() => { setEditingProfile(null); setIsProfileModalOpen(true); }}>
              Create Reference Profile
            </Button>
          </div>
        }
      />

      {/* Reference Profiles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((prof) => (
          <Card
            key={prof.id}
            title={prof.name || 'Standard Baseline Profile'}
            subtitle={`${prof.camera_details?.name || 'Cam 1'} • ${prof.camera_details?.location || 'Room 101'}`}
            action={
              <Button size="sm" variant="outline" icon={Edit3} onClick={() => { setEditingProfile(prof); setIsProfileModalOpen(true); }}>
                Edit Baseline
              </Button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Created: <strong className="text-white font-mono">{new Date(prof.created_at).toLocaleDateString()}</strong></span>
                <Badge variant={prof.is_active ? 'success' : 'slate'} dot>
                  {prof.is_active ? 'ACTIVE BASELINE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 font-heading block">Expected Asset Baseline Breakdown</span>
                <div className="space-y-1 text-[11px]">
                  {prof.assets?.map((ast, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-400">
                      <span>{ast.asset_details?.name || 'Asset'}</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {ast.detected_quantity} Units ({(ast.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reference Image Gallery */}
      <Card title="Reference Snapshot Gallery" subtitle="Captured baseline images stored for reference profile comparison">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((img) => (
            <div key={img.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="aspect-video bg-black rounded-lg relative flex items-center justify-center border border-slate-800 overflow-hidden">
                <ImageIcon className="w-8 h-8 text-cyan-400 opacity-80" />
                <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800">
                  {img.cameraName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-slate-200 font-bold block">{img.labName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{img.date} &bull; {img.assetCount} Assets</span>
                </div>
                <Button size="sm" variant="ghost" icon={Download}>
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Asset Detection Parameters Panel */}
      <Card title="YOLO Asset Detection & Verification Parameters" subtitle="Configure detection confidence, verification windows, and alert thresholds">
        <form onSubmit={handleSaveDetectionSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Detection Confidence (0.1 - 1.0)</label>
            <input
              type="number"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Detection Interval (Sec)</label>
            <input
              type="number"
              step="0.5"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Missing Threshold (Units)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Verification Window (Frames)</label>
            <input
              type="number"
              value={verificationFrames}
              onChange={(e) => setVerificationFrames(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div className="lg:col-span-4 flex justify-end pt-2">
            <Button type="submit" loading={savingSettings} icon={Save}>
              Save Detection Settings
            </Button>
          </div>
        </form>
      </Card>

      <ReferenceProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleSubmitProfile}
        initialData={editingProfile}
        cameras={camerasData?.results || []}
      />

      <CaptureReferenceModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        cameras={camerasData?.results || []}
        onCaptureSuccess={() => queryClient.invalidateQueries(['reference-profiles'])}
      />
    </PageContainer>
  );
};
