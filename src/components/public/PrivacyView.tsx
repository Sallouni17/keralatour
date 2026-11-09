import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, FileText } from 'lucide-react';
import { COMPANY_INFO, DPDP_CONSENT_TEXT, WHATSAPP_CONSENT_TEXT } from '../../lib/constants.ts';

export const PrivacyView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 text-xs text-stone-700 leading-relaxed">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19] font-mono">
          Regulatory Compliance · DPDP Act, 2023
        </p>
        <h1 className="text-3xl font-serif font-bold text-[#122428]">
          Data Privacy & Personal Data Protection Notice
        </h1>
        <p className="text-stone-500">
          Last revised: November 2026 · Company A Tours Pvt. Ltd., Kochi, Kerala
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm text-[#122428]">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Our Digital Personal Data Protection Commitment</span>
        </div>
        <p>
          In accordance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> enacted by the Parliament of India, Company A Tours operates as a Data Fiduciary. We collect only the minimum necessary contact data and holiday preferences required to plan, quote, and execute your South India holiday itinerary.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-base font-bold font-serif text-[#122428]">1. Lawful Basis and Purpose of Processing</h2>
          <p>
            When you submit an enquiry via web form, phone, or direct channels, we seek your explicit consent:
          </p>
          <div className="p-4 bg-stone-50 border-l-2 border-[#B85D19] text-stone-800 rounded">
            "{DPDP_CONSENT_TEXT}"
          </div>
          <p>
            Data processed includes: your name, email, telephone number, tentative travel dates, group size, and specific dietary/mobility/hotel preferences.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold font-serif text-[#122428]">2. Separate and Optional WhatsApp Communications</h2>
          <p>
            In compliance with DPDP principles regarding unbundled consent, WhatsApp communication is treated as an independent option:
          </p>
          <div className="p-4 bg-stone-50 border-l-2 border-[#B85D19] text-stone-800 rounded">
            "{WHATSAPP_CONSENT_TEXT}"
          </div>
          <p>
            If you do not check this box, our system enforces a strict block preventing consultants from dispatching WhatsApp follow-ups, and all communications are routed exclusively through your verified email address.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold font-serif text-[#122428]">3. Data Subject Rights (Access, Correction, and Erasure)</h2>
          <p>
            As a data principal, you hold the following statutory rights under the DPDP Act 2023:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-stone-600">
            <li><strong>Right to Access:</strong> Request a summary of your personal data processed by Company A.</li>
            <li><strong>Right to Correction:</strong> Update or rectify outdated travel or contact details.</li>
            <li><strong>Right to Erasure / Anonymisation:</strong> Request complete deletion of your records. Our admin portal contains an immediate PII-scrub function that wipes names, email addresses, and phone numbers.</li>
            <li><strong>Right to Grievance Redressal:</strong> Direct communication with our designated Grievance Officer in Kochi.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold font-serif text-[#122428]">4. Grievance Officer Contact</h2>
          <p>
            For privacy inquiries, consent revocations, or data erasure requests, please contact:
          </p>
          <div className="p-4 bg-white border border-stone-200 rounded-lg space-y-1 text-stone-800 font-mono text-[11px]">
            <p>Data Protection & Grievance Officer: Radhika Menon</p>
            <p>Company A Tours Pvt. Ltd., Marine Drive, Ernakulam, Kochi 682031</p>
            <p>Email: privacy@companya.test · Direct: +91 484 290 8800</p>
          </div>
        </section>
      </div>

      <div className="pt-4 border-t border-stone-200">
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#122428] rounded-lg"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};
