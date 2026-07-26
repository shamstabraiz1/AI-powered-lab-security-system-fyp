import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  FileText,
  Printer,
  Download,
  GraduationCap,
  Award,
  CheckCircle,
  Building,
  User,
  Clock,
  Shield,
  BarChart2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('session-report');

  const labIncidentsData = [
    { name: 'AI Lab 1', count: 12 },
    { name: 'Robotics 2', count: 5 },
    { name: 'Network 3', count: 8 },
  ];

  const assetIncidentsData = [
    { name: 'Mouse', value: 15, color: '#38bdf8' },
    { name: 'Keyboard', value: 8, color: '#818cf8' },
    { name: 'Monitor', value: 4, color: '#f43f5e' },
    { name: 'Laptop', value: 3, color: '#fbbf24' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Academic Session Reports & AI Performance Analytics"
        subtitle="Generate printable university security reports, asset audit logs, and AI vision engine performance analytics"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Printer} onClick={handlePrint}>
              Print Report
            </Button>
            <Button icon={Download} onClick={handlePrint}>
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('session-report')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition ${activeTab === 'session-report' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Printable University Session Report
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2 px-4 text-xs font-bold font-heading border-b-2 transition ${activeTab === 'analytics' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          AI Analytics & Performance Reports
        </button>
      </div>

      {activeTab === 'session-report' ? (
        /* Printable University Document */
        <div id="printable-area" className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 text-slate-200 text-xs shadow-2xl">
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-800 space-y-1">
            <div className="flex justify-center items-center gap-2 text-cyan-400 font-bold font-heading text-lg">
              <GraduationCap className="w-7 h-7" /> DEPARTMENT OF SOFTWARE ENGINEERING
            </div>
            <h2 className="text-xl font-extrabold text-white font-heading">
              AI Powered Laboratory Security & Asset Monitoring System
            </h2>
            <p className="text-slate-400 text-xs">Official Academic Laboratory Session Audit Report</p>
          </div>

          {/* Session Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block font-semibold">Laboratory Facility:</span>
              <strong className="text-white text-sm">Software Engineering AI Lab 1 (Room 101)</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Instructor:</span>
              <strong className="text-white text-sm">Dr. Tabraiz Shams</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Course & Code:</span>
              <strong className="text-cyan-400 text-sm">SE-402: Computer Vision & AI Systems</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Session Topic:</span>
              <strong className="text-slate-200 text-sm">Real-time Asset Baseline Monitoring</strong>
            </div>
          </div>

          {/* AI Engine Summary */}
          <div className="space-y-2">
            <h3 className="font-bold text-white font-heading text-sm">AI Computer Vision Monitoring Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Total Frames</span>
                <strong className="text-white font-mono font-bold text-sm">45,120</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Detection Accuracy</span>
                <strong className="text-emerald-400 font-mono font-bold text-sm">98.4%</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Framerate</span>
                <strong className="text-cyan-400 font-mono font-bold text-sm">20.0 FPS</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Scheduler Uptime</span>
                <strong className="text-emerald-400 font-mono font-bold text-sm">100%</strong>
              </div>
            </div>
          </div>

          {/* Asset Audit Breakdown Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-white font-heading text-sm">Final Asset Inventory Audit</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-heading border-b border-slate-800">
                  <th className="p-2.5">Asset Category</th>
                  <th className="p-2.5">Expected Count</th>
                  <th className="p-2.5">Final Detected</th>
                  <th className="p-2.5">Discrepancy</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-2.5 font-bold text-white">Monitors</td>
                  <td className="p-2.5 font-mono">20</td>
                  <td className="p-2.5 font-mono">20</td>
                  <td className="p-2.5 font-mono text-emerald-400">0</td>
                  <td className="p-2.5"><Badge variant="success">COMPLETE</Badge></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-white">Keyboards</td>
                  <td className="p-2.5 font-mono">20</td>
                  <td className="p-2.5 font-mono">20</td>
                  <td className="p-2.5 font-mono text-emerald-400">0</td>
                  <td className="p-2.5"><Badge variant="success">COMPLETE</Badge></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-white">Mice</td>
                  <td className="p-2.5 font-mono">20</td>
                  <td className="p-2.5 font-mono text-amber-400">19</td>
                  <td className="p-2.5 font-mono text-red-400">-1</td>
                  <td className="p-2.5"><Badge variant="danger">MISSING (1)</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Stamp */}
          <div className="pt-8 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-4">
              <div className="h-10 border-b border-slate-700"></div>
              <span className="text-slate-400 font-semibold block">Instructor Signature</span>
              <span className="text-white font-bold block">Dr. Tabraiz Shams</span>
            </div>
            <div className="space-y-4">
              <div className="h-10 border-b border-slate-700"></div>
              <span className="text-slate-400 font-semibold block">Security Officer Signature</span>
              <span className="text-white font-bold block">Security Officer Khan</span>
            </div>
            <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Department Stamp Area
            </div>
          </div>
        </div>
      ) : (
        /* Recharts Analytics Charts */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Incidents by Laboratory" subtitle="Distribution of discrepancy alerts per lab facility">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labIncidentsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Incidents by Asset Category" subtitle="Breakdown of missing assets detected by YOLOv8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetIncidentsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {assetIncidentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
