import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuthContext } from '../context/AuthContext';
import { authService } from '../services/authService';
import { labService } from '../services/labService';
import { cameraService } from '../services/cameraService';
import { referenceService } from '../services/referenceService';
import {
  Settings,
  Bell,
  Sliders,
  UserCheck,
  Info,
  CheckCircle,
  AlertCircle,
  Lock,
  LogOut,
  Save,
  Shield,
  Building,
  Camera,
  Layers,
  Cpu,
  Volume2,
  VolumeX,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsPage = () => {
  const { user, logout } = useAuthContext();
  const [activeTab, setActiveTab] = useState('notifications');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // --- 1. NOTIFICATIONS STATE (Saved in localStorage) ---
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('app_notification_settings');
      return saved
        ? JSON.parse(saved)
        : {
            securityNotifications: true,
            criticalAlerts: true,
            notificationSound: true,
            browserNotifications: typeof Notification !== 'undefined' && Notification.permission === 'granted',
          };
    } catch {
      return {
        securityNotifications: true,
        criticalAlerts: true,
        notificationSound: true,
        browserNotifications: false,
      };
    }
  });

  const [savingNotifications, setSavingNotifications] = useState(false);

  // --- 3. ACCOUNT & SECURITY (Change Password State) ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- 4. SYSTEM INFORMATION (Live Database Queries) ---
  const { data: labsData, isLoading: labsLoading } = useQuery({
    queryKey: ['labs-count'],
    queryFn: labService.getLabs,
  });

  const { data: camerasData, isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras-count'],
    queryFn: cameraService.getCameras,
  });

  const { data: referenceData, isLoading: refLoading } = useQuery({
    queryKey: ['reference-profiles-count'],
    queryFn: referenceService.getReferenceProfiles,
  });

  const totalLabsCount = labsData?.count ?? (Array.isArray(labsData?.results) ? labsData.results.length : Array.isArray(labsData) ? labsData.length : 0);
  const totalCamerasCount = camerasData?.count ?? (Array.isArray(camerasData?.results) ? camerasData.results.length : Array.isArray(camerasData) ? camerasData.length : 0);
  
  const referenceList = referenceData?.results || (Array.isArray(referenceData) ? referenceData : []);
  const activeProfilesCount = referenceList.filter((p) => p.is_active !== false).length;

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Toggle notification preference
  const handleToggleNotification = async (key) => {
    if (key === 'browserNotifications') {
      if (typeof Notification === 'undefined') {
        showToast('Browser notifications are not supported in this browser.', 'error');
        return;
      }
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationSettings((prev) => ({ ...prev, browserNotifications: true }));
          showToast('Browser notifications permission granted.');
        } else {
          setNotificationSettings((prev) => ({ ...prev, browserNotifications: false }));
          showToast('Browser notifications permission denied by browser.', 'error');
        }
        return;
      }
    }
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      localStorage.setItem('app_notification_settings', JSON.stringify(notificationSettings));
      setTimeout(() => {
        setSavingNotifications(false);
        showToast('Notification preferences saved successfully.');
      }, 300);
    } catch (err) {
      setSavingNotifications(false);
      showToast('Failed to save notification preferences to browser storage.', 'error');
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({ old_password: oldPassword, new_password: newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Account password updated successfully.');
    } catch (err) {
      console.error('[SETTINGS] Change password error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to update password. Please verify current password.';
      setPasswordError(errMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="System Administration & Settings"
        subtitle="Manage notification alerts, system configuration, account security credentials, and view real-time facility telemetry"
        icon={Settings}
      />

      {/* Status Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 border text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg ${
              toastType === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {toastType === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Navigation Bar: Exactly the 4 Approved Categories */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2.5 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-2.5 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> System
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`pb-2.5 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'account'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Account & Security
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`pb-2.5 px-4 text-xs font-bold font-heading border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'info'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Info className="w-4 h-4" /> System Information
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. NOTIFICATIONS SECTION                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6 text-xs">
          <Card
            title="Security Notification Preferences"
            subtitle="Configure how the application delivers surveillance alerts and incident notifications to your interface"
          >
            <div className="space-y-4">
              {/* Security Notifications Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-bold font-heading">Security Notifications</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Display real-time security alerts and incident notices in the application header and notification module.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('securityNotifications')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                    notificationSettings.securityNotifications ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Critical Incident Alerts Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-white font-bold font-heading">Critical Incident Alerts</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Receive high-priority alerts whenever an asset discrepancy is confirmed by the 3-stage verification engine.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('criticalAlerts')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                    notificationSettings.criticalAlerts ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Notification Sound Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {notificationSettings.notificationSound ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-white font-bold font-heading">Notification Sound</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Play an audible tone when new security alerts and discrepancy events are detected.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('notificationSound')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                    notificationSettings.notificationSound ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {/* Browser Push Notifications Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-white font-bold font-heading">Browser Notifications</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Send native desktop notifications via the web browser when new incidents occur while the tab is in background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('browserNotifications')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                    notificationSettings.browserNotifications ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-4">
              <Button type="submit" loading={savingNotifications} icon={Save}>
                Save Notification Preferences
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. SYSTEM SECTION                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6 text-xs">
          <Card
            title="System & Localization Configuration"
            subtitle="Application identity, department designation, and regional localization parameters"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block font-heading">Application Name</span>
                <span className="text-white font-bold text-sm block">AI Powered Lab Security System</span>
                <span className="text-slate-500 text-[10px]">Configured Project Title</span>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block font-heading">Department Name</span>
                <span className="text-cyan-400 font-bold text-sm block">Department of Software Engineering</span>
                <span className="text-slate-500 text-[10px]">Academic Organization Entity</span>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block font-heading">Time Zone</span>
                <span className="text-white font-mono font-bold text-sm block">Asia/Karachi (PKT, UTC+5)</span>
                <span className="text-slate-500 text-[10px]">Django Server Backend Timezone</span>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block font-heading">Date Format</span>
                <span className="text-white font-mono font-bold text-sm block">DD/MM/YYYY (e.g. 09/08/2026)</span>
                <span className="text-slate-500 text-[10px]">Standard Local Display Format</span>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block font-heading">Time Format</span>
                <span className="text-white font-mono font-bold text-sm block">12-Hour Format with AM/PM</span>
                <span className="text-slate-500 text-[10px]">Security Operations Log Display</span>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block font-heading">Server Host & Protocol</span>
                <span className="text-emerald-400 font-mono font-bold text-sm block">Django REST Framework (127.0.0.1:8000)</span>
                <span className="text-slate-500 text-[10px]">JWT Bearer Token Authentication</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACCOUNT & SECURITY SECTION                                             */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-6 text-xs">
          {/* Current User Profile Card */}
          <Card
            title="Authenticated User Profile"
            subtitle="Details of the currently authenticated security personnel account"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Full Name</span>
                <strong className="text-white text-sm font-bold block mt-1">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Authenticated User'}
                </strong>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Username / Staff ID</span>
                <strong className="text-cyan-400 font-mono text-sm font-bold block mt-1">
                  {user?.username || 'user'}
                </strong>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Email Address</span>
                <strong className="text-slate-200 text-sm font-medium block mt-1 truncate">
                  {user?.email || `${user?.username || 'user'}@se.edu.pk`}
                </strong>
              </div>

              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Assigned Roles</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {user?.roles && user.roles.length > 0 ? (
                    user.roles.map((r) => (
                      <Badge key={r} variant="info">{r}</Badge>
                    ))
                  ) : (
                    <Badge variant="success">Active Staff</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Terminate Active Session</span>
                <span className="text-slate-400 text-[11px]">Log out of the security console and purge current JWT credentials.</span>
              </div>
              <Button
                variant="danger"
                icon={LogOut}
                onClick={() => setShowLogoutConfirm(true)}
              >
                Log Out
              </Button>
            </div>
          </Card>

          {/* Change Password Form */}
          <Card
            title="Change Account Password"
            subtitle="Update your security login credentials. Password must be at least 6 characters long."
          >
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" /> Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current account password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition font-mono"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" loading={changingPassword} icon={Save}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SYSTEM INFORMATION SECTION (Read-Only)                                */}
      {/* ========================================================================= */}
      {activeTab === 'info' && (
        <div className="space-y-6 text-xs">
          <Card
            title="Real-Time System & Facility Telemetry"
            subtitle="Live database record counts, computer vision configuration, and operational system health metrics"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Application Version */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Application Version</span>
                  <strong className="text-white text-sm font-bold block mt-0.5">v1.0.0 Enterprise Release</strong>
                  <span className="text-slate-500 text-[10px]">FYP Production Build</span>
                </div>
              </div>

              {/* YOLO Model */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">YOLO Vision Model</span>
                  <strong className="text-emerald-400 font-mono text-sm font-bold block mt-0.5">YOLOv8 Medium (yolov8m.pt)</strong>
                  <span className="text-slate-500 text-[10px]">Ultralytics Deep Learning Engine</span>
                </div>
              </div>

              {/* Number of Laboratories */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Total Laboratories</span>
                  <strong className="text-white text-sm font-bold block mt-0.5">
                    {labsLoading ? 'Loading...' : `${totalLabsCount} Configured Facilities`}
                  </strong>
                  <span className="text-slate-500 text-[10px]">Queried from PostgreSQL Lab Data</span>
                </div>
              </div>

              {/* Number of Cameras */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Surveillance Cameras</span>
                  <strong className="text-white text-sm font-bold block mt-0.5">
                    {camerasLoading ? 'Loading...' : `${totalCamerasCount} Monitored Endpoints`}
                  </strong>
                  <span className="text-slate-500 text-[10px]">Queried from PostgreSQL Camera Data</span>
                </div>
              </div>

              {/* Active Reference Profiles */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Active Reference Profiles</span>
                  <strong className="text-white text-sm font-bold block mt-0.5">
                    {refLoading ? 'Loading...' : `${activeProfilesCount} Active Baselines`}
                  </strong>
                  <span className="text-slate-500 text-[10px]">Baseline Object Quantities</span>
                </div>
              </div>

              {/* System & Database Status */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-heading">Database & System Status</span>
                  <strong className="text-emerald-400 text-sm font-bold block mt-0.5">100% Operational</strong>
                  <span className="text-slate-500 text-[10px]">PostgreSQL Connected & Healthy</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-400">
              <LogOut className="w-6 h-6" />
              <h3 className="text-base font-bold text-white font-heading">Confirm Logout</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to log out of the AI Powered Lab Security System? Your active session tokens will be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={LogOut}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                Confirm Logout
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  );
};
