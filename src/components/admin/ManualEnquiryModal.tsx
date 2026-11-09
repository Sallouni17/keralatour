import React, { useState } from 'react';
import { X, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { MONTH_NAMES } from '../../lib/constants.ts';

interface ManualEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManualEnquiryModal: React.FC<ManualEnquiryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [source, setSource] = useState<'PHONE' | 'WHATSAPP' | 'EMAIL' | 'CHAT'>('PHONE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [travelMonth, setTravelMonth] = useState('December');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState('');
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Contact phone number is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          name: name.trim(),
          email: email.trim() || `client-${Date.now()}@direct.local`,
          phone: phone.trim(),
          travelMonth,
          adults: Number(adults),
          children: Number(children),
          message: message.trim() || `Direct ${source} enquiry taken by staff.`,
          consentWhatsApp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log enquiry');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-base font-bold text-[#122428]">Log Direct Enquiry</h2>
            <p className="text-[11px] text-stone-500">Record leads from phone calls, walk-ins, or WhatsApp</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Source Channel</label>
              <select
                value={source}
                onChange={(e: any) => setSource(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-semibold bg-white"
              >
                <option value="PHONE">Phone Call</option>
                <option value="WHATSAPP">Direct WhatsApp</option>
                <option value="EMAIL">Direct Email</option>
                <option value="CHAT">Live Web Chat</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98..."
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@mail.com"
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Travel Month</label>
              <select
                value={travelMonth}
                onChange={(e) => setTravelMonth(e.target.value)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Adults</label>
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Children</label>
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1.5 border border-stone-300 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Requirements / Call Notes</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Caller requested 5 nights Kerala trip in Dec, private houseboat required, budget around 1 lakh."
              className="w-full px-3 py-2 border border-stone-300 rounded leading-relaxed text-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={consentWhatsApp}
              onChange={(e) => setConsentWhatsApp(e.target.checked)}
              className="rounded text-[#B85D19]"
            />
            <span className="text-[11px] text-stone-700">Customer consented to WhatsApp quotation updates</span>
          </label>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-stone-300 rounded-lg hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#122428] hover:bg-black text-white font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Logging...' : 'Save & Trigger AI Triage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
