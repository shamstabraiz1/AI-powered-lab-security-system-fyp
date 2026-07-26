import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SessionModal } from '../components/modals/SessionModal';
import { sessionService } from '../services/sessionService';
import { labService } from '../services/labService';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Square,
  CheckCircle,
  RefreshCw,
  Search,
  FileText,
  Printer,
  X,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SessionsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [serverError, setServerError] = useState('');

  // Queries
  const { data: sessionsData, isLoading, isRefetching } = useQuery({
    queryKey: ['sessions-list'],
    queryFn: () => sessionService.getSessions(),
  });

  const { data: labsData } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const sessionsList = sessionsData?.results || (Array.isArray(sessionsData) ? sessionsData : []);
  const labsList = labsData?.results || (Array.isArray(labsData) ? labsData : []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values) => sessionService.createSession(values),
    onSuccess: (newSes) => {
      queryClient.invalidateQueries({ queryKey: ['sessions-list'] });
      showToast(`Lab Session #${newSes.session_id} started successfully!`);
      setIsModalOpen(false);
      setServerError('');
    },
    onError: (err) => {
      const apiErr = err.response?.data;
      setServerError(
        typeof apiErr === 'string'
          ? apiErr
          : apiErr?.error || apiErr?.detail || 'Failed to start lab session.'
      );
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id) => sessionService.pauseSession(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions-list'] });
      showToast(res.message || 'Session paused.');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id) => sessionService.resumeSession(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions-list'] });
      showToast(res.message || 'Session resumed.');
    },
  });

  const endMutation = useMutation({
    mutationFn: (id) => sessionService.endSession(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sessions-list'] });
      showToast('Lab Session ended. Final report generated.');
      setSelectedSummary(res.session);
    },
  });

  const activeSession = sessionsList.find((s) => s.status === 'Active' || s.status === 'Paused');
  const filteredSessions = sessionsList.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.session_id && s.session_id.toLowerCase().includes(term)) ||
      (s.instructor_name && s.instructor_name.toLowerCase().includes(term)) ||
      (s.course_name && s.course_name.toLowerCase().includes(term)) ||
      (s.session_topic && s.session_topic.toLowerCase().includes(term))
    );
  });

  const handleOpenCreate = () => {
    setServerError('');
    setIsModalOpen(true);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Academic Laboratory Session Management"
        subtitle="Manage academic lab sessions, instructor schedules, real-time AI monitoring session lifecycles, and session reports"
        icon={FlaskConical}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={() => queryClient.invalidateQueries({ queryKey: ['sessions-list'] })}>
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button icon={Plus} onClick={handleOpenCreate}>
              Start New Lab Session
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

      {/* Active Session Dashboard Card */}
      {activeSession ? (
        <Card
          title={`Active Session Dashboard &bull; #${activeSession.session_id}`}
          subtitle={`${activeSession.course_name} (${activeSession.course_code || 'SE-402'})`}
          action={
            <div className="flex items-center gap-2">
              {activeSession.status === 'Active' ? (
                <Button size="sm" variant="warning" icon={Pause} onClick={() => pauseMutation.mutate(activeSession.id)} loading={pauseMutation.isPending}>
                  Pause Session
                </Button>
              ) : (
                <Button size="sm" variant="primary" icon={Play} onClick={() => resumeMutation.mutate(activeSession.id)} loading={resumeMutation.isPending}>
                  Resume Session
                </Button>
              )}
              <Button size="sm" variant="danger" icon={Square} onClick={() => endMutation.mutate(activeSession.id)} loading={endMutation.isPending}>
                End Session & Finalize Report
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Instructor:</span>
                <strong className="text-white text-sm font-heading">{activeSession.instructor_name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Session Topic:</span>
                <strong className="text-cyan-400 text-sm font-heading">{activeSession.session_topic}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Laboratory:</span>
                <strong className="text-white text-sm font-heading">{activeSession.lab_details?.name || 'Lab'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Session Status</span>
                <Badge variant={activeSession.status === 'Active' ? 'success' : 'warning'} dot>
                  {activeSession.status.toUpperCase()}
                </Badge>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Planned Duration</span>
                <strong className="text-cyan-400 font-mono font-bold text-sm">{activeSession.planned_duration} Mins</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Active Cameras</span>
                <strong className="text-emerald-400 font-mono font-bold text-sm">{activeSession.cameras_count || 0} Online</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Start Time</span>
                <strong className="text-slate-200 font-mono text-xs">{new Date(activeSession.start_time || Date.now()).toLocaleTimeString()}</strong>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2">
          <FlaskConical className="w-10 h-10 text-blue-400 mx-auto opacity-80" />
          <h3 className="text-base font-extrabold text-white font-heading">No Active Session Running</h3>
          <p className="text-slate-400 text-xs">Click "Start New Lab Session" to launch AI monitoring for a lab session.</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search session ID, instructor, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">{filteredSessions.length} Session(s) Logged</span>
      </div>

      {/* Sessions History Table */}
      <Card title="Academic Lab Sessions History" subtitle="Archive of completed and previous academic sessions">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading sessions from database...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No lab sessions stored in database. Click "Start New Lab Session" to record a session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Instructor & Course</th>
                  <th className="p-3">Laboratory</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((ses) => (
                  <tr key={ses.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-white">#{ses.session_id}</td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{ses.instructor_name}</span>
                      <span className="text-[10px] text-cyan-400">{ses.course_name} ({ses.course_code || 'SE-402'})</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-300">{ses.lab_details?.name || 'Lab'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{ses.planned_duration} Mins</td>
                    <td className="p-3">
                      <Badge variant={ses.status === 'Active' ? 'success' : ses.status === 'Paused' ? 'warning' : 'slate'} dot>
                        {ses.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" icon={FileText} onClick={() => setSelectedSummary(ses)}>
                        View Summary
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Session Modal */}
      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        labs={labsList}
        isLoading={createMutation.isPending}
        serverError={serverError}
      />

      {/* Session Summary Modal */}
      <AnimatePresence>
        {selectedSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Academic Session Audit Summary: #{selectedSummary.session_id}
                </h3>
                <button onClick={() => setSelectedSummary(null)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Instructor: <strong className="text-white">{selectedSummary.instructor_name}</strong></div>
                  <div>Course: <strong className="text-cyan-400">{selectedSummary.course_name}</strong></div>
                  <div>Laboratory: <strong className="text-white">{selectedSummary.lab_details?.name || 'Lab'}</strong></div>
                  <div>Duration: <strong className="text-emerald-400 font-mono">{selectedSummary.planned_duration} Mins</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button variant="outline" icon={Printer} onClick={handlePrintSummary}>Print Summary</Button>
                <Button onClick={() => setSelectedSummary(null)}>Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};
