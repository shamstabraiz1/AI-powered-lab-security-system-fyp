import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LabModal } from '../components/modals/LabModal';
import { labService } from '../services/labService';
import { FlaskConical, Plus, Search, Edit3, Trash2, Camera, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LabsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [serverError, setServerError] = useState('');

  // 1. Fetch Labs Query
  const { data: labsData, isLoading, isError, error } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const labsList = labsData?.results || (Array.isArray(labsData) ? labsData : []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 2. Create Lab Mutation
  const createMutation = useMutation({
    mutationFn: (values) => labService.createLab(values),
    onSuccess: (newLab) => {
      console.log('[LABS PAGE] Created Lab Success:', newLab);
      queryClient.invalidateQueries({ queryKey: ['labs-list'] });
      showToast(`Laboratory "${newLab.name}" created successfully!`);
      setIsModalOpen(false);
      setServerError('');
    },
    onError: (err) => {
      console.error('[LABS PAGE] Create Lab Error:', err);
      const apiErr = err.response?.data;
      setServerError(
        typeof apiErr === 'string'
          ? apiErr
          : apiErr?.name?.[0] || apiErr?.detail || 'Failed to create laboratory.'
      );
    },
  });

  // 3. Update Lab Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => labService.updateLab(id, data),
    onSuccess: (updatedLab) => {
      console.log('[LABS PAGE] Updated Lab Success:', updatedLab);
      queryClient.invalidateQueries({ queryKey: ['labs-list'] });
      showToast(`Laboratory "${updatedLab.name}" updated successfully!`);
      setIsModalOpen(false);
      setServerError('');
    },
    onError: (err) => {
      console.error('[LABS PAGE] Update Lab Error:', err);
      const apiErr = err.response?.data;
      setServerError(
        typeof apiErr === 'string'
          ? apiErr
          : apiErr?.name?.[0] || apiErr?.detail || 'Failed to update laboratory.'
      );
    },
  });

  // 4. Delete Lab Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => labService.deleteLab(id),
    onSuccess: () => {
      console.log('[LABS PAGE] Deleted Lab Success');
      queryClient.invalidateQueries({ queryKey: ['labs-list'] });
      showToast('Laboratory deleted successfully.');
    },
    onError: (err) => {
      console.error('[LABS PAGE] Delete Lab Error:', err);
      alert('Failed to delete laboratory.');
    },
  });

  const filteredLabs = labsList.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingLab(null);
    setServerError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab) => {
    setEditingLab(lab);
    setServerError('');
    setIsModalOpen(true);
  };

  const handleDelete = (lab) => {
    if (confirm(`Are you sure you want to delete laboratory "${lab.name}"?`)) {
      deleteMutation.mutate(lab.id);
    }
  };

  const handleSubmitLab = (values) => {
    if (editingLab) {
      updateMutation.mutate({ id: editingLab.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Laboratory Facility Management"
        subtitle="Manage computer laboratories and security monitoring settings"
        icon={FlaskConical}
        actions={
          <Button icon={Plus} onClick={handleOpenCreate}>
            Create Laboratory
          </Button>
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

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search laboratory name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredLabs.length} Laboratory(ies)</span>
      </div>

      {/* Loading & Empty States */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading laboratories...</div>
      ) : filteredLabs.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center text-slate-400 text-xs">
          No laboratories found. Click "Create Laboratory" to add one.
        </div>
      ) : (
        /* Labs Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map((lab) => (
            <Card
              key={lab.id}
              title={lab.name}
              subtitle={`Created: ${new Date(lab.created_at || Date.now()).toLocaleDateString()}`}
              action={
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" icon={Edit3} onClick={() => handleOpenEdit(lab)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(lab)} className="text-red-400 hover:text-red-300">
                    Delete
                  </Button>
                </div>
              }
            >
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant={lab.is_active ?? true ? 'success' : 'slate'} dot>
                    {lab.is_active ?? true ? 'Active & Monitored' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cameras: <strong className="text-emerald-400 font-bold">{lab.cameras_count ?? 0} Connected</strong></span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitLab}
        initialData={editingLab}
        isLoading={createMutation.isPending || updateMutation.isPending}
        serverError={serverError}
      />
    </PageContainer>
  );
};
