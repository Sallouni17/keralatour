import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  Send,
  MessageSquare,
  Mail,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  FileText,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import type { ExtractionFields, PriceBreakdown } from '../../lib/types.ts';

interface AdminEnquiryDetailViewProps {
  enquiryId: string;
  onNavigate: (path: string) => void;
  currentUserRole: string;
}

export const AdminEnquiryDetailView: React.FC<AdminEnquiryDetailViewProps> = ({
  enquiryId,
  onNavigate,
  currentUserRole,
}) => {
  const [enquiry, setEnquiry] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable Extracted Fields State
  const [editFields, setEditFields] = useState<ExtractionFields>({
    destination: '',
    startMonth: '',
    nights: 5,
    adults: 2,
    children: 0,
    budgetTotalINR: 120000,
    mustHaves: [],
    confidence: {},
  });
  const [mustHaveInput, setMustHaveInput] = useState('');

  // Editable Draft Reply State
  const [draftBody, setDraftBody] = useState('');
  const [sendChannel, setSendChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');

  // Internal Note State
  const [newNote, setNewNote] = useState('');

  const fetchEnquiry = () => {
    setLoading(true);
    fetch(`/api/admin/enquiries/${enquiryId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const enq = data.enquiry;
        setEnquiry(enq);

        // Load extracted fields
        if (enq.extraction) {
          const activeFields: ExtractionFields = enq.extraction.correctedFields || enq.extraction.fields;
          setEditFields(activeFields);
        }

        // Load drafted reply
        if (enq.draft) {
          setDraftBody(enq.draft.body);
        }

        // Set default send channel based on consent
        setSendChannel(enq.consentWhatsApp ? 'WHATSAPP' : 'EMAIL');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEnquiry();
    // Fetch users for assignment dropdown
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error);
  }, [enquiryId]);

  // Save / Confirm Fields
  const handleConfirmFields = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/extraction`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correctedFields: editFields }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg('Fields confirmed and package scores re-calculated.');
      fetchEnquiry();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Re-generate draft with Gemini
  const handleGenerateDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/generate-draft`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraftBody(data.draft.body);
      setSuccessMsg('Draft reply regenerated.');
      fetchEnquiry();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Accept & Send Reply
  const handleSendReply = async () => {
    if (!draftBody.trim()) {
      alert('Cannot send an empty reply.');
      return;
    }

    if (sendChannel === 'WHATSAPP' && !enquiry.consentWhatsApp) {
      alert('WhatsApp dispatch blocked: customer has not consented to WhatsApp follow-ups.');
      return;
    }

    if (!confirm(`Accept and send this quote to ${enquiry.name} via ${sendChannel}?`)) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/send-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draftBody, channel: sendChannel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(`Quotation dispatched via ${sendChannel} and logged.`);
      fetchEnquiry();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Internal Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        fetchEnquiry();
      }
    } catch {
      alert('Failed to add note');
    }
  };

  // Assign to consultant
  const handleAssignChange = async (newAssigneeId: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: newAssigneeId || null }),
      });
      if (res.ok) {
        fetchEnquiry();
      }
    } catch {
      alert('Failed to update assignee');
    }
  };

  // Change status
  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchEnquiry();
      }
    } catch {
      alert('Failed to update status');
    }
  };

  // DPDP Anonymise PII
  const handleAnonymize = async () => {
    if (!confirm('DPDP Act 2023 Right to Erasure: Anonymize all personal data (name, email, phone) for this customer? This action is irreversible.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/anonymize`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchEnquiry();
      }
    } catch {
      alert('Failed to anonymize enquiry');
    }
  };

  if (loading || !enquiry) {
    return <div className="py-20 text-center text-xs text-stone-500 animate-pulse">Loading enquiry details...</div>;
  }

  const { sla, extraction, suggestions, draft, notes, messages } = enquiry;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 text-xs">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/enquiries')}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#122428]">{enquiry.reference}</span>
              <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono font-bold text-stone-700">
                {enquiry.source}
              </span>
              <span className="text-[10px] font-mono font-semibold text-stone-500">
                Created: {new Date(enquiry.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="font-semibold text-stone-900 mt-0.5">{enquiry.name}</p>
          </div>
        </div>

        {/* Status, Assignee & SLA Banner */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Working-Hours SLA Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-[11px] bg-stone-50 border-stone-200">
            <Clock className="w-3.5 h-3.5 text-[#B85D19]" />
            <span className={sla.isOverdue ? 'text-red-600 font-bold' : 'text-stone-700 font-medium'}>
              {sla.label}
            </span>
          </div>

          {/* Assignee Dropdown */}
          <select
            value={enquiry.assignedTo?.id || ''}
            onChange={(e) => handleAssignChange(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs font-medium"
          >
            <option value="">-- Unassigned --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={enquiry.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-xs font-semibold text-[#122428]"
          >
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="QUOTED">QUOTED</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>

          {/* DPDP Erasure Button (ADMIN only) */}
          {currentUserRole === 'ADMIN' && (
            <button
              onClick={handleAnonymize}
              title="DPDP Act 2023: Wipe PII"
              className="px-2.5 py-1.5 text-stone-400 hover:text-red-700 rounded border border-stone-200 hover:border-red-300"
            >
              Wipe PII
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CORE SPLIT SCREEN: LEFT = ORIGINAL MESSAGE, RIGHT = AI EXTRACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CARD: ORIGINAL CUSTOMER MESSAGE */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                1. Original Customer Request
              </span>
              <span className="font-mono text-[10px] text-stone-400">Channel: {enquiry.source}</span>
            </div>

            {/* Verbatim message block */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 leading-relaxed font-serif text-sm">
              "{enquiry.message}"
            </div>

            {/* Customer Details & Consent Badges */}
            <div className="space-y-2 pt-2 border-t border-stone-100 text-stone-700">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">Email</span>
                  <span className="font-mono font-medium">{enquiry.email}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Phone</span>
                  <span className="font-mono font-medium">{enquiry.phone}</span>
                </div>
              </div>

              {/* DPDP & WhatsApp Compliance Badges */}
              <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  DPDP Act Consent Verified
                </span>

                {enquiry.consentWhatsApp ? (
                  <span className="inline-flex items-center gap-1 text-green-800 bg-green-50 px-2 py-1 rounded border border-green-200">
                    <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                    WhatsApp Opt-in: YES
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    WhatsApp Opt-in: NO (Email Only)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: AI EXTRACTION & HUMAN CONFIRMATION */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B85D19]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#122428]">
                2. AI Extraction ({extraction?.model || 'Rule-Based Fallback'})
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                extraction?.status === 'REVIEWED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {extraction?.status || 'PENDING REVIEW'}
            </span>
          </div>

          {/* Editable Fields Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Destination</label>
              <input
                type="text"
                value={editFields.destination || ''}
                onChange={(e) => setEditFields({ ...editFields, destination: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-medium text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Travel Month</label>
              <input
                type="text"
                value={editFields.startMonth || ''}
                onChange={(e) => setEditFields({ ...editFields, startMonth: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-medium text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Nights</label>
              <input
                type="number"
                value={editFields.nights || 5}
                onChange={(e) => setEditFields({ ...editFields, nights: parseInt(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Total Budget (INR)</label>
              <input
                type="number"
                step="5000"
                value={editFields.budgetTotalINR || 120000}
                onChange={(e) => setEditFields({ ...editFields, budgetTotalINR: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-mono font-bold text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Adults</label>
              <input
                type="number"
                value={editFields.adults || 2}
                onChange={(e) => setEditFields({ ...editFields, adults: parseInt(e.target.value) || 1 })}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-0.5">Children</label>
              <input
                type="number"
                value={editFields.children || 0}
                onChange={(e) => setEditFields({ ...editFields, children: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-mono text-xs bg-white"
              />
            </div>
          </div>

          {/* Must-Haves Tags */}
          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-1">
              Must-Haves & Non-Negotiables
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {editFields.mustHaves?.map((mh, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-stone-100 rounded text-stone-800 text-[11px] flex items-center gap-1 font-medium border border-stone-200"
                >
                  {mh}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = editFields.mustHaves?.filter((_, i) => i !== idx);
                      setEditFields({ ...editFields, mustHaves: updated });
                    }}
                    className="text-stone-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={mustHaveInput}
                onChange={(e) => setMustHaveInput(e.target.value)}
                placeholder="e.g. private pool, houseboat, treehouse"
                className="flex-1 px-2.5 py-1 border border-stone-300 rounded text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (mustHaveInput.trim()) {
                    setEditFields({
                      ...editFields,
                      mustHaves: [...(editFields.mustHaves || []), mustHaveInput.trim()],
                    });
                    setMustHaveInput('');
                  }
                }}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded text-xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleConfirmFields}
              disabled={saving}
              className="px-4 py-2 bg-[#122428] hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm & Recalculate Matches</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 DETERMINISTICALLY RANKED PACKAGES */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-serif font-bold text-[#122428]">
              3. Top Suggested Packages (Deterministic Fit Engine)
            </h2>
            <p className="text-[11px] text-stone-500">
              Scored on destination match, duration match, seasonal tariff availability, budget optimization, and must-haves.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {suggestions?.map((sug: any) => {
            const isRank1 = sug.rank === 1;
            return (
              <div
                key={sug.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  isRank1 ? 'bg-amber-50/70 border-amber-300 shadow-xs' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isRank1 ? 'bg-[#B85D19] text-white' : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      RANK #{sug.rank} · SCORE {sug.score}
                    </span>
                    <span className="font-mono font-bold text-xs text-[#122428]">{sug.packageCode}</span>
                  </div>

                  <h3 className="font-serif text-sm font-bold text-[#122428]">
                    {sug.snapshot?.title || sug.packageCode}
                  </h3>

                  <div className="space-y-1 text-[11px] text-stone-700">
                    {sug.reasons?.map((reason: string, rIdx: number) => (
                      <p key={rIdx} className="flex items-start gap-1.5 leading-tight">
                        <span className="text-[#B85D19] font-bold">✓</span>
                        <span>{reason}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-mono">
                    {sug.snapshot?.days}D / {sug.snapshot?.nights}N
                  </span>
                  <a
                    href={`/packages/${sug.packageSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#B85D19] font-semibold hover:underline"
                  >
                    Inspect Itinerary →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DRAFT REPLY & CERTIFIED PRICE BREAKDOWN TABLE */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-sm font-serif font-bold text-[#122428]">
              4. Draft Reply & Certified Quotation Breakdown
            </h2>
            <p className="text-[11px] text-stone-500">
              The AI output strictly replaces {'{{PRICE:PKG-CODE}}'} with real pricing. The consultant must review and explicitly accept before sending.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => window.open(`/quote/${enquiry.reference}`, '_blank')}
              className="px-3 py-1.5 bg-[#122428] hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open Branded Quote Sheet</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/quote/${enquiry.reference}`;
                navigator.clipboard.writeText(url);
                alert(`Quotation link copied to clipboard:\n${url}`);
              }}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#122428] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-stone-600" />
              <span>Copy Quote Link</span>
            </button>
            <button
              onClick={handleGenerateDraft}
              disabled={saving}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#122428] rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#B85D19]" />
              <span>Regenerate AI Draft</span>
            </button>
          </div>
        </div>

        {/* Live Price Breakdown Table for Suggested Packages */}
        {draft?.priceBreakdown && draft.priceBreakdown.length > 0 && (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <span className="font-semibold text-xs text-stone-900 block">
              Certified Tariffs (Twin-Sharing + 5% GST):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {draft.priceBreakdown.map((b: PriceBreakdown, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-[#122428]">
                    <span>{b.packageCode} ({b.packageTitle})</span>
                    <span className="font-mono text-[#B85D19]">₹{b.total.toLocaleString('en-IN')} total</span>
                  </div>
                  <div className="text-[11px] text-stone-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Adult Rate ({b.adults} pax):</span>
                      <span className="font-mono tabular-nums">₹{b.adultsSubtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {b.children > 0 && (
                      <div className="flex justify-between">
                        <span>Children Rate ({b.children} pax):</span>
                        <span className="font-mono tabular-nums">₹{b.childrenSubtotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (5%):</span>
                      <span className="font-mono tabular-nums">₹{b.gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Body Text Area */}
        <div>
          <label className="block font-medium text-stone-700 mb-1">
            Consultant Editable Reply Body
          </label>
          <textarea
            rows={10}
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="w-full p-4 border border-stone-300 rounded-lg font-mono text-xs leading-relaxed bg-white focus:outline-none focus:ring-1 focus:ring-[#B85D19]"
          />
        </div>

        {/* Send Action Bar */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-medium text-stone-700">Dispatch Channel:</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                <input
                  type="radio"
                  name="channel"
                  value="EMAIL"
                  checked={sendChannel === 'EMAIL'}
                  onChange={() => setSendChannel('EMAIL')}
                />
                <span>Email ({enquiry.email})</span>
              </label>

              <label
                className={`flex items-center gap-1.5 cursor-pointer font-medium ${
                  enquiry.consentWhatsApp ? 'text-green-800' : 'text-stone-400 opacity-60'
                }`}
              >
                <input
                  type="radio"
                  name="channel"
                  value="WHATSAPP"
                  disabled={!enquiry.consentWhatsApp}
                  checked={sendChannel === 'WHATSAPP'}
                  onChange={() => setSendChannel('WHATSAPP')}
                />
                <span>WhatsApp ({enquiry.phone})</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSendReply}
            disabled={saving}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Accept & Send Quotation</span>
          </button>
        </div>
      </div>

      {/* INTERNAL NOTES & MESSAGE LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Internal Notes */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
          <h2 className="text-sm font-serif font-bold text-[#122428] pb-2 border-b border-stone-100">
            Internal Staff Notes
          </h2>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add internal note on phone calls, special requests..."
              className="flex-1 px-3 py-1.5 border border-stone-300 rounded text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#122428] text-white rounded text-xs font-semibold hover:bg-black"
            >
              Add Note
            </button>
          </form>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {notes?.length === 0 ? (
              <p className="text-stone-400 italic text-[11px]">No internal notes yet.</p>
            ) : (
              notes.map((note: any) => (
                <div key={note.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-stone-500 font-mono text-[10px]">
                    <span className="font-semibold text-stone-700">{note.author?.name} ({note.author?.role})</span>
                    <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-stone-800">{note.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Log History (Auto Ack & Sent Quotes) */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
          <h2 className="text-sm font-serif font-bold text-[#122428] pb-2 border-b border-stone-100">
            Communication Dispatch History
          </h2>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {messages?.length === 0 ? (
              <p className="text-stone-400 italic text-[11px]">No messages dispatched yet.</p>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-[11px] space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="font-bold text-[#122428]">
                      [{msg.channel}] {msg.direction} · {msg.template || 'Direct'}
                    </span>
                    <span className="text-stone-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-stone-700 line-clamp-3 italic">"{msg.body}"</p>
                  <p className="text-[10px] text-stone-500 font-mono">Recipient: {msg.recipient}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
