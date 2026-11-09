import React from 'react';
import {
  LayoutDashboard,
  Package,
  Inbox,
  Activity,
  LogOut,
  ExternalLink,
  Shield,
  Clock,
  Compass,
} from 'lucide-react';
import type { UserRole } from '../../lib/types.ts';

interface AdminLayoutProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
  };
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  currentPath,
  onNavigate,
  onLogout,
  children,
}) => {
  const role = currentUser.role;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      allowed: ['ADMIN', 'EDITOR', 'CONSULTANT'],
    },
    {
      label: 'Package CMS',
      path: '/admin/packages',
      icon: Package,
      allowed: ['ADMIN', 'EDITOR'],
    },
    {
      label: 'Enquiry Inbox',
      path: '/admin/enquiries',
      icon: Inbox,
      allowed: ['ADMIN', 'CONSULTANT'],
    },
    {
      label: 'Activity Audit',
      path: '/admin/activity',
      icon: Activity,
      allowed: ['ADMIN'],
    },
  ];

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    EDITOR: 'bg-blue-100 text-blue-800 border-blue-200',
    CONSULTANT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    TRAVELLER: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] flex flex-col md:flex-row font-sans text-xs text-[#122428]">
      {/* Sidebar (260px) */}
      <aside className="w-full md:w-64 bg-[#122428] text-white flex flex-col justify-between shrink-0 border-r border-[#122428]">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="font-serif text-base font-bold tracking-tight text-white">Company A Tours</p>
              <p className="text-[11px] text-white/50 font-mono mt-0.5">Kochi Operations Hub</p>
            </div>
            <button
              onClick={() => onNavigate('/')}
              title="View Public Site"
              className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Current User Card */}
          <div className="p-4 mx-3 my-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/70 truncate max-w-[140px] font-medium">
                {currentUser.name}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${roleColors[role]}`}>
                {role}
              </span>
            </div>
            <p className="text-[10px] text-white/40 truncate font-mono">{currentUser.email}</p>
          </div>

          {/* Nav Items */}
          <nav className="px-3 space-y-1">
            {navItems
              .filter((item) => item.allowed.includes(role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path || (item.path !== '/admin/dashboard' && currentPath.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#B85D19] text-white shadow-xs'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-[11px] text-white/50 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B85D19]" />
              <span>SLA Target: 60 Minutes (IST)</span>
            </div>
            <p className="text-[10px] text-white/40">Working Hours: 09:00–18:00 Mon–Sat</p>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto max-h-screen p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
};
