import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import aavasaLogo from '../assets/aavasa-logo.jpg';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';

export default function HotelAdminLogin() {
  const { login } = useDashboard();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Please enter both Admin Email/Username and Password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login(cleanEmail, cleanPass);
      const isSuccess = typeof result === 'object' ? result.success : Boolean(result);
      if (!isSuccess) {
        setError(
          result?.message ||
            'Invalid Hotel Admin credentials. Only credentials created in Aavasa Super Admin can log in.'
        );
      }
    } catch (err) {
      setError('Login failed. Please verify your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a2331] to-[#0e4860] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow and subtle grid */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-white shadow-xl shadow-black/30 mb-4 border border-white/20">
            <img
              src={aavasaLogo || "./aavasa-logo.jpg"}
              alt="Aavasa"
              className="h-14 w-auto object-contain rounded-xl"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = './aavasa-logo.jpg';
              }}
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Aavasa <span className="text-amber-400 font-sans font-medium text-base">• Hospitality Simplified</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Property Management & Front Desk Operations Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/30 rounded-3xl p-7 shadow-2xl shadow-black/50 text-slate-900">
          <div className="flex items-center justify-between pb-5 border-b border-slate-200/80 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hotel Admin Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sign in using credentials provisioned by Super Admin</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0e4860]/10 text-[#0e4860] border border-[#0e4860]/20">
              Verified Access
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Email / Property ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Admin Email or ID created in Super Admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e4860] focus:border-[#0e4860] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e4860] focus:border-[#0e4860] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 bg-[#0e4860] hover:bg-[#135d7c] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0e4860]/30 flex items-center justify-center space-x-2 transition duration-200 mt-2 cursor-pointer"
            >
              <span>{isLoggingIn ? 'Validating Credentials...' : 'Sign In to Hotel PMS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* SuperAdmin Provisioning Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#0e4860] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">SuperAdmin-Provisioned Access Only</span>
                All pre-existing admin logins are disabled. Only active Admin credentials created in the <span className="font-semibold text-[#0e4860]">Aavasa Super Admin</span> portal can sign in.
              </div>
            </div>
          </div>
        </div>

        {/* Portal Links */}
        <div className="mt-6 flex items-center justify-center space-x-4 text-xs text-slate-300">
          <a
            href="https://shashikant-panchal.github.io/AuraStaySuperAdmin/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-300 transition flex items-center gap-1"
          >
            <span>Aavasa Super Admin Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
