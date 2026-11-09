import { GST_RATE } from './constants.ts';
import type { SeasonalPrice, PriceBreakdown, PackageSnapshot } from './types.ts';

/**
 * Checks if a 1-based month (1 = Jan, 12 = Dec) falls within [startMonth, endMonth].
 * Handles wrap-around seasons like October to March (start=10, end=3).
 */
export function isMonthInSeason(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  // Wrap around year end (e.g. 10 to 3: 10, 11, 12, 1, 2, 3)
  return month >= startMonth || month <= endMonth;
}

/**
 * Resolves the seasonal price per person for a given travel month or date.
 * If monthOrDate is a string (e.g. "December", "2026-12-15", "12"), parses to 1-12.
 */
export function resolveSeasonalPrice(
  seasonalPrices: SeasonalPrice[],
  monthOrDate?: number | string | null
): SeasonalPrice | null {
  if (!seasonalPrices || seasonalPrices.length === 0) {
    return null;
  }

  let month: number | null = null;

  if (typeof monthOrDate === 'number') {
    month = monthOrDate;
  } else if (typeof monthOrDate === 'string' && monthOrDate.trim()) {
    const trimmed = monthOrDate.trim().toLowerCase();
    const monthMap: Record<string, number> = {
      jan: 1, january: 1, '01': 1, '1': 1,
      feb: 2, february: 2, '02': 2, '2': 2,
      mar: 3, march: 3, '03': 3, '3': 3,
      apr: 4, april: 4, '04': 4, '4': 4,
      may: 5, '05': 5, '5': 5,
      jun: 6, june: 6, '06': 6, '6': 6,
      jul: 7, july: 7, '07': 7, '7': 7,
      aug: 8, august: 8, '08': 8, '8': 8,
      sep: 9, september: 9, '09': 9, '9': 9,
      oct: 10, october: 10, '10': 10,
      nov: 11, november: 11, '11': 11,
      dec: 12, december: 12, '12': 12,
    };

    if (monthMap[trimmed]) {
      month = monthMap[trimmed];
    } else {
      // Check if date string like 2026-12-25
      const parsed = new Date(monthOrDate);
      if (!isNaN(parsed.getTime())) {
        month = parsed.getMonth() + 1;
      }
    }
  }

  if (month === null || month < 1 || month > 12) {
    // Return first season or default
    return seasonalPrices[0];
  }

  // Find matching season
  for (const season of seasonalPrices) {
    if (isMonthInSeason(month, season.startMonth, season.endMonth)) {
      return season;
    }
  }

  return seasonalPrices[0];
}

/**
 * Validates that seasonal price ranges do not have overlapping months.
 * Returns true if valid, or throws/returns false with message if overlap exists.
 */
export function validateSeasonalOverlap(seasonalPrices: SeasonalPrice[]): { valid: boolean; error?: string } {
  const monthAssigned: (string | null)[] = new Array(13).fill(null);

  for (const season of seasonalPrices) {
    const coveredMonths: number[] = [];
    if (season.startMonth <= season.endMonth) {
      for (let m = season.startMonth; m <= season.endMonth; m++) {
        coveredMonths.push(m);
      }
    } else {
      // Wrap-around
      for (let m = season.startMonth; m <= 12; m++) {
        coveredMonths.push(m);
      }
      for (let m = 1; m <= season.endMonth; m++) {
        coveredMonths.push(m);
      }
    }

    for (const m of coveredMonths) {
      if (monthAssigned[m] !== null) {
        return {
          valid: false,
          error: `Month ${m} overlaps between "${monthAssigned[m]}" and "${season.label}"`,
        };
      }
      monthAssigned[m] = season.label;
    }
  }

  return { valid: true };
}

/**
 * Calculates a complete quotation price breakdown with adult rates,
 * child discounts, subtotal, 5% GST, and grand total in INR.
 */
export function calculatePriceBreakdown(
  packageCode: string,
  packageTitle: string,
  snapshot: PackageSnapshot,
  options: {
    adults: number;
    children?: number;
    travelMonth?: string | number | null;
  }
): PriceBreakdown {
  const adults = Math.max(1, options.adults || 2);
  const children = Math.max(0, options.children || 0);

  const matchedSeason = resolveSeasonalPrice(snapshot.seasonalPrices, options.travelMonth);
  const adultRate = matchedSeason ? matchedSeason.pricePerPerson : (snapshot.seasonalPrices[0]?.pricePerPerson ?? 25000);

  const childPercent = snapshot.childPricePercent ?? 50;
  const childRate = Math.round((adultRate * childPercent) / 100);

  const adultsSubtotal = adults * adultRate;
  const childrenSubtotal = children * childRate;
  const subtotal = adultsSubtotal + childrenSubtotal;

  const gstAmount = Math.round(subtotal * GST_RATE);
  const total = subtotal + gstAmount;

  return {
    packageCode,
    packageTitle,
    pricePerAdult: adultRate,
    adults,
    adultsSubtotal,
    pricePerChild: childRate,
    children,
    childrenSubtotal,
    subtotal,
    gstRate: GST_RATE,
    gstAmount,
    total,
    travelMonth: options.travelMonth ? String(options.travelMonth) : undefined,
    seasonLabel: matchedSeason?.label ?? 'Standard',
  };
}

/**
 * Parses budget expressions common in Indian travel enquiries:
 * "1.2 lakh" -> 120000
 * "1,20,000" -> 120000
 * "₹1.2L" -> 120000
 * "80k" -> 80000
 * "1.5 lac" -> 150000
 * "approx 2 lakhs" -> 200000
 */
export function parseBudget(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isNaN(raw) ? null : raw;

  const text = String(raw).trim().toLowerCase();
  if (!text) return null;

  // Pattern: "1.2 lakh", "1.2L", "1.2 lacs"
  const lakhMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    return Math.round(val * 100000);
  }

  // Pattern: "80k", "50 k"
  const kMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*k\b/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    return Math.round(val * 1000);
  }

  // Pattern: "1,20,000" or "120000" or "₹ 120000"
  const digitsOnly = text.replace(/[^0-9]/g, '');
  if (digitsOnly) {
    const num = parseInt(digitsOnly, 10);
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Price placeholder substitution & strict anti-hallucination verification.
 * The AI writes drafts with {{PRICE:PKG-CODE}} placeholders.
 * The server substitutes these with exact calculated prices + twin-sharing & GST clause.
 * If raw model-written INR amounts (like "₹35,000" or "Rs 30000") appear outside placeholders,
 * this function detects and rejects or replaces them to prevent AI pricing hallucination.
 */
export function substitutePricePlaceholders(
  draftText: string,
  breakdowns: PriceBreakdown[]
): {
  processedText: string;
  isSafe: boolean;
  rawPricesDetected: string[];
} {
  let processed = draftText;
  const breakdownMap = new Map<string, PriceBreakdown>();
  for (const b of breakdowns) {
    breakdownMap.set(b.packageCode.toUpperCase(), b);
  }

  // Replace placeholders like {{PRICE:PKG-KL-07}}
  const placeholderRegex = /\{\{PRICE:([A-Za-z0-9_-]+)\}\}/g;
  processed = processed.replace(placeholderRegex, (_match, code) => {
    const b = breakdownMap.get(code.toUpperCase());
    if (b) {
      return `₹${b.pricePerAdult.toLocaleString('en-IN')} per person, twin sharing, plus GST (total package estimated at ₹${b.total.toLocaleString('en-IN')} for ${b.adults} adult${b.adults > 1 ? 's' : ''}${b.children > 0 ? ` and ${b.children} child` : ''} including 5% GST)`;
    }
    return `(contact consultant for current seasonal quotation)`;
  });

  // Check for any remaining unauthorized raw price quotes in the text
  // e.g. "₹ 45,000" or "Rs. 45000" or "INR 45000" that were not generated by substitution
  const rawPriceRegex = /(?:₹|rs\.?|inr)\s*[0-9]{2,}(?:,[0-9]{3})*(?:\.[0-9]{2})?/gi;
  // We check matches that don't match the exact numbers in our calculated breakdowns
  const matches = processed.match(rawPriceRegex) || [];
  const allowedNumbers = new Set<string>();

  for (const b of breakdowns) {
    allowedNumbers.add(String(b.pricePerAdult));
    allowedNumbers.add(b.pricePerAdult.toLocaleString('en-IN'));
    allowedNumbers.add(String(b.total));
    allowedNumbers.add(b.total.toLocaleString('en-IN'));
    allowedNumbers.add(String(b.subtotal));
    allowedNumbers.add(b.subtotal.toLocaleString('en-IN'));
  }

  const unauthorizedPrices: string[] = [];
  for (const match of matches) {
    const cleanNum = match.replace(/[^0-9]/g, '');
    let allowed = false;
    for (const allowedNum of allowedNumbers) {
      if (allowedNum.replace(/[^0-9]/g, '') === cleanNum) {
        allowed = true;
        break;
      }
    }
    if (!allowed && parseInt(cleanNum, 10) > 500) {
      // More than 500 INR could be a model hallucinated price
      unauthorizedPrices.push(match);
    }
  }

  const isSafe = unauthorizedPrices.length === 0;

  return {
    processedText: processed,
    isSafe,
    rawPricesDetected: unauthorizedPrices,
  };
}
