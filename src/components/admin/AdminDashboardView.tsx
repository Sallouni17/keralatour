import React, { useState, useEffect } from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  UserX,
  Package,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigate: (path: string) => void;
  onOpenManualEnquiry: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  onOpenManualEnquiry,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-stone-500 animate-pulse">
        Calculating live enquiry metrics across Kochi working hours...
      </div>
    );
  }

  const { metrics, recentActivity } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#122428]">
            Operations Dashboard
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time enquiry flow, response-time SLA compliance, and package publishing status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenManualEnquiry}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Manual Enquiry</span>
          </button>
        </div>
      </div>

      {/* SLA Alert Banner if Overdue Enquiries Exist */}
      {metrics.overdueEnquiries > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-red-900">
                {metrics.overdueEnquiries} Enquiry Overdue for Reply (&gt; 60 working mins):
              </span>
              <span className="ml-1 text-red-700">
                Company A’s core guarantee requires all enquiries to receive a reviewed itinerary within 1 hour.
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/admin/enquiries?overdue=true')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shrink-0"
          >
            Review Overdue Queue
          </button>
        </div>
      )}

      {/* Metric Cards (No static pill clutter, clean tabular numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. New Enquiries */}
        <div
          onClick={() => onNavigate('/admin/enquiries?status=NEW')}
          className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs hover:border-stone-400 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="font-medium text-xs">New Enquiries</span>
            <Inbox className="w-4 h-4 text-[#B85D19]" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-[#122428] tabular-nums">
              {metrics.newEnquiries}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Awaiting triage & initial draft</p>
          </div>
        </div>

        {/* 2. Unassigned */}
        <div
          onClick={() => onNavigate('/admin/enquiries?assignee=UNASSIGNED')}
          className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs hover:border-stone-400 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="font-medium text-xs">Unassigned</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-[#122428] tabular-nums">
              {metrics.unassignedEnquiries}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Pending consultant assignment</p>
          </div>
        </div>

        {/* 3. Overdue (>1h Working Hours) */}
        <div
          onClick={() => onNavigate('/admin/enquiries?overdue=true')}
          className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs hover:border-stone-400 cursor-pointer transition-all space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="font-medium text-xs">Overdue (&gt; 1h SLA)</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-red-600 tabular-nums">
              {metrics.overdueEnquiries}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Calculated 09:00–18:00 IST</p>
          </div>
        </div>

        {/* 4. Average Response Time */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-stone-500">
            <span className="font-medium text-xs">Avg Response Speed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-[#122428] tabular-nums">
              {metrics.avgResponseMinutes} <span className="text-sm font-normal text-stone-500">mins</span>
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Within 60-min SLA ceiling</p>
          </div>
        </div>
      </div>

      {/* Lower Split: Packages Snapshot & Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Packages Summary */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="font-serif text-base font-bold text-[#122428]">Package CMS Status</h2>
            <button
              onClick={() => onNavigate('/admin/packages')}
              className="text-xs font-semibold text-[#B85D19] hover:underline"
            >
              Manage Packages
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-600">Total Packages in System:</span>
              <span className="font-mono font-bold">{metrics.totalPackages}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-600">Published on Live Site:</span>
              <span className="font-mono font-bold text-emerald-600">{metrics.publishedPackages}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-stone-600">Drafts / Review:</span>
              <span className="font-mono font-bold text-amber-600">
                {metrics.totalPackages - metrics.publishedPackages}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100">
            <button
              onClick={() => onNavigate('/admin/packages/new')}
              className="w-full py-2 text-xs font-semibold text-[#122428] hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-3.5 h-3.5 text-[#B85D19]" />
              <span>Create New Tour Circuit</span>
            </button>
          </div>
        </div>

        {/* Live Operations Activity Audit Feed */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="font-serif text-base font-bold text-[#122428]">Recent Staff Actions & Triage</h2>
            <button
              onClick={() => onNavigate('/admin/activity')}
              className="text-xs font-semibold text-[#B85D19] hover:underline"
            >
              View Full Audit Trail
            </button>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {recentActivity?.map((log: any) => {
              const dateStr = new Date(log.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#122428]">
                      <span className="font-mono text-stone-500 font-normal">[{log.action}]</span>{' '}
                      {log.actor?.name || 'System Auto-Processor'}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate max-w-md">
                      {log.meta || log.entityType}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-stone-400 shrink-0 tabular-nums">
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
