import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Clock,
  User,
  Filter,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  Globe,
} from 'lucide-react';
import type { EnquiryStatus, EnquirySource } from '../../lib/types.ts';

interface AdminEnquiryInboxViewProps {
  onNavigate: (path: string) => void;
  onSelectEnquiry: (id: string) => void;
  onOpenManualEnquiry: () => void;
  initialOverdueFilter?: boolean;
}

export const AdminEnquiryInboxView: React.FC<AdminEnquiryInboxViewProps> = ({
  onNavigate,
  onSelectEnquiry,
  onOpenManualEnquiry,
  initialOverdueFilter = false,
}) => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(initialOverdueFilter);

  const fetchEnquiries = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
    if (overdueOnly) params.set('overdue', 'true');

    fetch(`/api/admin/enquiries?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setEnquiries(data.enquiries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter, sourceFilter, overdueOnly]);

  const sourceIcons: Record<string, any> = {
    WEB_FORM: Globe,
    PHONE: Phone,
    WHATSAPP: MessageSquare,
    EMAIL: Mail,
    CHAT: MessageSquare,
  };

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    QUOTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WON: 'bg-green-100 text-green-900 border-green-300 font-bold',
    LOST: 'bg-stone-100 text-stone-600 border-stone-200',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#122428]">
            Enquiry Central Inbox
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Single multi-channel inbox with AI extraction, deterministic package matching, and 60-min SLA tracking.
          </p>
        </div>
        <button
          onClick={onOpenManualEnquiry}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Log Staff Enquiry</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {['ALL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'QUOTED', 'WON', 'LOST'].map((st) => (
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

        {/* Channel & Overdue Toggles */}
        <div className="flex items-center gap-3">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs text-stone-700"
          >
            <option value="ALL">All Channels</option>
            <option value="WEB_FORM">Web Form</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
            <option value="CHAT">Chat</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-600"
            />
            <span className={overdueOnly ? 'text-red-600 font-bold' : ''}>Overdue Only</span>
          </label>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Ref & Channel</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Extracted Intent</th>
                <th className="py-3 px-4">Working Hours SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Loading inbox queue...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No enquiries match the selected filters.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => {
                  const Icon = sourceIcons[enq.source] || Globe;
                  const sla = enq.sla;

                  return (
                    <tr
                      key={enq.id}
                      onClick={() => onSelectEnquiry(enq.id)}
                      className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                    >
                      {/* Ref & Channel */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span className="font-mono font-bold text-[#122428]">{enq.reference}</span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-stone-900">{enq.name}</p>
                          <p className="text-[11px] text-stone-500 font-mono">{enq.phone}</p>
                        </div>
                      </td>

                      {/* Extracted Intent Preview */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                            <span>{enq.extractionPreview?.destination || 'Kerala'}</span>
                            {enq.travelMonth && <span>· {enq.travelMonth}</span>}
                            <span>· {enq.adults}A{enq.children > 0 ? `+${enq.children}C` : ''}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 truncate italic">
                            "{enq.message}"
                          </p>
                        </div>
                      </td>

                      {/* SLA Timer */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {sla.status === 'OVERDUE' ? (
                            <div className="flex items-center gap-1 text-red-600 font-bold font-mono">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>{sla.label}</span>
                            </div>
                          ) : sla.status === 'URGENT' ? (
                            <div className="flex items-center gap-1 text-amber-700 font-bold font-mono">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{sla.label}</span>
                            </div>
                          ) : (
                            <span className="text-stone-600 font-mono text-[11px]">{sla.label}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            statusColors[enq.status] || 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4 text-stone-600">
                        {enq.assignedTo ? (
                          <span className="font-medium">{enq.assignedTo.name.split(' ')[0]}</span>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Unassigned</span>
                        )}
                      </td>

                      {/* Triage Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEnquiry(enq.id);
                          }}
                          className="px-3 py-1 bg-[#122428] hover:bg-black text-white text-[11px] font-semibold rounded-md transition-colors"
                        >
                          Review & Triage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
