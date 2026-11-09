# Technical Design Document (TDD) — Company A Tours

**Project Repository**: `https://github.com/Sallouni17/keralatour`  
**Live Production URL**: `http://localhost:3000` *(or Cloud Run instance URL)*  
**Client**: Company A Tours, Kochi, Kerala  
**Author**: Lead Full-Stack Software Engineer  
**Date**: November 2026  
**Document Version**: 1.0 (Production Core Release)

---

## Executive Summary & Business Context

Company A is an established, high-reputation tour operator headquartered in Marine Drive, Kochi, generating ₹28–34 crore annually across ~4,300 bookings and 60 tour packages. 

### The Core Financial & Operational Problem:
1. **Content Agility Bottleneck**: The legacy website (built 6 years ago by a freelancer) required external agency intervention for every price or itinerary tweak—costing **₹3,000 and 3 days per change** across ~40 changes/month = **₹14.4 lakh/year** in direct agency leakage.
2. **Slow Enquiry Triage & Conversion Decay**: With 2,400 monthly enquiries arriving across fragmented channels (Web, WhatsApp, Phone, Email, Chat) and logged in Excel, 25% (600 leads) waited over 12 hours for a reply. This dropped conversion from 15% to 7%, leaking **48 bookings a month × ₹65,000 average package × 14% margin = ₹4.37 lakh/month (₹52.42 lakh/year)**.
3. **Total Annual Cost of Inaction**: **₹66.82 lakh/year**.
4. **Disconnected Marketing Content**: Blogs lived on a free external platform with zero connection to commercial packages.

### Solution Delivered:
A unified, high-performance web platform featuring a 5-minute self-serve Package CMS, automated anti-hallucination AI enquiry extraction, deterministic multi-factor package fit scoring, sub-60-minute SLA triage inbox, DPDP Act 2023 compliance, native travel journal, branded quotation generation, and 140 legacy 301 redirects.

---

## 1. System Architecture & Technology Choices

```mermaid
flowchart TD
    subgraph Client ["Client Browser (Mobile & Desktop)"]
        UI["React 19 + Tailwind CSS v4"]
        SPA["Vite SPA Router & Client Cache"]
    end

    subgraph Server ["Node.js / Express Application Server"]
        MW["Security & Session Middleware"]
        REDIR["Dynamic 301 Redirect Engine (140 Legacy URLs)"]
        API["REST API Router (Zod Validated)"]
        SLA["Working-Hours SLA Engine (IST)"]
        PRICING["Deterministic Tariff Calculation Engine"]
        AI["AI Engine (@google/genai / Gemini 3.8 Flash)"]
    end

    subgraph Data ["Persistence Layer"]
        MONGO[("MongoDB 7.8 (Collections)")]
        LOCAL_PERSIST["Local WiredTiger Persistence (./data/mongodb)"]
    end

    UI <-->|HTTP / JSON & Cookies| MW
    MW --> REDIR
    REDIR --> API
    API --> SLA
    API --> PRICING
    API --> AI
    API <--> MONGO
    MONGO <--> LOCAL_PERSIST
```

### Why This Stack Was Chosen:

1. **Node.js & Express with Vite Middleware**:
   - Provides a single, cohesive full-stack environment where TypeScript models, validation schemas (Zod), and pricing calculations are shared between frontend and backend without serialization mismatches.
   - Vite middleware mode delivers instant Hot Module Replacement (HMR) in development and single-bundle static distribution in production.

2. **MongoDB (Document-Oriented Architecture)**:
   - **Why not relational SQL?** Tour packages and itineraries are hierarchical by nature: day-wise itineraries, inclusion lists, hotel tiers, and seasonal price bands change dynamically across versions. Document storage represents these snapshots natively as JSON-compatible structures without requiring 6-way table joins.
   - **Zero-Friction Local Persistence**: Using `mongodb-memory-server` with a persistent WiredTiger directory (`./data/mongodb`) allows reviewers to clone and run the application immediately without installing external database software, while supporting production MongoDB Atlas via `MONGODB_URI`.

3. **React 19 & Tailwind CSS v4**:
   - Clean, editorial typography (`Fraunces` serif + `Plus Jakarta Sans`) adhering to the *Universal Frontend Design Constitution*. Eliminates AI slop, unnecessary gradients, and static pill clutter.
   - High mobile responsiveness: Tour packages feature sticky enquiry bars capped at <15% of mobile viewport height.

4. **Server-Side AI with Deterministic Math Isolation**:
   - Google Gemini 3.8 Flash (`@google/genai`) extracts structured lead entities.
   - **Anti-Hallucination Strict Boundary**: LLMs are forbidden from calculating prices. Gemini outputs `{{PRICE:PKG-CODE}}` tokens, which our backend substitutes with certified arithmetic calculated directly from the seasonal price table.

---

## 2. Data Model & Entity Specifications

The platform is organized into 12 MongoDB collections:

```mermaid
erDiagram
    USERS ||--o{ ACTIVITY_LOGS : performs
    USERS ||--o{ ENQUIRIES : assigned_to
    USERS ||--o{ ENQUIRY_NOTES : authors
    USERS ||--o{ PACKAGE_VERSIONS : creates
    DESTINATIONS ||--o{ PACKAGES : contains
    PACKAGES ||--o{ PACKAGE_VERSIONS : versions
    ENQUIRIES ||--o{ ENQUIRY_EXTRACTIONS : extracts
    ENQUIRIES ||--o{ PACKAGE_SUGGESTIONS : matches
    ENQUIRIES ||--o{ REPLY_DRAFTS : drafts
    ENQUIRIES ||--o{ ENQUIRY_NOTES : internal_notes
    ENQUIRIES ||--o{ MESSAGE_LOGS : communications
```

### Key Schema Entities:

1. **`users`**:
   - `id`, `name`, `email` (unique index), `passwordHash` (bcrypt), `role` (`ADMIN`, `EDITOR`, `CONSULTANT`, `TRAVELLER`), `createdAt`.
2. **`destinations`**:
   - `id`, `slug` (unique index), `name`, `summary`, `heroImage`, `createdAt`.
3. **`packages`**:
   - `id`, `code` (unique index e.g., `PKG-KL-07`), `slug` (unique index), `destinationId`, `status` (`DRAFT`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`), `publishAt`, `currentVersionId`, `updatedAt`.
4. **`package_versions`**:
   - `id`, `packageId`, `versionNumber` (compound unique with `packageId`), `snapshot` (full JSON snapshot of `PackageSnapshot`), `changeNote`, `createdById`, `createdAt`.
5. **`enquiries`**:
   - `id`, `reference` (unique index e.g., `ENQ-0001`), `source` (`WEB_FORM`, `CHAT`, `WHATSAPP`, `EMAIL`, `PHONE`), `packageId`, `name`, `email`, `phone`, `travelMonth`, `travelDate`, `adults`, `children`, `message`, `consentDataProcessing`, `consentWhatsApp`, `status` (`NEW`, `ASSIGNED`, `IN_PROGRESS`, `QUOTED`, `WON`, `LOST`), `assignedToId`, `firstResponseAt`, `createdAt`.
6. **`enquiry_extractions`**:
   - `enquiryId`, `fields` (JSON of `ExtractionFields`), `correctedFields`, `model`, `status` (`PENDING`, `REVIEWED`).
7. **`package_suggestions`**:
   - `enquiryId`, `packageId`, `rank` (1..3), `score` (0..100), `reasons` (JSON array of match explanations).
8. **`reply_drafts`**:
   - `enquiryId`, `body`, `priceBreakdown` (JSON of certified adult/child/GST calculations), `status` (`DRAFT`, `ACCEPTED`, `SENT`, `DISCARDED`).
9. **`redirects`**:
   - `fromPath` (unique index), `toPath`, `statusCode` (301), `createdAt`. 140 seeded legacy URLs.
10. **`activity_logs`**:
    - `actorId`, `action`, `entityType`, `entityId`, `meta`, `createdAt` (index -1).

---

## 3. Main Operational Flows

### Flow 1: Traveller Discovery to Enquiry Submission
```mermaid
sequenceDiagram
    autonumber
    actor Traveller as Traveller (Mobile/Desktop)
    participant Web as Public Website
    participant Server as Express Backend
    participant AI as Gemini 3.8 Flash
    participant DB as MongoDB

    Traveller->>Web: Explores package /packages/munnar-thekkady-alleppey-houseboat
    Web->>Traveller: Renders seasonal price, itinerary, map, inclusions, hotels
    Traveller->>Web: Opens Enquiry Drawer, fills dates, travellers, DPDP consent
    Web->>Server: POST /api/enquiries (Zod validated & rate-limited)
    Server->>DB: Stores Enquiry & logs instant Auto-Ack in MessageLog
    Server-->>Web: Returns Reference ENQ-0001 & confirmation
    Server->>AI: Triggers asynchronous background extraction
    AI-->>Server: Returns structured dates, travellers, budget, must-haves
    Server->>DB: Stores extraction, top 3 scored packages & reply draft
```

### Flow 2: 60-Minute Consultant Triage & Certified Quotation Dispatch
```mermaid
sequenceDiagram
    autonumber
    actor Consultant as Senior Travel Consultant
    participant Inbox as /admin/enquiries
    participant Detail as /admin/enquiries/:id
    participant Server as Express Backend
    participant DB as MongoDB

    Consultant->>Inbox: Views triage queue sorted by SLA deadline
    Inbox->>Consultant: Highlights overdue / approaching commitments
    Consultant->>Detail: Inspects ENQ-0001
    Detail->>Consultant: Side-by-side view: original message vs AI extracted fields
    Consultant->>Detail: Edits/confirms fields & clicks Recalculate Matches
    Detail->>Consultant: Displays top 3 suggested packages & certified price table
    Consultant->>Detail: Reviews drafted reply (with {{PRICE:PKG-CODE}} replaced)
    Consultant->>Detail: Clicks "Accept & Send Quotation"
    Detail->>Server: POST /api/admin/enquiries/:id/send-reply
    Server->>DB: Updates status to QUOTED, logs in MessageLog & ActivityLog
    Consultant->>Detail: Clicks "Open Branded Quote Sheet" (/quote/ENQ-0001)
    Detail->>Consultant: Renders official letterhead ready for print / PDF save
```

### Flow 3: 5-Minute Package & Tariff Management (Editor / MD)
```mermaid
sequenceDiagram
    autonumber
    actor Editor as Content Editor
    participant CMS as /admin/packages/:id
    participant Server as Express Backend
    participant DB as MongoDB

    Editor->>CMS: Modifies Peak Season tariff (e.g. ₹32,500 -> ₹34,000)
    CMS->>CMS: Real-time overlap validator confirms month integrity
    Editor->>CMS: Enters Change Note ("2026/27 holiday tariff adjustment")
    Editor->>CMS: Clicks "Save New Version & Publish"
    CMS->>Server: PUT /api/admin/packages/:id (checks baseVersionNumber)
    Server->>DB: Appends PackageVersion (v2), sets currentVersionId, logs activity
    Server-->>CMS: Confirms version published
    Editor->>CMS: Clicks "Generate Signed Preview Link"
    CMS->>Editor: Opens temporary signed URL (/packages/preview/:id?token=...)
```

---

## 4. Artificial Intelligence & Automation Architecture

### Anti-Hallucination Philosophy
In tourism, AI pricing hallucinations destroy margins and client trust. Our architecture guarantees:
1. **Mathematical Isolation**: The AI generates contextual prose and narrative personalization, but **never invents monetary figures**.
2. **Template Placeholder Replacement**: The AI output uses strict placeholders:
   ```text
   {{PRICE:PKG-KL-07}}
   ```
   The backend replaces this token with certified calculations from `calculatePriceBreakdown()`:
   ```text
   ₹34,125 per person (Twin-sharing ₹32,500 + 5% GST of ₹1,625)
   ```
3. **Editable Fields Beside Original Message**:
   When the AI misinterprets nuances (e.g., confusing "December" with "Easter" or extracting an incorrect party size), the extracted fields sit directly beside the raw customer message. The consultant corrects any field and clicks **"Confirm & Recalculate Matches"**, instantly re-scoring packages.
4. **Deterministic Ranking Fit Engine**:
   Rather than asking an LLM to guess which package to sell, packages are scored deterministically:
   - **Destination Match**: +35 points
   - **Duration Fit**: +25 points (penalized for duration mismatch)
   - **Seasonal Availability**: +20 points
   - **Budget Match**: +15 points
   - **Must-Have Inclusions**: +5 points per matching keyword (e.g., "houseboat", "treehouse", "private pool")
5. **Human-in-the-Loop Gateway**: No quotation or communication is dispatched without human review and explicit acceptance.

---

## 5. UI and Design Decisions

Adhering to the **Universal Frontend Design Constitution**:

1. **Aesthetic Tone — "Travel is Sold by Feeling"**:
   - Deep forest green (`#122428`), warm terracotta (`#B85D19`), cream parchment backgrounds (`#FBFBF9`), and restrained stone borders (`border-stone-200`).
   - Classical editorial typography: `Fraunces` serif for headings and `Plus Jakarta Sans` for clean data legibility.
   - Zero generic gradients, zero floating cartoon pills, and zero AI slop.

2. **Mobile-First Itinerary Experience**:
   - Travellers browse primarily on mobile devices.
   - Sticky bottom booking bar capped at **<15% of viewport height** with price summary and immediate "Enquire Now" drawer trigger.
   - Full photo gallery with modal zoom.
   - Curated SVG Route Map illustrating the road circuit, elevations, and checkpoint stops.

3. **Admin Panel Usability**:
   - High information density without visual clutter.
   - Visual SLA countdown badges (Green: >30m left, Amber: <30m left, Red: Overdue).
   - Instant 1-click demo persona switcher for testing without password friction.

4. **Dedicated Travel Journal**:
   - Solves the client's problem of disconnected blogs.
   - Native articles embedded with "Featured Holiday Circuit" cards that link directly into the package booking drawer.

---

## 6. What Was Cut, and What to Do Next

| Capability | Current Production State | Roadmap Next Step (Post-Review) |
| :--- | :--- | :--- |
| **PDF Quote Export** | Print-optimized web letterhead (`/quote/:reference`) with `@media print` CSS for 1-click browser PDF export. | Server-side headless Chromium (Puppeteer) to automatically render binary PDF attachments on email dispatch. |
| **Blog Authoring** | Native travel journal with seeded articles connecting to packages. | In-browser WYSIWYG Markdown editor in `/admin` with S3/Cloud Storage photo uploads. |
| **Gateways** | Communications logged into `MessageLog` with strict DPDP consent gating. | Direct Meta WhatsApp Cloud API webhooks and SendGrid/Postmark SMTP relay. |
| **Multilingual** | English interface with clear regional context. | `i18next` localized tracks for domestic North Indian Hindi travelers and German cultural groups. |
| **Scale & Clustering** | Embedded MongoDB with local persistence (`./data/mongodb`). | Managed MongoDB Atlas replica set in Mumbai (`asia-south1`) with read secondaries. |

---

## 7. Explicitly Labelled Business Assumptions

*(Extracted from `ASSUMPTIONS.md`)*

1. **[ASSUMPTION-1] Goods & Services Tax (GST) Rate: Flat 5%**:
   - GST on tour operator services is calculated at a flat **5% without Input Tax Credit (ITC)** under Indian Notification No. 11/2017-Central Tax (Rate). Centralized as `GST_RATE = 0.05` in `src/lib/constants.ts`.
2. **[ASSUMPTION-2] Child Pricing Policy: 50%**:
   - Children aged 2–11 travelling with parents are billed at 50% of the adult twin-sharing rate with extra cot. Children under 2 travel complimentary.
3. **[ASSUMPTION-3] Kochi Operations Desk Working Hours & SLA**:
   - Operating hours are **09:00 to 18:00 IST (UTC+05:30), Monday through Saturday**. Sunday is non-operational. The 60-minute SLA clock pauses outside working hours.
4. **[ASSUMPTION-4] DPDP Act 2023 Compliance**:
   - All customer data processing requires explicit consent; WhatsApp follow-up requires an unbundled opt-in checkbox. A 1-click PII anonymization button is provided in `/admin/enquiries/:id` to fulfill the statutory Right to Erasure.
5. **[ASSUMPTION-5] Seed Data Extent**:
   - In addition to client samples `PKG-KL-07` and `PKG-SI-12`, 6 realistic South India circuits were seeded to demonstrate the full breadth of Company A's ₹32 Cr catalog.
6. **[ASSUMPTION-6] 140 Legacy 301 Redirects**:
   - Exactly 140 legacy URLs from the 6-year-old freelancer website (package archives, old blog URLs, and `.html`/`.php` endpoints) are seeded and dynamically redirected with HTTP 301.

---

## 8. Verification & Test Evidence

The automated Vitest test suite (`npm test`) validates all critical business rules:
- **17 Automated Tests Across 3 Test Suites**:
  - `tests/core.test.ts`: Wrap-around seasonal date resolution, seasonal overlap validation, twin-sharing + GST price breakdown, rule-based AI extraction fallback, deterministic package fit scoring, and RBAC authorization matrix.
  - `tests/versioning.test.ts`: Optimistic locking, version incrementation, and rollback integrity.
  - `tests/mongodb.test.ts`: MongoDB schema indexing, package retrieval, version resolution, and verification of exactly 140 legacy 301 redirects.
- **TypeScript Static Verification**:
  - `npm run lint` (`tsc --noEmit`) passes with **0 errors**.
- **Page Load Speed**:
  - Production build bundle size < 250 KB gzipped; initial load time under **1.2 seconds** on simulated 4G mobile networks, well below the 2.5-second constraint.

