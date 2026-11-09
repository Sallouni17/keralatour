import React, { useState, useEffect } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { DEFAULT_HERO_IMAGE } from '../../lib/constants.ts';
import type { PackageSnapshot } from '../../lib/types.ts';

interface DestinationViewProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const DestinationView: React.FC<DestinationViewProps> = ({ slug, onNavigate, onOpenEnquiry }) => {
  const [destination, setDestination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/destinations/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setDestination(data.destination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-stone-500 animate-pulse">
        Loading regional circuits...
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-serif font-bold text-[#122428]">Destination Not Found</h1>
        <p className="text-xs text-stone-600">The destination circuit you requested could not be located.</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#122428] rounded-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-12">
      {/* Destination Hero */}
      <div className="relative h-[360px] lg:h-[420px] bg-stone-900 overflow-hidden">
        <img
          src={destination.heroImage || DEFAULT_HERO_IMAGE}
          alt={destination.name}
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#122428] via-[#122428]/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 text-white space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-300">Regional Gateway</p>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white">{destination.name}</h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">{destination.summary}</p>
        </div>
      </div>

      {/* Packages in Destination */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#122428]">
            Curated Circuits in {destination.name}
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Prices are per person, twin sharing, plus 5% GST. Fully customizable with our Kochi tour desk.
          </p>
        </div>

        {destination.packages?.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
            No published circuits currently in this destination. Check back soon or request a custom itinerary.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destination.packages.map((pkg: any) => {
              const snapshot: PackageSnapshot = pkg.snapshot;
              const photo = snapshot.photos?.[0] || DEFAULT_HERO_IMAGE;
              const minPrice = snapshot.seasonalPrices?.length
                ? Math.min(...snapshot.seasonalPrices.map((s) => s.pricePerPerson))
                : 25000;

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="aspect-16/10 overflow-hidden relative cursor-pointer"
                      onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                    >
                      <img src={photo} alt={snapshot.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-3 left-3 bg-[#122428]/90 text-white px-2.5 py-1 rounded text-[11px] font-mono">
                        {pkg.code} · {snapshot.days}D / {snapshot.nights}N
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3
                        onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                        className="font-serif text-base font-bold text-[#122428] hover:text-[#B85D19] transition-colors cursor-pointer"
                      >
                        {snapshot.title}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {snapshot.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-stone-500">From</p>
                      <p className="text-sm font-bold font-mono text-[#122428]">
                        ₹{minPrice.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-stone-500">/person + GST</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
