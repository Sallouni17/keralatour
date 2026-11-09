import React from 'react';
import { COMPANY_INFO } from '../../lib/constants.ts';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#122428] text-white/80 pt-16 pb-12 border-t border-[#122428]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <h3 className="text-xl font-bold font-serif text-white tracking-tight">Company A Tours</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Curating authentic, unhurried journeys through Kerala and South India for families, honeymooners, and bespoke groups since 2018.
            </p>
            <p className="text-[11px] text-white/50 pt-1 font-mono">
              {COMPANY_INFO.license}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white">Curated Circuits</p>
            <ul className="text-xs space-y-2 text-white/70">
              <li>
                <button onClick={() => onNavigate('/destinations/kerala-backwaters')} className="hover:text-white transition-colors">
                  Kerala Backwaters & Coast
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/destinations/munnar-hills')} className="hover:text-white transition-colors">
                  Munnar & Western Ghats
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/destinations/tamil-nadu-temples')} className="hover:text-white transition-colors">
                  Tamil Nadu Temple Trail
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/destinations/wayanad-nilgiris')} className="hover:text-white transition-colors">
                  Wayanad & Nilgiris Escapes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/journal')} className="text-amber-300 font-medium hover:text-white transition-colors">
                  Travel Journal & Editorial Guides →
                </button>
              </li>
            </ul>
          </div>

          {/* Transparent Guarantees */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white">Our Commitments</p>
            <ul className="text-xs space-y-2 text-white/70">
              <li>• 60-Minute Response Time Guarantee</li>
              <li>• Transparent Pricing (Twin Sharing + 5% GST)</li>
              <li>• Private Chauffeur & Sanitized Fleets</li>
              <li>• 24x7 On-Ground Support from Kochi HQ</li>
              <li>• Zero Hidden Commissions</li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white">Operations Desk</p>
            <p className="text-xs text-white/70 leading-relaxed">
              {COMPANY_INFO.address}
            </p>
            <p className="text-xs text-white/70 pt-1">
              Tel: <span className="font-mono">{COMPANY_INFO.phone}</span>
            </p>
            <p className="text-xs text-white/70">
              Email: <span className="font-mono">{COMPANY_INFO.email}</span>
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/privacy')}
                className="text-xs text-[#C86432] hover:underline"
              >
                Privacy Notice & DPDP Act 2023 Rights
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Bottom Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 gap-4">
          <p>© {new Date().getFullYear()} Company A Tours Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">
              Data Protection & Privacy
            </button>
            <span>·</span>
            <button onClick={() => onNavigate('/admin')} className="hover:text-white transition-colors">
              Staff Admin Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
