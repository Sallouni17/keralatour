import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X as CloseIcon,
  ShieldCheck,
  Info,
  ArrowRight,
  Eye,
  Utensils,
  Hotel,
  Compass,
  Navigation,
  Map as MapIcon,
} from 'lucide-react';
import { GST_RATE, MONTH_NAMES, COMPANY_INFO } from '../../lib/constants.ts';
import { resolveSeasonalPrice, calculatePriceBreakdown } from '../../lib/pricing.ts';
import type { PackageSnapshot, SeasonalPrice } from '../../lib/types.ts';

interface PackageDetailViewProps {
  packageData: {
    id: string;
    code: string;
    slug: string;
    status: string;
    versionNumber?: number;
    destination?: { name: string; slug: string };
    snapshot: PackageSnapshot;
    isPreview?: boolean;
  };
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const PackageDetailView: React.FC<PackageDetailViewProps> = ({
  packageData,
  onNavigate,
  onOpenEnquiry,
}) => {
  const { code, snapshot, destination, isPreview } = packageData;
  const [selectedMonth, setSelectedMonth] = useState('December');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Active seasonal price resolution
  const activeSeason = resolveSeasonalPrice(snapshot.seasonalPrices, selectedMonth);
  const priceBreakdown = calculatePriceBreakdown(code, snapshot.title, snapshot, {
    adults,
    children,
    travelMonth: selectedMonth,
  });

  // Inject JSON-LD Schema for SEO (TouristTrip / Product)
  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: snapshot.title,
      description: snapshot.summary,
      touristType: ['Families', 'Couples', 'Cultural Travelers'],
      itinerary: snapshot.itinerary.map((day) => ({
        '@type': 'TouristAttraction',
        name: day.title,
        description: day.description,
      })),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: activeSeason?.pricePerPerson || 25000,
        priceValidUntil: '2027-03-31',
        description: 'per person, twin sharing, plus GST',
      },
      provider: {
        '@type': 'TravelAgency',
        name: COMPANY_INFO.name,
        telephone: COMPANY_INFO.phone,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Kochi',
          addressRegion: 'Kerala',
          addressCountry: 'India',
        },
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [snapshot, activeSeason, code]);

  return (
    <div className="pb-28">
      {/* Draft Preview Banner */}
      {isPreview && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-xs text-center font-medium sticky top-18 z-30 shadow-md flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          <span>
            STAFF PREVIEW MODE · Viewing Draft Version {packageData.versionNumber || 'X'}. This URL is signed with temporary access and is not visible to the public.
          </span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative h-[420px] lg:h-[480px] bg-stone-900 overflow-hidden">
        <img
          src={snapshot.photos?.[0] || '/src/assets/images/hero_kerala_backwaters_1793807407345.jpg'}
          alt={snapshot.title}
          className="w-full h-full object-cover opacity-85"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#122428] via-[#122428]/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-300">
            <span>{code}</span>
            <span aria-hidden="true">·</span>
            <span>{destination?.name || 'South India'}</span>
            <span aria-hidden="true">·</span>
            <span>{snapshot.days} Days / {snapshot.nights} Nights</span>
            <span aria-hidden="true">·</span>
            <span>{snapshot.hotelCategory}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white max-w-4xl leading-tight">
            {snapshot.title}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-3xl leading-relaxed">
            {snapshot.summary}
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column (2 Cols): Details, Itinerary, Inclusions */}
          <div className="lg:col-span-2 space-y-12">
            {/* Quick Trip Highlights Bar */}
            <div className="bg-white p-5 rounded-xl border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-stone-500 font-medium">Duration</p>
                <p className="text-sm font-bold text-[#122428] mt-0.5">{snapshot.days}D / {snapshot.nights}N</p>
              </div>
              <div>
                <p className="text-stone-500 font-medium">Hotel Category</p>
                <p className="text-sm font-bold text-[#122428] mt-0.5">{snapshot.hotelCategory}</p>
              </div>
              <div>
                <p className="text-stone-500 font-medium">Vehicle Included</p>
                <p className="text-sm font-bold text-[#122428] mt-0.5">Private AC Chauffeur</p>
              </div>
              <div>
                <p className="text-stone-500 font-medium">Child Tariff</p>
                <p className="text-sm font-bold text-[#122428] mt-0.5">{snapshot.childPricePercent || 50}% of Adult</p>
              </div>
            </div>

            {/* Day-by-Day Itinerary */}
            <section className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Day-by-Day Journey</p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#122428] mt-1">
                  Detailed Itinerary
                </h2>
              </div>

              <div className="space-y-4">
                {snapshot.itinerary.map((day) => (
                  <div
                    key={day.day}
                    className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#122428] text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                          0{day.day}
                        </span>
                        <h3 className="font-serif text-base font-bold text-[#122428]">
                          {day.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-[#122428]/80 leading-relaxed pl-11">
                      {day.description}
                    </p>

                    {(day.meals || day.stay) && (
                      <div className="pl-11 pt-2 flex flex-wrap gap-4 text-[11px] text-stone-500">
                        {day.meals && (
                          <div className="flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-[#B85D19]" />
                            <span>{day.meals}</span>
                          </div>
                        )}
                        {day.stay && (
                          <div className="flex items-center gap-1.5">
                            <Hotel className="w-3.5 h-3.5 text-[#B85D19]" />
                            <span>Stay: {day.stay}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Inclusions & Exclusions Side-by-Side */}
            <section className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Transparent Scope</p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#122428] mt-1">
                  Inclusions & Exclusions
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Inclusions */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Included in Tour</span>
                  </h3>
                  <ul className="text-xs text-[#122428]/80 space-y-2.5">
                    {snapshot.inclusions?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-2">
                    <CloseIcon className="w-4 h-4 text-stone-400" />
                    <span>Excluded</span>
                  </h3>
                  <ul className="text-xs text-[#122428]/80 space-y-2.5">
                    {snapshot.exclusions?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CloseIcon className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Accommodation & Route Stops */}
            <section className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Accommodations</p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#122428] mt-1">
                  Verified Hotels & Resorts
                </h2>
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-3">
                <p className="text-xs text-stone-600 leading-relaxed">
                  We maintain strict quality audits on hygiene, linen standards, and power backup across all properties.
                </p>
                <ul className="text-xs space-y-2 text-[#122428]">
                  {snapshot.hotels?.map((hotel, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 py-1.5 border-b border-stone-100 last:border-0">
                      <Hotel className="w-4 h-4 text-[#B85D19] shrink-0" />
                      <span className="font-medium">{hotel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Interactive Route Map & Stops */}
            {snapshot.mapPoints && snapshot.mapPoints.length > 0 && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Geographic Route</p>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#122428] mt-1">
                    Route Map & Transit Stops
                  </h2>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-6">
                  {/* Visual Route Canvas */}
                  <div className="relative w-full h-52 sm:h-56 bg-stone-900 rounded-lg overflow-hidden border border-stone-300 p-4 flex flex-col justify-between text-white">
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#B85D19]" />
                        <span className="text-xs font-medium tracking-wide uppercase text-stone-300">
                          Curated Highway & Scenic Circuit
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 bg-stone-800/80 px-2.5 py-1 rounded">
                        {snapshot.mapPoints.length} Key Checkpoints
                      </span>
                    </div>

                    {/* SVG Route Visualization */}
                    <div className="relative z-10 py-4">
                      <div className="flex items-center justify-between relative px-2">
                        {/* Connecting line */}
                        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#B85D19] via-amber-400 to-emerald-400 opacity-60 z-0" />
                        
                        {snapshot.mapPoints.map((pt, idx) => (
                          <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-[#122428] border-2 border-amber-400 flex items-center justify-center text-xs font-mono font-bold text-amber-300 shadow-md group-hover:scale-110 group-hover:bg-[#B85D19] transition-all">
                              {pt.order || idx + 1}
                            </div>
                            <span className="text-[10px] font-medium text-stone-300 mt-2 max-w-[85px] text-center truncate group-hover:text-white transition-colors">
                              {pt.name.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800 pt-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#B85D19]" />
                        <span>Private AC Tour Chauffeur throughout</span>
                      </span>
                      <span className="font-mono">Dedicated GPS Dispatch</span>
                    </div>
                  </div>

                  {/* Sequential Route Stop Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {snapshot.mapPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-stone-200 bg-stone-50/70 hover:bg-stone-100/80 transition-colors flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#122428] text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0 mt-0.5">
                          {pt.order || idx + 1}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-[#122428] truncate">{pt.name}</p>
                          <p className="text-[10px] font-mono text-stone-500">
                            Lat {pt.lat?.toFixed(4)}, Lng {pt.lng?.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Photo Gallery */}
            {snapshot.photos && snapshot.photos.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-serif font-bold text-[#122428]">Photo Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {snapshot.photos.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhoto(url)}
                      className="aspect-4/3 rounded-lg overflow-hidden border border-stone-200 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (1 Col): Interactive Seasonal Pricing Calculator & Sticky Enquire */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm sticky top-24 space-y-6">
              {/* Header Price Banner */}
              <div className="space-y-1 pb-4 border-b border-stone-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B85D19]">
                  {activeSeason?.label || 'Seasonal Tariff'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-[#122428]">
                    ₹{activeSeason?.pricePerPerson.toLocaleString('en-IN') || '25,000'}
                  </span>
                </div>
                {/* STRICT CLIENT PRICE DISPLAY RULE */}
                <p className="text-xs font-semibold text-[#122428]/80">
                  per person, twin sharing, plus GST
                </p>
                <p className="text-[11px] text-stone-500">
                  GST rate: 5% as per Indian Tour Operator Regulations
                </p>
              </div>

              {/* Month Selector Tabs */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#122428]">
                  Select Travel Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#B85D19] bg-white font-medium"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>
                      {m} (2026/27)
                    </option>
                  ))}
                </select>
              </div>

              {/* Seasonal Tariffs Table */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#122428]">Seasonal Tariffs</p>
                <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                  {snapshot.seasonalPrices?.map((sp, idx) => {
                    const isCurrent = activeSeason?.label === sp.label;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 flex items-center justify-between border-b border-stone-100 last:border-0 ${
                          isCurrent ? 'bg-amber-50/80 font-semibold text-[#B85D19]' : 'text-stone-700'
                        }`}
                      >
                        <span>{sp.label}</span>
                        <span className="font-mono tabular-nums">
                          ₹{sp.pricePerPerson.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] font-normal text-stone-500">/person</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Travellers Estimate */}
              <div className="space-y-3 pt-2 border-t border-stone-100 text-xs">
                <p className="font-semibold text-[#122428]">Estimate Total Package Cost</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">Adults (Twin Sharing)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={adults}
                      onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-600 mb-1">
                      Children ({snapshot.childPricePercent || 50}%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={children}
                      onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Breakdown Summary */}
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-stone-600">
                    <span>Adults Subtotal ({adults} × ₹{priceBreakdown.pricePerAdult.toLocaleString('en-IN')}):</span>
                    <span className="font-mono tabular-nums">₹{priceBreakdown.adultsSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Children Subtotal ({children} × ₹{priceBreakdown.pricePerChild.toLocaleString('en-IN')}):</span>
                      <span className="font-mono tabular-nums">₹{priceBreakdown.childrenSubtotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600">
                    <span>GST (5%):</span>
                    <span className="font-mono tabular-nums">₹{priceBreakdown.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-200 font-bold text-xs text-[#122428]">
                    <span>Estimated Total:</span>
                    <span className="font-mono tabular-nums">₹{priceBreakdown.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Primary Sticky Enquire CTA */}
              <button
                onClick={() => onOpenEnquiry(packageData.id)}
                className="w-full py-3 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] transition-colors rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enquire for {selectedMonth}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-[11px] text-stone-500 text-center space-y-1 pt-1">
                <p>• 60-Minute Response Commitment</p>
                <p>• Customise days, hotels, or route with our Kochi team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar (< 15% Mobile Viewport Height Cap) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2.5 z-40 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <p className="text-[10px] text-stone-500">Starting from</p>
          <p className="text-sm font-bold font-mono text-[#122428]">
            ₹{activeSeason?.pricePerPerson.toLocaleString('en-IN')}{' '}
            <span className="text-[10px] font-normal text-stone-500">/person + GST</span>
          </p>
        </div>
        <button
          onClick={() => onOpenEnquiry(packageData.id)}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-[#B85D19] rounded-lg shrink-0 shadow-sm"
        >
          Enquire Now
        </button>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Zoom" className="max-w-full max-h-[85vh] rounded object-contain" />
        </div>
      )}
    </div>
  );
};
