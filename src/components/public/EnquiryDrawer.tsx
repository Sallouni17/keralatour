import React, { useState } from 'react';
import { X, CheckCircle, Clock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { DPDP_CONSENT_TEXT, WHATSAPP_CONSENT_TEXT, MONTH_NAMES } from '../../lib/constants.ts';

interface EnquiryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackageId?: string;
  initialPackageTitle?: string;
  initialPackageCode?: string;
  onSuccessNavigate?: (reference: string) => void;
}

export const EnquiryDrawer: React.FC<EnquiryDrawerProps> = ({
  isOpen,
  onClose,
  initialPackageId,
  initialPackageTitle,
  initialPackageCode,
  onSuccessNavigate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [travelMonth, setTravelMonth] = useState('December');
  const [travelDate, setTravelDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState(
    initialPackageCode ? `Interested in ${initialPackageCode} - ${initialPackageTitle}. Please provide quotation for our travel dates.` : ''
  );
  const [consentDataProcessing, setConsentDataProcessing] = useState(true);
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!consentDataProcessing) {
      setError('You must accept the DPDP Act 2023 data processing consent to proceed.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: initialPackageId || null,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          travelMonth,
          travelDate: travelDate || null,
          adults: Number(adults),
          children: Number(children),
          message: message.trim() || 'General enquiry for South India travel.',
          consentDataProcessing: true,
          consentWhatsApp,
          source: 'WEB_FORM',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmittedRef(data.reference);
      if (onSuccessNavigate) {
        onSuccessNavigate(data.reference);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FBFBF9] h-full overflow-y-auto shadow-2xl flex flex-col border-l border-[#122428]/15">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#122428]/10 flex items-center justify-between bg-white/70">
          <div>
            <h2 className="text-lg font-bold font-serif text-[#122428]">
              {submittedRef ? 'Enquiry Confirmed' : 'Plan Your Journey'}
            </h2>
            <p className="text-xs text-[#122428]/60 mt-0.5">
              {initialPackageCode ? `${initialPackageCode} · ${initialPackageTitle}` : 'Direct bespoke itinerary planning'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#122428]/60 hover:text-[#122428] rounded-md hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          {submittedRef ? (
            <div className="py-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Enquiry Received</p>
                <h3 className="text-2xl font-bold font-serif text-[#122428]">Reference: {submittedRef}</h3>
                <p className="text-xs text-[#122428]/70 max-w-sm mx-auto leading-relaxed">
                  An instant acknowledgement has been recorded. Our senior tour specialist at our Kochi headquarters is reviewing your itinerary and will reply within our <span className="font-semibold text-[#122428]">60-minute SLA</span>.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-lg text-left text-xs space-y-2 text-[#122428]/80">
                <div className="flex items-center gap-2 font-medium text-[#122428]">
                  <Clock className="w-4 h-4 text-[#B85D19]" />
                  <span>Working Hours Service Commitment</span>
                </div>
                <p className="text-stone-600 leading-normal">
                  Our operations desk operates 09:00 to 18:00 IST (Mon–Sat). If your enquiry lands after hours, you will receive our priority response first thing at 09:00 IST tomorrow morning.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#122428] rounded-lg hover:bg-black transition-colors"
              >
                Return to Site
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {initialPackageCode && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[#122428]">
                  <span className="font-semibold text-xs text-[#B85D19]">{initialPackageCode}</span>
                  <p className="font-medium text-xs mt-0.5">{initialPackageTitle}</p>
                </div>
              )}

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Vikram Malhotra"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs"
                  />
                </div>
              </div>

              {/* Phone & Travel Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 00000"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Travel Month</label>
                  <select
                    value={travelMonth}
                    onChange={(e) => setTravelMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>
                        {m} (2026/27)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Dates (Optional) & Travellers */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Tentative Date</label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-2 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Adults (12+)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#122428] mb-1">Children (2-11)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block font-medium text-[#122428] mb-1">
                  Specific Requirements or Budget Details
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. 5-6 nights, budget around 1.2 lakh total, private houseboat a must, vegetarian food preferences..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white text-xs leading-relaxed"
                />
              </div>

              {/* DPDP Act 2023 Mandatory Consent */}
              <div className="p-3 bg-stone-100 rounded-md border border-stone-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentDataProcessing}
                    onChange={(e) => setConsentDataProcessing(e.target.checked)}
                    className="mt-0.5 rounded text-[#B85D19] focus:ring-[#B85D19]"
                  />
                  <span className="text-[11px] text-stone-700 leading-normal">
                    <span className="font-semibold text-stone-900">Required: </span>
                    {DPDP_CONSENT_TEXT}
                  </span>
                </label>

                {/* WhatsApp Separate Consent */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-stone-200">
                  <input
                    type="checkbox"
                    checked={consentWhatsApp}
                    onChange={(e) => setConsentWhatsApp(e.target.checked)}
                    className="mt-0.5 rounded text-[#B85D19] focus:ring-[#B85D19]"
                  />
                  <span className="text-[11px] text-stone-700 leading-normal">
                    <span className="font-semibold text-stone-900">Optional: </span>
                    {WHATSAPP_CONSENT_TEXT}
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] disabled:opacity-50 transition-colors rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Submitting Enquiry...' : 'Request Transparent Quotation'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#122428]/50 text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero spam guarantee · 60-min response commitment</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
