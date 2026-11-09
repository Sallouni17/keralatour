import React, { useState, useEffect } from 'react';
import {
  Printer,
  Calendar,
  Clock,
  MapPin,
  Check,
  X as CloseIcon,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  FileText,
  User,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { COMPANY_INFO, GST_RATE } from '../../lib/constants.ts';
import type { PriceBreakdown } from '../../lib/types.ts';

interface QuoteDetailViewProps {
  reference: string;
  onNavigate: (path: string) => void;
}

export const QuoteDetailView: React.FC<QuoteDetailViewProps> = ({ reference, onNavigate }) => {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/quotes/${reference}`)
      .then((res) => {
        if (!res.ok) throw new Error('Quotation not found or link has expired.');
        return res.json();
      })
      .then((data) => setQuote(data.quote))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reference]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-stone-500 font-mono animate-pulse">
        Retrieving official bespoke quotation from Company A Kochi...
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h1 className="text-2xl font-serif font-bold text-[#122428]">Quotation Not Found</h1>
        <p className="text-xs text-stone-600">{error || 'This quotation does not exist.'}</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 bg-[#122428] text-white text-xs font-semibold rounded-lg"
        >
          Return to Curated Journeys
        </button>
      </div>
    );
  }

  const pkg = quote.package;
  const snapshot = pkg?.snapshot;
  const breakdowns: PriceBreakdown[] = quote.priceBreakdown || [];
  const primaryBreakdown = breakdowns[0];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('/')}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#122428] hover:bg-black rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as Branded PDF</span>
          </button>
          {quote.consultant && (
            <a
              href={`https://wa.me/914842345678?text=${encodeURIComponent(
                `Hi ${quote.consultant.name}, regarding quotation ${quote.reference} for ${quote.customerName}:`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connect on WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Official Branded Quotation Card (Printable Sheet) */}
      <div
        id="quotation-print-area"
        className="bg-white p-8 sm:p-12 rounded-2xl border border-stone-200 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Header / Letterhead */}
        <div className="border-b-2 border-[#122428] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#122428]">Company A Tours</h1>
            <p className="text-xs font-medium text-[#B85D19]">Bespoke South India & Kerala Holidays</p>
            <p className="text-[11px] text-stone-500 leading-relaxed max-w-sm pt-1">
              {COMPANY_INFO.address} · Phone: {COMPANY_INFO.phone} · Email: {COMPANY_INFO.email}
            </p>
            <p className="text-[10px] text-stone-400 font-mono">
              GSTIN: {COMPANY_INFO.gstin} · Kerala Tourism Reg: {COMPANY_INFO.license}
            </p>
          </div>

          <div className="sm:text-right space-y-1 bg-stone-50 p-4 rounded-xl border border-stone-200 print:bg-transparent print:p-0 print:border-none">
            <span className="inline-block px-2 py-0.5 bg-[#B85D19]/10 text-[#B85D19] font-mono font-bold text-[10px] rounded tracking-wider uppercase">
              Official Quotation
            </span>
            <p className="text-lg font-mono font-bold text-[#122428]">{quote.reference}</p>
            <p className="text-[11px] text-stone-500">
              Date: {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-[11px] text-stone-500">
              Validity: 14 Days from issuance
            </p>
          </div>
        </div>

        {/* Client & Itinerary Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/70 p-6 rounded-xl border border-stone-200 print:bg-transparent print:border print:p-4 text-xs">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Traveller Details</p>
            <p className="text-sm font-serif font-bold text-[#122428]">{quote.customerName}</p>
            <div className="space-y-1 text-stone-600">
              <p>
                <span className="font-medium text-stone-800">Travel Timing:</span> {quote.travelMonth || 'Flexible'} {quote.travelDate ? `(${quote.travelDate})` : ''}
              </p>
              <p>
                <span className="font-medium text-stone-800">Party Size:</span> {quote.adults} Adults, {quote.children || 0} Children
              </p>
              {quote.message && (
                <p className="text-[11px] text-stone-500 italic pt-1">
                  "{quote.message}"
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Assigned Tour Specialist</p>
            <p className="text-sm font-serif font-bold text-[#122428]">
              {quote.consultant?.name || 'Kochi Desk Specialist'}
            </p>
            <div className="space-y-1 text-stone-600">
              <p>
                <span className="font-medium text-stone-800">Desk:</span> Company A Kochi Operations Desk
              </p>
              <p>
                <span className="font-medium text-stone-800">Email:</span> {quote.consultant?.email || COMPANY_INFO.email}
              </p>
              <p>
                <span className="font-medium text-stone-800">Direct Chauffeur & Vehicle:</span> Private AC Vehicle
              </p>
            </div>
          </div>
        </div>

        {/* Selected Package Details */}
        {snapshot && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 pb-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B85D19]">Proposed Holiday Circuit</p>
                <h2 className="text-xl font-serif font-bold text-[#122428] mt-0.5">{snapshot.title}</h2>
              </div>
              <span className="text-xs font-mono font-medium text-stone-500">
                {snapshot.days} Days / {snapshot.nights} Nights · {snapshot.hotelCategory}
              </span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">{snapshot.summary}</p>
          </div>
        )}

        {/* Day-by-Day Itinerary Summary */}
        {snapshot?.itinerary && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#122428]">Day-by-Day Journey Schedule</h3>
            <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden text-xs">
              {snapshot.itinerary.map((day: any) => (
                <div key={day.day} className="p-3 bg-white flex items-start gap-4">
                  <span className="w-12 font-mono font-bold text-[#B85D19] shrink-0">Day {day.day}</span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#122428]">{day.title}</p>
                    <p className="text-[11px] text-stone-600">{day.description}</p>
                    {(day.stay || day.meals) && (
                      <p className="text-[10px] text-stone-500 pt-0.5 font-mono">
                        {day.stay ? `Stay: ${day.stay}` : ''} {day.meals ? `· Meals: ${day.meals}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certified Pricing Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#122428]">
              Certified Tariff & Pricing Breakdown
            </h3>
            <span className="text-[11px] text-[#B85D19] font-medium">
              Transparent twin-sharing basis + 5% GST
            </span>
          </div>

          {primaryBreakdown ? (
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-200 text-stone-700">
                <span>
                  Adults Twin-Sharing ({primaryBreakdown.adults} persons @ ₹{primaryBreakdown.pricePerAdult.toLocaleString('en-IN')})
                </span>
                <span className="font-mono font-medium tabular-nums">
                  ₹{primaryBreakdown.adultsSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {primaryBreakdown.children > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-stone-200 text-stone-700">
                  <span>
                    Children ({primaryBreakdown.children} children @ ₹{primaryBreakdown.pricePerChild.toLocaleString('en-IN')})
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    ₹{primaryBreakdown.childrenSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 text-stone-600">
                <span>Subtotal (Net Tour Cost):</span>
                <span className="font-mono tabular-nums">
                  ₹{(primaryBreakdown.adultsSubtotal + primaryBreakdown.childrenSubtotal).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-stone-200 text-stone-600">
                <span>Goods & Services Tax (GST at 5%):</span>
                <span className="font-mono tabular-nums">
                  ₹{primaryBreakdown.gstAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-base font-bold text-[#122428]">
                <span>Total Quotation (INR):</span>
                <span className="font-mono text-xl text-[#B85D19] tabular-nums">
                  ₹{primaryBreakdown.total.toLocaleString('en-IN')}
                </span>
              </div>

              <p className="text-[10px] text-stone-500 pt-1">
                * Rates are certified from Company A seasonal tariff table. No hidden driver allowances, parking fees, or interstate road taxes.
              </p>
            </div>
          ) : (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600">
              Pricing being finalized by consultant. Contact desk for bespoke group pricing.
            </div>
          )}
        </div>

        {/* Inclusions & Exclusions */}
        {snapshot && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
            <div className="space-y-2">
              <h4 className="font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inclusions in Quotation</span>
              </h4>
              <ul className="space-y-1.5 text-stone-700">
                {snapshot.inclusions?.map((inc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 text-[11px]">
                <CloseIcon className="w-3.5 h-3.5 text-stone-400" />
                <span>Exclusions</span>
              </h4>
              <ul className="space-y-1.5 text-stone-700">
                {snapshot.exclusions?.map((exc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">✕</span>
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Terms & Payment Information */}
        <div className="border-t border-stone-200 pt-6 text-[11px] text-stone-500 space-y-2 leading-relaxed">
          <p className="font-semibold text-stone-800">Booking Terms & Assurance:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>25% advance deposit to secure hotel bookings and dedicated chauffeur vehicle reservation.</li>
            <li>Balance payable 7 days prior to journey arrival in Kochi.</li>
            <li>Free date rescheduling up to 15 days before travel date.</li>
            <li>Full 24/7 Kochi control room support throughout your South India holiday.</li>
          </ul>
        </div>

        {/* Signature & Seal */}
        <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-serif font-bold text-[#122428]">Company A Tours — Kochi</p>
            <p className="text-[11px] text-stone-500">Authorized Quotation Seal</p>
          </div>
          <div className="text-right">
            <p className="font-serif font-bold text-[#122428]">{quote.consultant?.name || 'Managing Director'}</p>
            <p className="text-[11px] text-stone-500">{quote.consultant?.role || 'Company A Tours Operations'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

