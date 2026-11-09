import React, { useState } from 'react';
import { Compass, Search, User, Menu, X, PhoneCall } from 'lucide-react';
import { COMPANY_INFO } from '../../lib/constants.ts';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenEnquiry }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'All Journeys', path: '/#journeys' },
    { label: 'Destinations', path: '/#destinations' },
    { label: 'Journal', path: '/journal' },
    { label: 'About Us', path: '/#about' },
    { label: 'Search', path: '/search' },
    { label: 'Staff Portal', path: '/admin' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBF9]/95 backdrop-blur-md border-b border-[#122428]/10">
      {/* 3-Zone Top Bar Contract: Brand Wordmark — 4-5 Nav Links — 1 Primary Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single Text Element) */}
        <button
          onClick={() => onNavigate('/')}
          className="text-xl font-bold tracking-tight text-[#122428] font-serif hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 text-left"
        >
          Company A Tours
        </button>

        {/* Zone 2: 4–5 Clean Single-Line Text Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#122428]/80">
          <button
            onClick={() => onNavigate('/#journeys')}
            className={`hover:text-[#122428] transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentPath === '/#journeys' ? 'text-[#122428] font-semibold border-b-2 border-[#B85D19]' : ''
            }`}
          >
            All Journeys
          </button>
          <button
            onClick={() => onNavigate('/#destinations')}
            className="hover:text-[#122428] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Destinations
          </button>
          <button
            onClick={() => onNavigate('/journal')}
            className={`hover:text-[#122428] transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentPath.startsWith('/journal') ? 'text-[#122428] font-semibold border-b-2 border-[#B85D19]' : ''
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => onNavigate('/#about')}
            className="hover:text-[#122428] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            About Us
          </button>
          <button
            onClick={() => onNavigate('/search')}
            className={`flex items-center gap-1.5 hover:text-[#122428] transition-colors whitespace-nowrap shrink-0 py-1 ${
              currentPath === '/search' ? 'text-[#122428] font-semibold border-b-2 border-[#B85D19]' : ''
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button
            onClick={() => onNavigate('/admin')}
            className={`flex items-center gap-1.5 text-xs text-[#122428]/70 hover:text-[#122428] transition-colors whitespace-nowrap shrink-0 px-2 py-1 rounded border border-[#122428]/15 hover:border-[#122428]/40 ${
              currentPath.startsWith('/admin') ? 'bg-[#122428]/5 border-[#122428]/40' : ''
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <a
            href={`tel:${COMPANY_INFO.phone.replace(/[^0-9+]/g, '')}`}
            className="hidden lg:flex items-center gap-1.5 text-xs text-[#122428]/70 hover:text-[#122428] transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#B85D19]" />
            <span className="font-mono tabular-nums">{COMPANY_INFO.phone}</span>
          </a>
          <button
            onClick={() => onOpenEnquiry()}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] transition-colors rounded-lg shadow-sm whitespace-nowrap shrink-0"
          >
            Plan Your Journey
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => onOpenEnquiry()}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#B85D19] rounded-md whitespace-nowrap"
          >
            Enquire
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#122428] rounded-md hover:bg-[#122428]/5"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#122428]/10 bg-[#FBFBF9] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-[#122428] hover:text-[#B85D19]"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#122428]/10 text-xs text-[#122428]/60 space-y-1">
            <p>Direct Inquiries: {COMPANY_INFO.phone}</p>
            <p>{COMPANY_INFO.city}</p>
          </div>
        </div>
      )}
    </header>
  );
};
