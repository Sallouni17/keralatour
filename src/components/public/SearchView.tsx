import React, { useState, useEffect } from 'react';
import { Search, MapPin, ArrowRight, Filter, AlertCircle } from 'lucide-react';
import { DEFAULT_HERO_IMAGE } from '../../lib/constants.ts';
import type { PackageSnapshot } from '../../lib/types.ts';

interface SearchViewProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ initialQuery = '', onNavigate, onOpenEnquiry }) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const filterTags = ['ALL', 'Houseboat', 'Tea Gardens', 'Wildlife', 'Family', 'Honeymoon', 'Temple Trail'];

  const performSearch = async (searchTerm: string, tag: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      if (tag !== 'ALL') params.set('tag', tag);

      const res = await fetch(`/api/packages?${params.toString()}`);
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query, selectedTag);
  }, [selectedTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, selectedTag);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19]">Search Itineraries</p>
        <h1 className="text-3xl font-serif font-bold text-[#122428]">Find Your Kerala Journey</h1>
        <p className="text-xs text-stone-600">
          Search across highlights like houseboat, tea gardens, temple trails, wildlife safaris, or treehouses.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative pt-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try 'Alleppey houseboat', 'Munnar 5 nights', or 'Family'..."
            className="w-full pl-10 pr-24 py-3 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#B85D19] shadow-xs"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-5.5" />
          <button
            type="submit"
            className="absolute right-2 top-3.5 px-4 py-1.5 bg-[#B85D19] hover:bg-[#a04e13] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Tag Filters (Functional button segmented controls per frontend-design constitution) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
          {filterTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedTag === tag
                  ? 'bg-[#122428] text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 text-xs text-stone-500">
          <span>{loading ? 'Searching...' : `${packages.length} Packages Found`}</span>
          <span>Tariffs per person, twin sharing + 5% GST</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500 animate-pulse">
            Scanning itinerary database...
          </div>
        ) : packages.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-stone-200 p-8 my-6">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-serif text-base font-bold text-[#122428]">No exact packages matched your query</h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              Our 48-member Kochi team customises bespoke tours beyond our published catalogue. Submit an enquiry and we will craft your custom itinerary within 60 minutes.
            </p>
            <button
              onClick={() => onOpenEnquiry()}
              className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#B85D19] rounded-lg"
            >
              Plan Custom Itinerary
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
            {packages.map((pkg) => {
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
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span>{pkg.destination?.name || 'Kerala'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{snapshot.hotelCategory}</span>
                      </div>

                      <h3
                        onClick={() => onNavigate(`/packages/${pkg.slug}`)}
                        className="font-serif text-base font-bold text-[#122428] hover:text-[#B85D19] transition-colors cursor-pointer line-clamp-1"
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
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B85D19] hover:bg-[#a04e13] rounded-lg transition-colors cursor-pointer"
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
