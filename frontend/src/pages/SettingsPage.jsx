import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Settings,
  Cpu,
  Shield,
  Users,
  FileText,
  Activity,
  Database,
  Save,
  CheckCircle,
  HardDrive,
  RefreshCw,
  Info,
  Lock,
  Bell,
  Video,
  Download,
  GraduationCap,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [toastMessage, setToastMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Settings State
  const [univName, setUnivName] = useState('Department of Software Engineering');
  const [systemName, setSystemName] = useState('AI Powered Lab Security System');
  const [yoloModel, setYoloModel] = useState('yolov8m.pt');
  const [confidence, setConfidence] = useState('0.25');
  const [verificationFrames, setVerificationFrames] = useState('3');
  const [preEventSec, setPreEventSec] = useState('10');
  const [postEventSec, setPostEventSec] = useState('10');
  const [retentionDays, setRetentionDays] = useState('30');
  const [enableSound, setEnableSound] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    showToast('System & AI Engine Settings updated successfully.');
  };

  const usersList = [
    { id: 1, name: 'Dr. Tabraiz Shams', username: 'tabraiz.shams', role: 'Lab Instructor', email: 'tabraiz@se.edu.pk', status: 'Active' },
    { id: 2, name: 'Security Officer Khan', username: 'officer.khan', role: 'Security Officer', email: 'khan@security.edu.pk', status: 'Active' },
    { id: 3, name: 'System Administrator', username: 'admin', role: 'Administrator', email: 'admin@se.edu.pk', status: 'Active' },
  ];

  const auditLogs = [
    { id: 101, user: 'admin', action: 'Update AI Confidence Threshold (0.25)', ip: '127.0.0.1', module: 'AI Engine', timestamp: new Date().toLocaleString() },
    { id: 102, user: 'tabraiz.shams', action: 'Start Session #SES-9981', ip: '192.168.1.50', module: 'Sessions', timestamp: new Date(Date.now() - 3600000).toLocaleString() },
    { id: 103, user: 'officer.khan', action: 'Update Incident #INC-881 Status (Resolved)', ip: '192.168.1.52', module: 'Incidents', timestamp: new Date(Date.now() - 7200000).toLocaleString() },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="System Administration & Configuration Panel"
        subtitle="Manage global system settings, AI engine parameters, user roles, security audit logs, system diagnostics, and backups"
        icon={Settings}
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

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap ${activeTab === 'settings' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          System & AI Engine Settings
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap ${activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          User & Role Management
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap ${activeTab === 'audit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Audit Logs & Security Trail
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap ${activeTab === 'health' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          System Diagnostics & Backups
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap ${activeTab === 'about' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          About System (FYP)
        </button>
      </div>

      {/* Tab 1: System & AI Engine Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          <Card title="General & Academic Information" subtitle="System title, department information, and localization parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">University / Department Name</label>
                <input
                  type="text"
                  value={univName}
                  onChange={(e) => setUnivName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">System Title</label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
          </Card>

          <Card title="YOLOv8 Computer Vision Engine Settings" subtitle="Detection confidence threshold, verification frames, and AI model parameters">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Selected Model Architecture</label>
                <select
                  value={yoloModel}
                  onChange={(e) => setYoloModel(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                >
                  <option value="yolov8m.pt">YOLOv8 Medium (yolov8m.pt)</option>
                  <option value="yolov8n.pt">YOLOv8 Nano (yolov8n.pt)</option>
                  <option value="yolov8s.pt">YOLOv8 Small (yolov8s.pt)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Confidence Threshold (0.1 - 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Verification Window (Frames)</label>
                <input
                  type="number"
                  value={verificationFrames}
                  onChange={(e) => setVerificationFrames(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
            </div>
          </Card>

          <Card title="Video Evidence & Storage Retention Settings" subtitle="Pre/post event recording clip lengths and retention period">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pre-Event Recording (Seconds)</label>
                <input
                  type="number"
                  value={preEventSec}
                  onChange={(e) => setPreEventSec(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Post-Event Recording (Seconds)</label>
                <input
                  type="number"
                  value={postEventSec}
                  onChange={(e) => setPostEventSec(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Auto Retention Period (Days)</label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={saving} icon={Save}>
              Save All Configuration Settings
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: User & Role Management */}
      {activeTab === 'users' && (
        <Card title="User Accounts & Role Permissions" subtitle="Manage university staff users, roles (Administrator, Instructor, Officer), and access controls">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white font-heading">{u.name}</td>
                    <td className="p-3 font-mono text-cyan-400">{u.username}</td>
                    <td className="p-3 font-semibold text-slate-200">{u.role}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <Badge variant="success" dot>{u.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <Card title="Security Audit Logs & Activity Trail" subtitle="Chronological audit records of system actions, configuration updates, and security events">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Executed Action</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-400">#AUD-{log.id}</td>
                    <td className="p-3 font-bold text-cyan-400">{log.user}</td>
                    <td className="p-3 font-semibold text-slate-200">{log.module}</td>
                    <td className="p-3 text-slate-300">{log.action}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{log.ip}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: System Health & Diagnostics */}
      {activeTab === 'health' && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block font-heading">PostgreSQL DB</span>
              <strong className="text-emerald-400 text-sm font-bold block mt-1">Operational (Connected)</strong>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block font-heading">YOLOv8 Engine</span>
              <strong className="text-emerald-400 text-sm font-bold block mt-1">Operational (yolov8m.pt)</strong>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block font-heading">Scheduler Status</span>
              <strong className="text-emerald-400 text-sm font-bold block mt-1">RUNNING (1 Thread)</strong>
            </div>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block font-heading">Disk Usage</span>
              <strong className="text-cyan-400 text-sm font-bold block mt-1">14.2 GB / 250 GB</strong>
            </div>
          </div>

          <Card title="Database Backup & Disaster Recovery Management" subtitle="Create manual database backups or restore snapshot states">
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-white font-bold block">PostgreSQL Latest Database Backup</span>
                <span className="text-slate-400 text-[11px] font-mono">backup_2026_07_26.sql.gz (18.4 MB)</span>
              </div>
              <Button icon={Download} onClick={() => showToast('Database backup downloaded successfully.')}>
                Download Backup
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: About System (FYP) */}
      {activeTab === 'about' && (
        <Card title="About AI Powered Laboratory Security & Asset Monitoring System" subtitle="Final Year Project (FYP) Information & Technology Stack Specification">
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-heading text-base">
                <GraduationCap className="w-6 h-6" /> Department of Software Engineering
              </div>
              <p className="text-slate-300 leading-relaxed">
                This application is developed as an academic Final Year Project (FYP) for computer lab security management and real-time AI object discrepancy monitoring.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-semibold">Project Title:</span>
                <strong className="text-white font-heading">AI Powered Laboratory Security & Asset Monitoring System</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-semibold">System Version:</span>
                <strong className="text-emerald-400 font-mono font-bold">v1.0.0 Enterprise Release</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-semibold">Student Developer:</span>
                <strong className="text-white font-heading">Shams Tabraiz</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-semibold">Project Supervisor:</span>
                <strong className="text-white font-heading">Dr. Tabraiz Shams</strong>
              </div>
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};
