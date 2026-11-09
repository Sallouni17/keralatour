import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Copy,
  Archive,
  Eye,
  Edit3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { PackageStatus } from '../../lib/types.ts';

interface AdminPackageListViewProps {
  onNavigate: (path: string) => void;
  onOpenPreview: (previewPath: string) => void;
}

export const AdminPackageListView: React.FC<AdminPackageListViewProps> = ({
  onNavigate,
  onOpenPreview,
}) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPackages = () => {
    setLoading(true);
    fetch('/api/admin/packages')
      .then((res) => res.json())
      .then((data) => setPackages(data.packages || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDuplicate = async (pkgId: string, code: string) => {
    if (!confirm(`Duplicate "${code}" into a new draft package?`)) return;
    try {
      const res = await fetch(`/api/admin/packages/${pkgId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Package duplicated successfully.`);
        fetchPackages();
      }
    } catch {
      alert('Failed to duplicate package');
    }
  };

  const handleArchive = async (pkgId: string, code: string) => {
    if (!confirm(`Archive "${code}"? It will no longer be visible publicly.`)) return;
    try {
      const res = await fetch(`/api/admin/packages/${pkgId}/archive`, { method: 'POST' });
      if (res.ok) {
        setActionMessage(`Package ${code} archived.`);
        fetchPackages();
      }
    } catch {
      alert('Failed to archive package');
    }
  };

  const handlePreview = async (pkgId: string) => {
    try {
      const res = await fetch(`/api/admin/packages/${pkgId}/preview-token`);
      const data = await res.json();
      if (data.previewPath) {
        onOpenPreview(data.previewPath);
      }
    } catch {
      alert('Failed to generate preview token');
    }
  };

  const filtered = packages.filter((pkg) => {
    const matchesStatus = statusFilter === 'ALL' || pkg.status === statusFilter;
    const matchesSearch =
      !search ||
      pkg.code.toLowerCase().includes(search.toLowerCase()) ||
      pkg.title.toLowerCase().includes(search.toLowerCase()) ||
      pkg.destination?.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusStyles: Record<string, string> = {
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    ARCHIVED: 'bg-stone-100 text-stone-600 border-stone-200',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#122428]">
            Package CMS Catalogue
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage tariffs, seasonal date bands, itineraries, and version control.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/admin/packages/new')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tour Circuit</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold">✕</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, title, destination..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#B85D19]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
          {['ALL', 'PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-[#122428] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Code & Title</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Seasonal Tariffs</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Loading package catalogue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No packages matched your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Code & Title */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-[#122428]">{pkg.code}</span>
                        <p className="font-medium text-stone-800 line-clamp-1">{pkg.title}</p>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-4 text-stone-600">
                      {pkg.destination?.name || 'South India'}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono">
                      {pkg.days}D / {pkg.nights}N
                    </td>

                    {/* Tariffs */}
                    <td className="py-3 px-4 font-mono tabular-nums text-stone-900 font-medium">
                      {pkg.priceRange}{' '}
                      <span className="text-[10px] text-stone-400 font-normal">+ GST</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          statusStyles[pkg.status] || 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {pkg.status}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="py-3 px-4 font-mono text-stone-500">
                      v{pkg.versionCount}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`/admin/packages/${pkg.id}`)}
                          title="Edit Package & Tariffs"
                          className="p-1.5 text-stone-600 hover:text-[#B85D19] rounded hover:bg-stone-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePreview(pkg.id)}
                          title="Preview Draft Public View"
                          className="p-1.5 text-stone-600 hover:text-[#122428] rounded hover:bg-stone-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(pkg.id, pkg.code)}
                          title="Duplicate Package"
                          className="p-1.5 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-100 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {pkg.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleArchive(pkg.id, pkg.code)}
                            title="Archive Package"
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
