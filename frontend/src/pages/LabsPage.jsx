import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LabModal } from '../components/modals/LabModal';
import { labService } from '../services/labService';
import { FlaskConical, Plus, Search, Edit3, Trash2, Camera, Users, Building } from 'lucide-react';

export const LabsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);

  const { data: labsData, isLoading } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const labs = labsData?.results || [
    {
      id: 1,
      name: 'Software Engineering AI Lab 1',
      code: 'Room 101',
      floor: '1st Floor',
      department: 'Department of Software Engineering',
      capacity: 30,
      description: 'AI & Computer Vision Workstation Lab',
      is_active: true,
      cameras_count: 2,
      online_cameras: 2,
    },
    {
      id: 2,
      name: 'Robotics & Vision Lab 2',
      code: 'Room 202',
      floor: '2nd Floor',
      department: 'Department of Software Engineering',
      capacity: 25,
      description: 'Autonomous Systems & Embedded Robotics',
      is_active: true,
      cameras_count: 1,
      online_cameras: 1,
    },
  ];

  const filteredLabs = labs.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingLab(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lab) => {
    setEditingLab(lab);
    setIsModalOpen(true);
  };

  const handleSubmitLab = (values) => {
    console.log('Submitted Lab values:', values);
    setIsModalOpen(false);
    queryClient.invalidateQueries(['labs-list']);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Laboratory Facility Management"
        subtitle="Manage software engineering computer laboratories, workstation capacity, and security cameras"
        icon={FlaskConical}
        actions={
          <Button icon={Plus} onClick={handleOpenCreate}>
            Create Laboratory
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search laboratory name or room code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredLabs.length} Laboratory(ies)</span>
      </div>

      {/* Labs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredLabs.map((lab) => (
          <Card
            key={lab.id}
            title={lab.name}
            subtitle={`${lab.department} • ${lab.floor}`}
            action={
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" icon={Edit3} onClick={() => handleOpenEdit(lab)}>
                  Edit
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Room Code: <strong className="text-white font-mono">{lab.code}</strong></span>
                <Badge variant={lab.is_active ? 'success' : 'slate'} dot>
                  {lab.is_active ? 'Active & Monitored' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-slate-300 leading-relaxed">{lab.description}</p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Capacity: <strong className="text-white font-bold">{lab.capacity} Units</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CCTV: <strong className="text-emerald-400 font-bold">{lab.online_cameras || 2} Online</strong></span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <LabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitLab}
        initialData={editingLab}
      />
    </PageContainer>
  );
};
