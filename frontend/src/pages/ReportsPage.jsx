import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { labService } from '../services/labService';
import { reportService } from '../services/reportService';
import {
  FileText,
  AlertTriangle,
  PackageX,
  ShieldCheck,
  FileVideo,
  GraduationCap,
  Download,
  Calendar,
  Building,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export const ReportsPage = () => {
  // Shared Filter State
  const [selectedLab, setSelectedLab] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loadingReport, setLoadingReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Labs for filter dropdown
  const { data: labsData, isLoading: labsLoading } = useQuery({
    queryKey: ['labs-list'],
    queryFn: labService.getLabs,
  });

  const labsList = labsData?.results || (Array.isArray(labsData) ? labsData : []);

  const handleResetFilters = () => {
    setSelectedLab('');
    setFromDate('');
    setToDate('');
    setErrorMessage('');
  };

  const handleDownloadReport = async (reportKey, downloadFn) => {
    setLoadingReport(reportKey);
    setErrorMessage('');
    try {
      const params = {};
      if (selectedLab) params.lab_id = selectedLab;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      await downloadFn(params);
    } catch (err) {
      console.error(`[REPORTS PAGE] Failed to download ${reportKey}:`, err);
      setErrorMessage(
        `Failed to generate ${reportKey}. Please check network connection or verify filter dates.`
      );
    } finally {
      setLoadingReport(null);
    }
  };

  const reportsConfig = [
    {
      key: 'incident-report',
      title: 'Incident Report',
      subtitle: 'Comprehensive Security Discrepancy Log',
      description:
        'Detailed record of security incidents detected by the monitoring engine, including expected vs. detected quantities, vision confidence scores, severity classifications, and investigative status.',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      borderHover: 'hover:border-red-500/40',
      downloadFn: reportService.downloadIncidentReport,
    },
    {
      key: 'asset-missing-report',
      title: 'Asset Missing Report',
      subtitle: 'Hardware Discrepancy & Frequency Audit',
      description:
        'Calculates aggregated missing asset activity from database records, tracking total missing unit counts, discrepancy frequencies per laboratory, and first/most-recent occurrence timestamps.',
      icon: PackageX,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      borderHover: 'hover:border-amber-500/40',
      downloadFn: reportService.downloadAssetMissingReport,
    },
    {
      key: 'lab-security-report',
      title: 'Laboratory Security Report',
      subtitle: 'Facility Telemetry & Risk Summary',
      description:
        'Concise executive security summary for laboratory facilities, calculating total sessions, critical incidents, most frequently missing equipment, forensic evidence records, and security alert volumes.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      borderHover: 'hover:border-emerald-500/40',
      downloadFn: reportService.downloadLabSecurityReport,
    },
    {
      key: 'evidence-report',
      title: 'Evidence Report',
      subtitle: 'Forensic Media & Chain of Custody Audit',
      description:
        'Physical chain-of-custody audit verifying generated forensic evidence packages, before/after discrepancy frames, and verified MP4 video evidence recordings linked to security incidents.',
      icon: FileVideo,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      borderHover: 'hover:border-indigo-500/40',
      downloadFn: reportService.downloadEvidenceReport,
    },
    {
      key: 'lab-session-report',
      title: 'Lab Session Report',
      subtitle: 'Academic Course Surveillance & Instructor Log',
      description:
        'Official record of laboratory sessions, instructor activity from database records, active camera surveillance windows, and concurrent discrepancy telemetry recorded during academic periods.',
      icon: GraduationCap,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      borderHover: 'hover:border-cyan-500/40',
      downloadFn: reportService.downloadLabSessionReport,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Security Operations Center (SOC) Reports"
        subtitle="Generate and download real, database-driven official PDF security audits and facility telemetry reports"
        icon={FileText}
      />

      {/* Shared Filter Controls */}
      <Card
        title="Report Generation Filters"
        subtitle="Configure target facility and date range parameters to filter database records for all reports"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Laboratory Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-heading">
              <Building className="w-3.5 h-3.5 text-blue-400" /> Target Laboratory
            </label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              disabled={labsLoading}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">All Laboratories</option>
              {labsList.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.building || 'Room'} {lab.room_number})
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-heading">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition font-mono"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-heading">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500 transition font-mono"
            />
          </div>

          {/* Reset Filters */}
          <div>
            <Button
              variant="outline"
              icon={RotateCcw}
              onClick={handleResetFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {(selectedLab || fromDate || toDate) && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Active Query Filter:</span>
            <span>
              {selectedLab ? `Lab: ${labsList.find((l) => String(l.id) === String(selectedLab))?.name || selectedLab}` : 'All Labs'}
              {fromDate ? ` &bull; From ${fromDate}` : ''}
              {toDate ? ` &bull; To ${toDate}` : ''}
            </span>
          </div>
        )}
      </Card>

      {/* Error Message Callout */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5 Real Database-Driven Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsConfig.map((report) => {
          const Icon = report.icon;
          const isDownloading = loadingReport === report.key;

          return (
            <div
              key={report.key}
              className={`glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between transition group ${report.borderHover}`}
            >
              <div className="space-y-4">
                {/* Header with Icon */}
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-xl ${report.iconBg} ${report.iconColor} shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading group-hover:text-cyan-400 transition">
                      {report.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {report.subtitle}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {report.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <Button
                  variant="primary"
                  icon={Download}
                  loading={isDownloading}
                  onClick={() => handleDownloadReport(report.title, report.downloadFn)}
                  className="w-full justify-center text-xs font-bold"
                >
                  {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
};
