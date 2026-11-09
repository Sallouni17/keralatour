import React from 'react';
import { ArrowRight, Compass, Shield, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import { DEFAULT_HERO_IMAGE } from '../../lib/constants.ts';
import type { PackageSnapshot } from '../../lib/types.ts';

interface HomeViewProps {
  destinations: any[];
  packages: any[];
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  destinations,
  packages,
  onNavigate,
  onOpenEnquiry,
}) => {
  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[580px] lg:min-h-[680px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Measured Contrast Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={DEFAULT_HERO_IMAGE}
            alt="Kerala Backwaters Luxury Houseboat at Sunrise"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#122428]/95 via-[#122428]/50 to-[#122428]/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/90 font-mono">
            Bespoke Kerala & South India Tour Operator · Kochi HQ
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            The Quiet Splendour of South India, Curated by Locals
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto font-normal leading-relaxed">
            Unhurried holiday itineraries for families, honeymooners, and private groups. Every tariff stated with transparent twin-sharing clarity, and every enquiry answered within 60 minutes.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('journeys');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-semibold text-[#122428] bg-white hover:bg-stone-100 transition-colors rounded-lg shadow-md whitespace-nowrap cursor-pointer"
            >
              Browse Published Packages
            </button>
            <button
              onClick={() => onOpenEnquiry()}
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] transition-colors rounded-lg shadow-md flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Customise an Itinerary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Floating KPI Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-stone-200 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 grid grid-cols-4 gap-6 text-center text-xs text-[#122428]">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#B85D19]" />
              <span className="font-medium">60-Min Triage Guarantee</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-[#B85D19]" />
              <span className="font-medium">Twin-Sharing Tariffs + 5% GST</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Compass className="w-4 h-4 text-[#B85D19]" />
              <span className="font-medium">Private AC Vehicle & Driver</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-[#B85D19]" />
              <span className="font-medium">4,300+ Annual Travelers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DESTINATIONS SECTION */}
      <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Regional Highlights</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#122428] mt-1">
              Destinations Crafted with Intimacy
            </h2>
          </div>
          <p className="text-xs text-[#122428]/70 max-w-md">
            From the tranquil palm canals of Alleppey to the cloud-draped peaks of Munnar and sacred Dravidian corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => onNavigate(`/destinations/${dest.slug}`)}
              className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-stone-400 transition-all duration-200 flex flex-col"
            >
              <div className="aspect-4/3 overflow-hidden relative bg-stone-100">
                <img
                  src={dest.heroImage}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-semibold text-[#122428]">
                  {dest.packageCount} {dest.packageCount === 1 ? 'Circuit' : 'Circuits'}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#122428] group-hover:text-[#B85D19] transition-colors">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-[#122428]/70 mt-1.5 line-clamp-2 leading-relaxed">
                    {dest.summary}
                  </p>
                </div>
                <div className="pt-2 text-xs font-semibold text-[#B85D19] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore circuits</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED CURATED PACKAGES */}
      <section id="journeys" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Curated Portfolio</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#122428] mt-1">
              Signature South India Holidays
            </h2>
          </div>
          <p className="text-xs text-[#122428]/70 max-w-md">
            All prices are per person, twin sharing, plus 5% GST. Each itinerary includes private AC vehicle transfers and certified accommodation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const snapshot: PackageSnapshot = pkg.snapshot;
            const primaryPhoto = snapshot.photos?.[0] || DEFAULT_HERO_IMAGE;
            const minPrice = snapshot.seasonalPrices?.length
              ? Math.min(...snapshot.seasonalPrices.map((s) => s.pricePerPerson))
              : 25000;

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                {/* Photo */}
                <div
                  className="aspect-16/10 overflow-hidden relative cursor-pointer bg-stone-100"
                  onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                >
                  <img
                    src={primaryPhoto}
                    alt={snapshot.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Unboxed Metadata Ribbon */}
                  <div className="absolute bottom-3 left-3 bg-[#122428]/90 text-white backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono">
                    {pkg.code} · {snapshot.days}D / {snapshot.nights}N
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{pkg.destination?.name || 'South India'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{snapshot.hotelCategory}</span>
                    </div>

                    <h3
                      onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                      className="font-serif text-lg font-bold text-[#122428] hover:text-[#B85D19] transition-colors cursor-pointer line-clamp-1"
                    >
                      {snapshot.title}
                    </h3>

                    <p className="text-xs text-[#122428]/70 line-clamp-2 leading-relaxed">
                      {snapshot.summary}
                    </p>

                    {/* Unboxed Tags */}
                    <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#B85D19]">
                      {snapshot.tags?.slice(0, 3).map((tag: string) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">From</p>
                      <p className="text-base font-bold font-mono text-[#122428]">
                        ₹{minPrice.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-stone-500">per person, twin sharing + GST</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                        className="px-3 py-2 text-xs font-semibold text-[#122428] hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                      >
                        Itinerary
                      </button>
                      <button
                        onClick={() => onOpenEnquiry(pkg.id)}
                        className="px-3 py-2 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ABOUT COMPANY A & ETHOS */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#122428] text-white rounded-2xl p-8 sm:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C86432] font-mono">
              The Company A Heritage
            </p>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
              A 48-Staff Operations Desk on Kochi’s Historic Marine Drive
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Founded in Kochi, Kerala, we have guided over 4,300 travelers each year across the backwaters, cardamom plantations, and temple cities of South India. We do not operate call centers or automated deflection bots. When you submit an enquiry, a dedicated senior consultant personally reviews your requirements and responds within 60 minutes.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10 text-center sm:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-white">48</p>
                <p className="text-[11px] text-white/60">Local Team Members</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-white">₹32 Cr</p>
                <p className="text-[11px] text-white/60">Annual Turn-Over</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold font-mono text-white">60 Min</p>
                <p className="text-[11px] text-white/60">Guaranteed Triage</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/10 text-xs text-white/80">
            <h3 className="text-sm font-semibold text-white font-serif">Why Tour Operators Matter in Kerala</h3>
            <p className="leading-relaxed">
              Navigating monsoon water levels, scheduling authentic temple rituals, and securing certified luxury houseboats with verified waste management licenses cannot be delegated to an anonymous booking engine.
            </p>
            <p className="leading-relaxed">
              Our direct relationships with kettle-makers in Alleppey, organic spice growers in Kumily, and tea masters in Munnar ensure that every rupee of your holiday directly supports regional heritage.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onOpenEnquiry()}
                className="px-5 py-2.5 text-xs font-semibold text-[#122428] bg-white hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Speak with a Kochi Specialist
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
