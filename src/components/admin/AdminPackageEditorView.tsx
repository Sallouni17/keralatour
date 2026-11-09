import React, { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  CheckCircle,
  Calendar,
  History,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { validateSeasonalOverlap } from '../../lib/pricing.ts';
import { MONTH_NAMES } from '../../lib/constants.ts';
import type { PackageSnapshot, SeasonalPrice, ItineraryDay } from '../../lib/types.ts';

interface AdminPackageEditorViewProps {
  packageId?: string; // empty if creating new package
  onNavigate: (path: string) => void;
  onOpenPreview: (previewPath: string) => void;
}

export const AdminPackageEditorView: React.FC<AdminPackageEditorViewProps> = ({
  packageId,
  onNavigate,
  onOpenPreview,
}) => {
  const isNew = !packageId || packageId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [publishAt, setPublishAt] = useState('');
  const [baseVersionNumber, setBaseVersionNumber] = useState(1);
  const [changeNote, setChangeNote] = useState('Updated pricing and seasonal tariffs');

  // Package Snapshot
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [days, setDays] = useState(6);
  const [nights, setNights] = useState(5);
  const [hotelCategory, setHotelCategory] = useState('4 Star');
  const [childPricePercent, setChildPricePercent] = useState(50);
  const [tags, setTags] = useState<string[]>(['Tea Gardens', 'Houseboat', 'Backwaters']);
  const [newTagInput, setNewTagInput] = useState('');

  // Seasonal Prices
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([
    { label: 'Peak (Oct–Mar)', startMonth: 10, endMonth: 3, pricePerPerson: 32500 },
    { label: 'Monsoon (Jun–Sep)', startMonth: 6, endMonth: 9, pricePerPerson: 24900 },
  ]);

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { day: 1, title: 'Arrival in Cochin & Transfer to Munnar', description: 'Scenic drive to tea gardens.', meals: 'Dinner', stay: 'Munnar Resort' },
  ]);

  // Inclusions & Exclusions
  const [inclusions, setInclusions] = useState<string[]>([
    'All luxury accommodations with daily breakfast',
    'Private air-conditioned vehicle with dedicated tour chauffeur',
    'Houseboat cruise with all meals prepared on board',
  ]);
  const [exclusions, setExclusions] = useState<string[]>([
    'Airfare or train tickets',
    'Personal expenses and laundry',
    '5% GST applicable as per GOI regulations',
  ]);

  // Hotels & Photos
  const [hotels, setHotels] = useState<string[]>(['Munnar: Tea Valley Resort (4 Star)']);
  const [photos, setPhotos] = useState<string[]>(['/src/assets/images/hero_kerala_backwaters_1793807407345.jpg']);

  // Destinations list
  const [destinations, setDestinations] = useState<any[]>([]);

  // Version History Drawer
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [allVersions, setAllVersions] = useState<any[]>([]);

  // Overlap status helper
  const overlapCheck = validateSeasonalOverlap(seasonalPrices);

  useEffect(() => {
    // Fetch destinations
    fetch('/api/destinations')
      .then((res) => res.json())
      .then((data) => {
        setDestinations(data.destinations || []);
        if (isNew && data.destinations?.[0]) {
          setDestinationId(data.destinations[0].id);
        }
      })
      .catch(console.error);

    // If editing existing package, fetch details
    if (!isNew) {
      setLoading(true);
      fetch(`/api/admin/packages/${packageId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          const pkg = data.package;
          setCode(pkg.code);
          setSlug(pkg.slug);
          setDestinationId(pkg.destinationId);
          setStatus(pkg.status);
          setPublishAt(pkg.publishAt ? new Date(pkg.publishAt).toISOString().slice(0, 16) : '');
          setAllVersions(pkg.versions || []);

          const latest = pkg.versions?.[0];
          if (latest) {
            setBaseVersionNumber(latest.versionNumber);
            const snap: PackageSnapshot = latest.snapshot;
            setTitle(snap.title || '');
            setSummary(snap.summary || '');
            setDays(snap.days || 6);
            setNights(snap.nights || 5);
            setHotelCategory(snap.hotelCategory || '4 Star');
            setChildPricePercent(snap.childPricePercent ?? 50);
            setTags(snap.tags || []);
            setSeasonalPrices(snap.seasonalPrices || []);
            setItinerary(snap.itinerary || []);
            setInclusions(snap.inclusions || []);
            setExclusions(snap.exclusions || []);
            setHotels(snap.hotels || []);
            setPhotos(snap.photos || []);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [packageId, isNew]);

  // Construct current snapshot
  const buildCurrentSnapshot = (): PackageSnapshot => ({
    title: title.trim(),
    summary: summary.trim(),
    days: Number(days),
    nights: Number(nights),
    hotelCategory,
    childPricePercent: Number(childPricePercent),
    tags,
    seasonalPrices,
    itinerary,
    inclusions,
    exclusions,
    hotels,
    photos,
    mapPoints: [],
  });

  const handleSave = async (overrideStatus?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED') => {
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError('Package Title is required.');
      return;
    }
    if (!code.trim()) {
      setError('Package Code is required.');
      return;
    }
    if (!overlapCheck.valid) {
      setError(overlapCheck.error || 'Seasonal price months overlap');
      return;
    }

    setSaving(true);
    const targetStatus = overrideStatus || status;
    const snap = buildCurrentSnapshot();

    try {
      if (isNew) {
        const res = await fetch('/api/admin/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code.trim(),
            slug: slug.trim() || code.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            destinationId,
            status: targetStatus,
            publishAt: publishAt || null,
            changeNote: changeNote || 'Initial version',
            snapshot: snap,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create package');
        setSuccessMessage(`Package ${code} created successfully.`);
        setTimeout(() => onNavigate(`/admin/packages/${data.packageId}`), 1000);
      } else {
        const res = await fetch(`/api/admin/packages/${packageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseVersionNumber,
            destinationId,
            status: targetStatus,
            publishAt: publishAt || null,
            changeNote: changeNote || `Updated package version`,
            snapshot: snap,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409) {
            // Optimistic concurrency conflict!
            throw new Error(data.error);
          }
          throw new Error(data.error || 'Save failed');
        }

        setBaseVersionNumber(data.versionNumber);
        setSuccessMessage(`Saved as Version ${data.versionNumber}.`);
        setStatus(targetStatus);

        // Refresh version list
        const refreshRes = await fetch(`/api/admin/packages/${packageId}`);
        const refreshData = await refreshRes.json();
        setAllVersions(refreshData.package?.versions || []);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (isNew) {
      alert('Please save the initial draft before opening preview.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/preview-token`);
      const data = await res.json();
      if (data.previewPath) {
        onOpenPreview(data.previewPath);
      }
    } catch {
      alert('Failed to generate preview URL');
    }
  };

  const handleRestoreVersion = async (vNum: number) => {
    if (!confirm(`Restore Version ${vNum}? This will create a new Version ${baseVersionNumber + 1} preserving all history.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber: vNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage(`Restored from Version ${vNum} into Version ${data.newVersionNumber}.`);
      setVersionHistoryOpen(false);
      // Reload package
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Seasonal Tariff Row Helpers
  const addSeasonRow = () => {
    setSeasonalPrices([
      ...seasonalPrices,
      { label: 'Special Season', startMonth: 4, endMonth: 5, pricePerPerson: 28000 },
    ]);
  };

  const removeSeasonRow = (idx: number) => {
    setSeasonalPrices(seasonalPrices.filter((_, i) => i !== idx));
  };

  const updateSeasonRow = (idx: number, field: keyof SeasonalPrice, val: any) => {
    const updated = [...seasonalPrices];
    updated[idx] = { ...updated[idx], [field]: val };
    setSeasonalPrices(updated);
  };

  // Itinerary Helpers
  const addItineraryDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      { day: nextDay, title: `Day ${nextDay} Exploration`, description: 'Sightseeing and leisure.', meals: 'Breakfast', stay: 'Boutique Stay' },
    ]);
    setDays(nextDay);
    setNights(Math.max(1, nextDay - 1));
  };

  const removeItineraryDay = (dayIndex: number) => {
    const filtered = itinerary.filter((_, i) => i !== dayIndex);
    // re-number days
    const renumbered = filtered.map((item, idx) => ({ ...item, day: idx + 1 }));
    setItinerary(renumbered);
    setDays(renumbered.length);
    setNights(Math.max(1, renumbered.length - 1));
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-stone-500 animate-pulse">Loading package editor...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Top Bar with 5-Minute CMS Actions */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/packages')}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-[#122428]">{code || 'NEW-PKG'}</span>
              <span className="text-[10px] bg-stone-100 font-mono px-1.5 py-0.5 rounded border border-stone-200">
                v{baseVersionNumber}
              </span>
              <span className="text-[10px] font-bold text-stone-600">[{status}]</span>
            </div>
            <p className="text-xs text-stone-600 truncate max-w-sm">{title || 'Untitled Tour Circuit'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <button
                type="button"
                onClick={() => setVersionHistoryOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
              </button>
              <button
                type="button"
                onClick={handlePreview}
                className="px-3 py-1.5 text-xs font-medium text-[#122428] border border-stone-300 hover:bg-stone-50 rounded-lg flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Draft</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#122428] hover:bg-black rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft Version</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* SECTION 1: CORE BASICS */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-5 text-xs">
        <h2 className="text-base font-serif font-bold text-[#122428] pb-2 border-b border-stone-100">
          1. Itinerary Basics & Identity
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Package Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PKG-KL-07"
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono"
            />
            <p className="text-[10px] text-stone-400 mt-0.5">Unique identifier (e.g. PKG-KL-07)</p>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">URL Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="munnar-thekkady-alleppey-houseboat"
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono"
            />
            <p className="text-[10px] text-stone-400 mt-0.5">Public URL path</p>
          </div>

          <div>
            <label className="block font-medium text-stone-700 mb-1">Destination Region *</label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-stone-700 mb-1">Package Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Munnar, Thekkady and Alleppey Houseboat"
            className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block font-medium text-stone-700 mb-1">Executive Summary *</label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A brief 2-3 sentence overview of this signature circuit..."
            className="w-full px-3 py-2 border border-stone-300 rounded-md leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Days</label>
            <input
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Nights</label>
            <input
              type="number"
              min="0"
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Hotel Category</label>
            <input
              type="text"
              value={hotelCategory}
              onChange={(e) => setHotelCategory(e.target.value)}
              placeholder="4 Star Deluxe"
              className="w-full px-3 py-2 border border-stone-300 rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Child Price %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={childPricePercent}
              onChange={(e) => setChildPricePercent(parseInt(e.target.value) || 50)}
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: SEASONAL PRICING TABLE (The core 5-minute pricing engine) */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-5 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-base font-serif font-bold text-[#122428]">
              2. Seasonal Price Table & Tariffs
            </h2>
            <p className="text-[11px] text-stone-500">
              Set adult twin-sharing rates for each date range. The system enforces no overlapping months.
            </p>
          </div>
          <button
            type="button"
            onClick={addSeasonRow}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B85D19] rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Season Band</span>
          </button>
        </div>

        {!overlapCheck.valid && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Validation Error: {overlapCheck.error}</span>
          </div>
        )}

        <div className="overflow-x-auto border border-stone-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-medium">
              <tr>
                <th className="p-3">Season Label</th>
                <th className="p-3">Start Month</th>
                <th className="p-3">End Month</th>
                <th className="p-3">Price Per Person (₹)</th>
                <th className="p-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {seasonalPrices.map((sp, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="p-3">
                    <input
                      type="text"
                      value={sp.label}
                      onChange={(e) => updateSeasonRow(idx, 'label', e.target.value)}
                      placeholder="e.g. Peak (Oct–Mar)"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-xs"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={sp.startMonth}
                      onChange={(e) => updateSeasonRow(idx, 'startMonth', parseInt(e.target.value))}
                      className="px-2 py-1.5 border border-stone-300 rounded text-xs bg-white"
                    >
                      {MONTH_NAMES.map((m, mIdx) => (
                        <option key={mIdx + 1} value={mIdx + 1}>
                          {m} ({mIdx + 1})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={sp.endMonth}
                      onChange={(e) => updateSeasonRow(idx, 'endMonth', parseInt(e.target.value))}
                      className="px-2 py-1.5 border border-stone-300 rounded text-xs bg-white"
                    >
                      {MONTH_NAMES.map((m, mIdx) => (
                        <option key={mIdx + 1} value={mIdx + 1}>
                          {m} ({mIdx + 1})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-stone-400">₹</span>
                      <input
                        type="number"
                        min="5000"
                        step="500"
                        value={sp.pricePerPerson}
                        onChange={(e) => updateSeasonRow(idx, 'pricePerPerson', parseInt(e.target.value) || 0)}
                        className="pl-6 pr-2 py-1.5 border border-stone-300 rounded font-mono font-bold text-xs w-36"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    {seasonalPrices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSeasonRow(idx)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: ITINERARY BUILDER */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-5 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-base font-serif font-bold text-[#122428]">
              3. Day-by-Day Itinerary Builder
            </h2>
            <p className="text-[11px] text-stone-500">
              Add, remove, or edit day activities. Total days sync automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={addItineraryDay}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#122428] rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Day</span>
          </button>
        </div>

        <div className="space-y-4">
          {itinerary.map((day, idx) => (
            <div key={idx} className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#122428] text-xs">
                  Day {day.day}
                </span>
                {itinerary.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItineraryDay(idx)}
                    className="text-stone-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Day Title</label>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => {
                    const updated = [...itinerary];
                    updated[idx].title = e.target.value;
                    setItinerary(updated);
                  }}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Activities & Highlights</label>
                <textarea
                  rows={2}
                  value={day.description}
                  onChange={(e) => {
                    const updated = [...itinerary];
                    updated[idx].description = e.target.value;
                    setItinerary(updated);
                  }}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-stone-600 mb-1">Meals (Optional)</label>
                  <input
                    type="text"
                    value={day.meals || ''}
                    onChange={(e) => {
                      const updated = [...itinerary];
                      updated[idx].meals = e.target.value;
                      setItinerary(updated);
                    }}
                    placeholder="e.g. Breakfast & Houseboat Dinner"
                    className="w-full px-2 py-1 border border-stone-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-600 mb-1">Stay / Location</label>
                  <input
                    type="text"
                    value={day.stay || ''}
                    onChange={(e) => {
                      const updated = [...itinerary];
                      updated[idx].stay = e.target.value;
                      setItinerary(updated);
                    }}
                    placeholder="e.g. Thekkady Spice Resort"
                    className="w-full px-2 py-1 border border-stone-300 rounded bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: INCLUSIONS & EXCLUSIONS */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-5 text-xs">
        <h2 className="text-base font-serif font-bold text-[#122428] pb-2 border-b border-stone-100">
          4. Inclusions & Exclusions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Inclusions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-800">Inclusions (One per line)</label>
            </div>
            <textarea
              rows={5}
              value={inclusions.join('\n')}
              onChange={(e) => setInclusions(e.target.value.split('\n').filter((l) => l.trim()))}
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Exclusions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-700">Exclusions (One per line)</label>
            </div>
            <textarea
              rows={5}
              value={exclusions.join('\n')}
              onChange={(e) => setExclusions(e.target.value.split('\n').filter((l) => l.trim()))}
              className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono text-xs leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: VERSION CHANGE NOTE & SCHEDULE PUBLISH */}
      <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 space-y-4 text-xs">
        <h2 className="text-sm font-serif font-bold text-[#122428]">
          5. Concurrency Protection & Audit Note
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-stone-700 mb-1">Change Note for Audit Trail *</label>
            <input
              type="text"
              required
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g. Revised Peak season tariff to ₹32,500; updated tea museum day"
              className="w-full px-3 py-2 border border-stone-300 rounded bg-white"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-700 mb-1">Schedule Future Publish (Optional)</label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => {
                setPublishAt(e.target.value);
                if (e.target.value) setStatus('SCHEDULED');
              }}
              className="w-full px-3 py-2 border border-stone-300 rounded bg-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* VERSION HISTORY DRAWER */}
      {versionHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-[#122428]">Version History</h3>
              <button onClick={() => setVersionHistoryOpen(false)} className="text-stone-400 hover:text-stone-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Every save creates an immutable version snapshot. Restoring a version creates a new latest version copied from that snapshot without modifying history.
            </p>

            <div className="space-y-4">
              {allVersions.map((v) => {
                const snap: PackageSnapshot = v.snapshot;
                const isCurrent = v.versionNumber === baseVersionNumber;

                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs ${
                      isCurrent ? 'bg-amber-50/70 border-amber-300' : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#122428]">
                        Version {v.versionNumber} {isCurrent && '(Active in Editor)'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-stone-700 italic">"{v.changeNote || 'No change note'}"</p>
                    <p className="text-[11px] text-stone-500">
                      Saved by: {v.createdBy?.name || 'Staff Member'}
                    </p>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.versionNumber)}
                        className="mt-2 px-3 py-1 bg-[#122428] text-white rounded font-semibold text-[11px] hover:bg-black"
                      >
                        Restore This Version
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
