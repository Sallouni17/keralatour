import React, { useState } from 'react';
import { Clock, Calendar, ArrowRight, BookOpen, Compass } from 'lucide-react';
import { BLOG_ARTICLES, BlogArticle } from '../../lib/blogData.ts';

interface BlogListViewProps {
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const BlogListView: React.FC<BlogListViewProps> = ({ onNavigate, onOpenEnquiry }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Backwaters & Cruises', 'Hill Stations & Highlands', 'Heritage & Pilgrimage'];

  const filtered = selectedCategory === 'ALL'
    ? BLOG_ARTICLES
    : BLOG_ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#B85D19]">
          Company A Travel Journal
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#122428]">
          Stories, Seasons & Itinerary Insights
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          In-depth destination guides, seasonal advice, and cultural contexts written by our Kochi operations team. Every story connects directly to verified tour packages.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#122428] text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat === 'ALL' ? 'All Stories' : cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filtered.map((article) => (
          <article
            key={article.slug}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
            onClick={() => onNavigate(`/journal/${article.slug}`)}
          >
            <div>
              {/* Cover Image */}
              <div className="aspect-16/10 overflow-hidden bg-stone-100 relative">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#122428]/85 backdrop-blur-xs text-white text-[10px] font-semibold rounded uppercase tracking-wider">
                  {article.category}
                </span>
              </div>

              {/* Text Meta */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{article.publishedAt}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{article.readingMinutes} min read</span>
                  </span>
                </div>

                <h2 className="text-lg font-serif font-bold text-[#122428] group-hover:text-[#B85D19] transition-colors leading-snug">
                  {article.title}
                </h2>

                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </div>

            {/* Bottom Card Footer: Connected Package Highlight */}
            <div className="p-4 mx-6 mb-6 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B85D19]">
                  Related Circuit
                </p>
                <p className="font-medium text-[#122428] truncate text-xs">
                  {article.relatedPackageTitle}
                </p>
              </div>
              <span className="text-[#B85D19] font-bold shrink-0">→</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

