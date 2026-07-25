export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const ROLES = {
  INSTRUCTOR: 'Lab Instructor',
  OFFICER: 'Security Officer',
  ADMIN: 'Admin',
};

export const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  INFO: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export const ASSET_CATEGORIES = [
  'person',
  'chair',
  'computer',
  'laptop',
  'mouse',
  'keyboard',
  'monitor',
];
