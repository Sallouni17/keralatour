import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface AdminLoginViewProps {
  onLoginSuccess: (user: any) => void;
  onNavigateHome: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [email, setEmail] = useState('admin@companya.test');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <button
          onClick={onNavigateHome}
          className="text-2xl font-serif font-bold text-[#122428] tracking-tight hover:opacity-80"
        >
          Company A Tours
        </button>
        <p className="text-xs text-stone-600">
          Staff Operational Portal & Enquiry Triage Hub
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-xl sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-medium text-stone-700 mb-1">Staff Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B85D19]"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B85D19]"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#122428] hover:bg-black transition-colors rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Operations Desk'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins for Fast Review */}
          <div className="pt-4 border-t border-stone-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-stone-500 font-medium text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-[#B85D19]" />
              <span>1-Click Test Personas (Pre-seeded Demo Users)</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@companya.test', 'Admin@123')}
                className="w-full text-left p-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-purple-900">Radhika Menon (ADMIN)</span>
                  <p className="text-[10px] text-purple-700">Full Access (Packages, Enquiries, Settings, Logs)</p>
                </div>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-200">Fill</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('editor@companya.test', 'Editor@123')}
                className="w-full text-left p-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-blue-900">Arjun Varma (EDITOR)</span>
                  <p className="text-[10px] text-blue-700">Package CMS only (Enquiries route forbidden)</p>
                </div>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-blue-200">Fill</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('consultant@companya.test', 'Consultant@123')}
                className="w-full text-left p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-emerald-900">Anjali Thomas (CONSULTANT)</span>
                  <p className="text-[10px] text-emerald-700">Enquiry Inbox only (Package editing forbidden)</p>
                </div>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200">Fill</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
