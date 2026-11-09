import React, { useState, useEffect } from 'react';
import { Activity, Filter, RefreshCw, User, ShieldAlert } from 'lucide-react';

export const AdminActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);

    fetch(`/api/admin/activity?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#122428]">
            System & Staff Activity Audit Trail
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Immutable log of all user actions, package version saves, AI extractions, reply dispatches, and RBAC security checks.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200 bg-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center gap-3">
        <Filter className="w-4 h-4 text-stone-400" />
        <span className="font-medium text-stone-600">Filter Action:</span>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-xs"
        >
          <option value="">All Actions</option>
          <option value="PACKAGE_CREATED">PACKAGE_CREATED</option>
          <option value="PACKAGE_VERSION_SAVED">PACKAGE_VERSION_SAVED</option>
          <option value="PACKAGE_PUBLISHED">PACKAGE_PUBLISHED</option>
          <option value="ENQUIRY_RECEIVED">ENQUIRY_RECEIVED</option>
          <option value="ENQUIRY_ASSIGNED">ENQUIRY_ASSIGNED</option>
          <option value="AI_EXTRACTION_COMPLETED">AI_EXTRACTION_COMPLETED</option>
          <option value="REPLY_SENT">REPLY_SENT</option>
          <option value="ROLE_CHECK_DENIED">ROLE_CHECK_DENIED</option>
          <option value="DPDP_PII_ERASED">DPDP_PII_ERASED</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono text-stone-500 tabular-nums">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#122428]">{log.action}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-stone-800">
                        {log.actor?.name || 'System Auto-Processor'}
                      </span>
                      {log.actor?.role && (
                        <span className="ml-1 text-[10px] text-stone-400 font-mono">({log.actor.role})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600 truncate max-w-xs">
                      {log.meta || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
