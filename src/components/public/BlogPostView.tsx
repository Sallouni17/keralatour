import React from 'react';
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  User,
  Sparkles,
  ShieldCheck,
  Check,
  MapPin,
} from 'lucide-react';
import { BLOG_ARTICLES, BlogArticle } from '../../lib/blogData.ts';

interface BlogPostViewProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenEnquiry: (packageId?: string) => void;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ slug, onNavigate, onOpenEnquiry }) => {
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h1 className="text-2xl font-serif font-bold text-[#122428]">Story Not Found</h1>
        <p className="text-xs text-stone-600">The travel article you requested could not be located.</p>
        <button
          onClick={() => onNavigate('/journal')}
          className="px-4 py-2 bg-[#122428] text-white text-xs font-semibold rounded-lg"
        >
          Return to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/journal')}
        className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Travel Stories</span>
      </button>

      {/* Article Header */}
      <header className="space-y-4">
        <span className="inline-block px-3 py-1 bg-[#B85D19]/10 text-[#B85D19] font-medium text-xs rounded-full uppercase tracking-wider">
          {article.category}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#122428] leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-y border-stone-200 text-xs text-stone-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#122428] text-white flex items-center justify-center font-bold text-xs">
              {article.author.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-[#122428]">{article.author.name}</p>
              <p className="text-[11px] text-stone-400">{article.author.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-stone-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{article.publishedAt}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readingMinutes} min read</span>
            </span>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="rounded-2xl overflow-hidden aspect-16/9 bg-stone-100 border border-stone-200 shadow-sm">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Body */}
      <div className="prose prose-stone max-w-none space-y-6 text-sm text-stone-800 leading-relaxed font-sans">
        <p className="text-base sm:text-lg font-serif italic text-stone-700 leading-relaxed border-l-2 border-[#B85D19] pl-4">
          {article.content.introduction}
        </p>

        {article.content.sections.map((section, idx) => (
          <section key={idx} className="space-y-2 pt-2">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#122428]">
              {section.heading}
            </h2>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}

        {/* Insider Tip Box */}
        {article.content.insiderTip && (
          <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-xl space-y-1.5 my-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B85D19] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Company A Specialist Tip</span>
            </p>
            <p className="text-xs text-[#122428] font-medium leading-relaxed">
              {article.content.insiderTip}
            </p>
          </div>
        )}
      </div>

      {/* CONNECTED TOUR PACKAGE CARD (Directly Solves Client Ask: Lead Readers to the Right Package) */}
      <aside className="bg-gradient-to-br from-[#122428] to-[#1c383f] text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
            Featured Tour Circuit for this Story
          </span>
          <span className="font-mono text-xs text-stone-300">
            Code: {article.relatedPackageCode}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
            {article.relatedPackageTitle}
          </h3>
          <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
            Experience the exact locations and insider moments detailed in this travel guide. Verified hotels, private air-conditioned vehicle, and dedicated tour chauffeur.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-[11px] text-stone-400">Certified Seasonal Tariff</p>
            <p className="text-2xl font-bold font-mono text-amber-300">
              ₹{article.relatedPackagePrice.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-stone-300">/person + 5% GST</span>
            </p>
            <p className="text-[10px] text-stone-400 font-mono">Twin-sharing basis · Kochi headquarters guaranteed</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(`/packages/${article.relatedPackageSlug}`)}
              className="px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Explore Itinerary
            </button>
            <button
              onClick={() => onOpenEnquiry(article.relatedPackageCode)}
              className="px-5 py-2.5 rounded-lg bg-[#B85D19] hover:bg-[#a04e13] text-xs font-semibold text-white transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Enquire Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

