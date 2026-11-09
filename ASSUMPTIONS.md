# Architectural & Business Assumptions — Company A Tours

This document details all domain assumptions made in the implementation of the Company A tour operator application.

---

## 1. Goods & Services Tax (GST) Rate: 5%
- **Assumption**: GST on tour operator services is calculated at a flat **5% without input tax credit (ITC)**, as standard under Indian tax law (Notification No. 11/2017-Central Tax (Rate)).
- **Implementation**: Defined as a centralized configurable constant `GST_RATE = 0.05` in `src/lib/constants.ts` and uniformly stated on all customer-facing quote breakdowns: *"per person, twin sharing, plus GST"*.

---

## 2. Child Pricing Tariff: 50%
- **Assumption**: Unless custom-configured on a specific package version, children aged 2–11 travelling with parents are billed at **50% of the adult twin-sharing rate** (with an extra mattress/cot). Children under 2 years travel complimentary.
- **Implementation**: Stored as `childPricePercent` in the package version snapshot (default 50%, editable in CMS).

---

## 3. Working Hours & SLA Calculation
- **Assumption**: The 48-member Kochi operations desk operates strictly during **09:00 to 18:00 IST (UTC+05:30), Monday through Saturday**. Sunday is non-operational.
- **SLA Clock Rule**: The 60-minute response time commitment only elapses during working hours.
  - An enquiry submitted on Monday at 18:30 IST starts its SLA clock on Tuesday at 09:00 IST.
  - An enquiry submitted on Saturday at 17:45 IST has 15 minutes elapse on Saturday, pauses on Sunday, and reaches its 60-minute limit on Monday at 09:45 IST.
- **Implementation**: Handled deterministically in `src/lib/sla.ts` with test coverage in `tests/core.test.ts`.

---

## 4. Extra Seeded Packages (ASSUMED Sample Data)
In addition to the mandatory client samples (`PKG-KL-07` and `PKG-SI-12`), the following 6 realistic South India itineraries were seeded to demonstrate the full breadth of Company A's ₹32 Cr business:
1. `PKG-KL-02`: Kerala Backwaters & Marari Beach Luxury Honeymoon (5D/4N, 5-Star Heritage, ₹46,000 peak).
2. `PKG-WY-05`: Wayanad Rainforest & Treehouse Family Adventure (4D/3N, 4-Star Eco, ₹22,800 peak).
3. `PKG-KL-03`: Kochi & Munnar Tea Trail Short Break (4D/3N, 4-Star, ₹19,800 peak).
4. `PKG-KL-09`: Grand Kerala Heritage, Wildlife & Houseboat Explorer (8D/7N, 4-Star Deluxe, ₹44,500 peak).
5. `PKG-SI-15`: Ooty, Coorg and Mysore Royal Highlands (6D/5N, 4-Star, ₹29,500 peak).
6. `PKG-SI-18`: Hampi UNESCO Boulders & South Goa Coast (7D/6N, 4-Star, ₹36,000 peak, Scheduled).

All extra packages are annotated in code as `/* ASSUMED sample data */` in `src/server/seed.ts`.

---

## 5. Mock Communication Channels
- **Assumption**: While actual email SMTP relays and WhatsApp Business Cloud API accounts require paid enterprise accounts with Meta and senders, all "sent" acknowledgements and quotes are logged in real-time to the `MessageLog` database table and rendered live in the staff inbox UI.
- **Enforcement**: WhatsApp follow-up messages are strictly blocked unless `consentWhatsApp === true` on the customer enquiry record, satisfying the DPDP Act 2023.
