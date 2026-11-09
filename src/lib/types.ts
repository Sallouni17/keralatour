export type UserRole = 'ADMIN' | 'EDITOR' | 'CONSULTANT' | 'TRAVELLER';

export type PackageStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type EnquirySource = 'WEB_FORM' | 'CHAT' | 'WHATSAPP' | 'EMAIL' | 'PHONE';

export type EnquiryStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'QUOTED' | 'WON' | 'LOST';

export interface SeasonalPrice {
  id?: string;
  label: string; // e.g. "Peak (Oct-Mar)", "Monsoon (Jun-Sep)"
  startMonth: number; // 1-12
  endMonth: number; // 1-12
  pricePerPerson: number; // in INR
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals?: string; // e.g. "Breakfast, Dinner"
  stay?: string; // e.g. "Munnar Tea Resort"
}

export interface MapPoint {
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface PackageSnapshot {
  title: string;
  summary: string;
  days: number;
  nights: number;
  hotelCategory: string; // e.g. "4 Star", "3 Star Deluxe", "5 Star Heritage"
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  hotels: string[];
  photos: string[];
  mapPoints: MapPoint[];
  tags: string[];
  seasonalPrices: SeasonalPrice[];
  childPricePercent: number; // e.g. 50 (means 50% of adult price)
  bestTimeToVisit?: string;
}

export interface ExtractionFields {
  destination?: string;
  startMonth?: string;
  dates?: string;
  nights?: number | null;
  adults?: number;
  children?: number;
  budgetTotalINR?: number | null;
  mustHaves?: string[];
  confidence: {
    destination?: number;
    startMonth?: number;
    nights?: number;
    adults?: number;
    children?: number;
    budgetTotalINR?: number;
    mustHaves?: number;
  };
  sourceSnippets?: {
    destination?: string;
    startMonth?: string;
    nights?: string;
    adults?: string;
    children?: string;
    budgetTotalINR?: string;
    mustHaves?: string;
  };
}

export interface PriceBreakdown {
  packageCode: string;
  packageTitle: string;
  pricePerAdult: number;
  adults: number;
  adultsSubtotal: number;
  pricePerChild: number;
  children: number;
  childrenSubtotal: number;
  subtotal: number;
  gstRate: number; // e.g. 0.05
  gstAmount: number;
  total: number;
  travelMonth?: string;
  seasonLabel?: string;
}

export interface PackageSuggestionResult {
  packageId: string;
  packageCode: string;
  packageTitle: string;
  rank: number;
  score: number;
  reasons: string[];
  estimatedTotal: number;
  seasonalPrice: number;
  matchedMustHaves: string[];
}
