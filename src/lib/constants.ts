export const GST_RATE = 0.05; // 5% GST on tour operator services (standard in India)

export const DEFAULT_CHILD_PRICE_PERCENT = 50; // 50% of adult twin-sharing rate

export const SLA_RESPONSE_MINUTES = 60; // 1-hour response SLA

export const WORKING_HOURS = {
  startHour: 9, // 09:00 IST
  endHour: 18, // 18:00 IST
  workingDays: [1, 2, 3, 4, 5, 6], // Monday = 1 through Saturday = 6 (0 = Sunday is off)
  timezoneOffsetMinutes: 330, // UTC+05:30 for Indian Standard Time (IST)
};

export const DPDP_CONSENT_TEXT = 
  "I consent to Company A collecting and processing my contact details and travel preferences in accordance with the Digital Personal Data Protection Act, 2023, solely for the purpose of planning and executing this holiday quotation.";

export const WHATSAPP_CONSENT_TEXT = 
  "I would like to receive itinerary updates, quotation drafts, and follow-ups on WhatsApp.";

export const COMPANY_INFO = {
  name: "Company A Tours",
  city: "Kochi, Kerala",
  address: "Marine Drive, Ernakulam, Kochi, Kerala 682031",
  phone: "+91 484 290 8800",
  email: "holidays@companya.test",
  gstin: "32AABCC1234F1Z5",
  license: "Kerala Tourism Approved Tour Operator · Reg No. KT-2018-842",
};

export const DEFAULT_HERO_IMAGE = "/src/assets/images/hero_kerala_backwaters_1793807407345.jpg";
export const DEFAULT_MUNNAR_IMAGE = "/src/assets/images/hero_munnar_tea_hills_1793807408412.jpg";
export const DEFAULT_ALLEPPEY_IMAGE = "/src/assets/images/destination_alleppey_1793807409061.jpg";
export const DEFAULT_THEKKADY_IMAGE = "/src/assets/images/destination_thekkady_1793807409923.jpg";
export const DEFAULT_MADURAI_IMAGE = "/src/assets/images/destination_madurai_temple_1793807409403.jpg";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
