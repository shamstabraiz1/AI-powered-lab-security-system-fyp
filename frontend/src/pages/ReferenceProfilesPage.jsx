import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ReferenceProfileModal } from '../components/modals/ReferenceProfileModal';
import { ReferenceCaptureWizardModal } from '../components/modals/ReferenceCaptureWizardModal';
import { referenceService } from '../services/referenceService';
import { cameraService } from '../services/cameraService';
import { labService } from '../services/labService';

import {
  Camera,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Download,
  Wand2,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReferenceProfilesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Queries
  const { data: profilesData, isLoading } = useQuery({
    queryKey: ['reference-profiles'],
    queryFn: () => referenceService.getReferenceProfiles(),
  });

  const { data: camerasData } = useQuery({
    queryKey: ['cameras-list'],
    queryFn: cameraService.getCameras,
  });

  const { data: labsData } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const profilesList = profilesData?.results || (Array.isArray(profilesData) ? profilesData : []);
  const camerasList = camerasData?.results || (Array.isArray(camerasData) ? camerasData : []);
  const labsList = labsData?.results || (Array.isArray(labsData) ? labsData : []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Mutations
  const activateMutation = useMutation({
    mutationFn: (id) => referenceService.activateProfile(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reference-profiles'] });
      showToast(data.message || 'Reference Profile activated successfully!');
    },
    onError: () => alert('Failed to activate profile.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => referenceService.deleteReferenceProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-profiles'] });
      showToast('Reference Profile deleted.');
    },
    onError: () => alert('Failed to delete reference profile.'),
  });

  const handleActivate = (prof) => {
    if (confirm(`Are you sure you want to activate "${prof.name}"? This will deactivate any existing active profile for ${prof.lab_details?.name || 'this laboratory'}.`)) {
      activateMutation.mutate(prof.id);
    }
  };

  const handleDelete = (prof) => {
    if (confirm(`Are you sure you want to delete reference profile "${prof.name}"?`)) {
      deleteMutation.mutate(prof.id);
    }
  };

  const filteredProfiles = profilesList.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.lab_details?.name && p.lab_details.name.toLowerCase().includes(term)) ||
      (p.created_by && p.created_by.toLowerCase().includes(term))
    );
  });

  return (
    <PageContainer>
      <PageHeader
        title="Reference Profile & Baseline Asset Management"
        subtitle="Manage baseline reference profiles, capture wizard snapshots, asset counts, and active security configurations"
        icon={Camera}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Wand2} onClick={() => setIsWizardOpen(true)}>
              Capture Wizard
            </Button>
            <Button icon={Plus} onClick={() => { setEditingProfile(null); setIsProfileModalOpen(true); }}>
              Create Reference Profile
            </Button>
          </div>
        }
      />

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search profile name, laboratory, or creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredProfiles.length} Profile(s) Configured</span>
      </div>

      {/* Reference Profiles Data Table */}
      <Card title="Reference Baseline Profiles" subtitle="Only one Reference Profile can be Active per laboratory at any given time">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading reference profiles from database...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No reference profiles stored in database. Click "Create Reference Profile" or "Capture Wizard" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Profile Name</th>
                  <th className="p-3">Laboratory</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3">Cameras</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProfiles.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white font-heading">{prof.name}</td>
                    <td className="p-3 font-semibold text-cyan-400">{prof.lab_details?.name || 'Lab'}</td>
                    <td className="p-3 text-slate-300">{prof.created_by || 'Staff'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{new Date(prof.created_at || Date.now()).toLocaleDateString()}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">{prof.cameras_count ?? 0} Camera(s)</td>
                    <td className="p-3">
                      <Badge variant={prof.is_active ? 'success' : 'slate'} dot>
                        {prof.is_active ? 'ACTIVE BASELINE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {!prof.is_active && (
                          <Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => handleActivate(prof)}>
                            Activate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" icon={Edit3} onClick={() => { setEditingProfile(prof); setIsProfileModalOpen(true); }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(prof)} className="text-red-400 hover:text-red-300">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <ReferenceProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={() => {
          setIsProfileModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['reference-profiles'] });
          showToast('Reference Profile saved successfully!');
        }}
        initialData={editingProfile}
        cameras={camerasList}
      />

      <ReferenceCaptureWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        labs={labsList}
        cameras={camerasList}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['reference-profiles'] });
          showToast('Reference Baseline Wizard completed and profile activated!');
        }}
      />
    </PageContainer>
  );
};
