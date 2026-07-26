import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, User, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Zod Validation Schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Lab Instructor', 'Security Officer', 'Admin']),
});

export const LoginPage = () => {
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin_user',
      password: 'Password123!',
      role: 'Lab Instructor',
    },
  });

  const onSubmit = async (values) => {
    setApiError('');
    console.log('[LOGIN PAGE] Form submitted:', values);

    try {
      await login(values);
      console.log('[LOGIN PAGE] Authentication successful. Navigating to /dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('[LOGIN PAGE] Authentication Error:', err);

      const apiData = err.response?.data;
      let errorMsg = 'Authentication failed. Please check your credentials.';

      if (typeof apiData === 'string') {
        errorMsg = apiData;
      } else if (apiData?.detail) {
        errorMsg = apiData.detail;
      } else if (apiData?.non_field_errors) {
        errorMsg = Array.isArray(apiData.non_field_errors) ? apiData.non_field_errors.join(' ') : apiData.non_field_errors;
      } else if (apiData?.username) {
        errorMsg = `Username: ${Array.isArray(apiData.username) ? apiData.username.join(' ') : apiData.username}`;
      } else if (apiData?.password) {
        errorMsg = `Password: ${Array.isArray(apiData.password) ? apiData.password.join(' ') : apiData.password}`;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setApiError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-3 ring-4 ring-blue-500/10">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase block mb-1">
            DEPARTMENT OF SOFTWARE ENGINEERING
          </span>
          <h2 className="text-xl font-extrabold text-white font-heading">AI Powered Lab Security System</h2>
          <p className="text-xs text-slate-400 mt-1">Final Year Project &bull; Security Operations Portal</p>
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Username / Staff ID
            </label>
            <input
              type="text"
              {...register('username')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 transition"
            />
            {errors.username && (
              <span className="text-[11px] text-red-400 mt-1 block">{errors.username.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> Password
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 transition"
            />
            {errors.password && (
              <span className="text-[11px] text-red-400 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Academic Role
            </label>
            <select
              {...register('role')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Lab Instructor">Lab Instructor</option>
              <option value="Security Officer">Security Officer</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-blue-600" /> Remember Me
            </label>
            <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:underline">
              Forgot Password?
            </a>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" /> {isSubmitting ? 'Authenticating...' : 'Authenticate & Access Portal'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
