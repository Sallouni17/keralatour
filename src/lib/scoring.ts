import { calculatePriceBreakdown } from './pricing.ts';
import type { ExtractionFields, PackageSnapshot, PackageSuggestionResult } from './types.ts';

export interface PackageCandidate {
  id: string;
  code: string;
  status: string;
  destinationSlug?: string;
  destinationName?: string;
  snapshot: PackageSnapshot;
}

/**
 * Deterministic Package Suggestion Algorithm.
 * Ranks only PUBLISHED packages based on destination, duration, season, budget fit, and must-have keywords.
 */
export function scoreAndRankPackages(
  packages: PackageCandidate[],
  extraction: ExtractionFields
): PackageSuggestionResult[] {
  // Only evaluate PUBLISHED packages
  const published = packages.filter((p) => p.status === 'PUBLISHED');

  const results: PackageSuggestionResult[] = [];

  const targetDest = (extraction.destination || '').toLowerCase().trim();
  const targetNights = extraction.nights;
  const targetMonth = extraction.startMonth;
  const targetBudget = extraction.budgetTotalINR;
  const mustHaves = extraction.mustHaves || [];
  const adults = extraction.adults || 2;
  const children = extraction.children || 0;

  for (const pkg of published) {
    let score = 0;
    const reasons: string[] = [];
    const matchedMustHaves: string[] = [];

    const snapshot = pkg.snapshot;
    const fullText = [
      snapshot.title,
      snapshot.summary,
      pkg.destinationName || '',
      pkg.destinationSlug || '',
      ...(snapshot.tags || []),
      ...(snapshot.inclusions || []),
      ...(snapshot.itinerary || []).map((i) => `${i.title} ${i.description}`),
    ].join(' ').toLowerCase();

    // 1. Destination Match (+30 max)
    if (targetDest) {
      const destName = (pkg.destinationName || '').toLowerCase();
      const destSlug = (pkg.destinationSlug || '').toLowerCase();

      if (
        destName.includes(targetDest) ||
        destSlug.includes(targetDest) ||
        targetDest.includes(destSlug) ||
        targetDest.includes(destName)
      ) {
        score += 30;
        reasons.push(`Exact destination match: ${pkg.destinationName || pkg.destinationSlug}`);
      } else if (fullText.includes(targetDest)) {
        score += 20;
        reasons.push(`Covers destination highlights: ${targetDest}`);
      }
    } else {
      score += 10; // neutral base if no destination specified
    }

    // 2. Duration / Nights Match (+25 max)
    if (typeof targetNights === 'number' && targetNights > 0) {
      const diff = Math.abs(snapshot.nights - targetNights);
      if (diff === 0) {
        score += 25;
        reasons.push(`Perfect duration match: exactly ${snapshot.nights} nights`);
      } else if (diff === 1) {
        score += 18;
        reasons.push(`Very close duration (${snapshot.nights} nights vs ${targetNights} nights requested)`);
      } else if (diff === 2) {
        score += 10;
        reasons.push(`Compatible duration (${snapshot.nights} nights)`);
      }
    } else {
      score += 15;
    }

    // 3. Month / Season Availability (+20 max)
    const breakdown = calculatePriceBreakdown(pkg.code, snapshot.title, snapshot, {
      adults,
      children,
      travelMonth: targetMonth,
    });

    if (targetMonth) {
      score += 20;
      reasons.push(`Seasonal price available for ${targetMonth} (${breakdown.seasonLabel}: ₹${breakdown.pricePerAdult.toLocaleString('en-IN')}/person)`);
    } else {
      score += 10;
    }

    // 4. Budget Fit (+25 max)
    if (typeof targetBudget === 'number' && targetBudget > 0) {
      const estTotal = breakdown.total;
      if (estTotal <= targetBudget) {
        const ratio = estTotal / targetBudget;
        if (ratio >= 0.75) {
          // 75% to 100% of budget: ideal optimal utilization
          score += 25;
          reasons.push(`Within budget: ₹${estTotal.toLocaleString('en-IN')} (Target: ₹${targetBudget.toLocaleString('en-IN')})`);
        } else {
          // significantly under budget
          score += 20;
          reasons.push(`Cost-effective: ₹${estTotal.toLocaleString('en-IN')} is well under your ₹${targetBudget.toLocaleString('en-IN')} budget`);
        }
      } else {
        const overRatio = (estTotal - targetBudget) / targetBudget;
        if (overRatio <= 0.1) {
          score += 10;
          reasons.push(`Slightly above target budget by ${(overRatio * 100).toFixed(0)}% (₹${estTotal.toLocaleString('en-IN')})`);
        } else {
          score += 0;
          reasons.push(`Above target budget (₹${estTotal.toLocaleString('en-IN')} vs ₹${targetBudget.toLocaleString('en-IN')})`);
        }
      }
    } else {
      score += 15;
    }

    // 5. Must-Have Keywords Match (+10 each, up to 30)
    for (const mustHave of mustHaves) {
      const keyword = mustHave.toLowerCase().trim();
      if (!keyword) continue;
      if (fullText.includes(keyword)) {
        score += 10;
        matchedMustHaves.push(mustHave);
        reasons.push(`Includes must-have feature: "${mustHave}"`);
      }
    }

    results.push({
      packageId: pkg.id,
      packageCode: pkg.code,
      packageTitle: snapshot.title,
      rank: 0,
      score,
      reasons,
      estimatedTotal: breakdown.total,
      seasonalPrice: breakdown.pricePerAdult,
      matchedMustHaves,
    });
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  // Assign ranks 1, 2, 3...
  return results.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
