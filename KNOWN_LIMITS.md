# Known Limits & Strategic Next Steps — Company A Tours

This document outlines the current boundaries of the core slice and the engineering roadmap for subsequent production releases.

---

## 1. Automated PDF Quote Builder
- **Current State**: Quotes are delivered as shareable web links (`/quote/:reference`) with print-optimized CSS (`@media print`) allowing clients and consultants to print or save a branded PDF quotation letterhead with certified tariff tables and booking terms.
- **Next Step**: Integrate headless Chromium via Puppeteer on the server to automatically generate and attach a pre-rendered binary PDF file directly to outbound quote notification emails and WhatsApp webhooks.

---

## 2. Integrated Travel Blog CMS
- **Current State**: The external blogging platform is fully replaced by a native, on-site Travel Journal (`/journal` and `/journal/:slug`). Every article features editorial typography, reading times, category filters, and an embedded "Featured Tour Package" booking card that solves the client's problem of disconnected blogs.
- **Next Step**: Build an in-browser WYSIWYG Markdown authoring studio inside the `/admin` portal (with S3/Cloud Storage photo uploads and SEO preview) so non-technical content staff can publish new travel stories in real time.

---

## 3. Multilingual Support (Hindi & German i18n)
- **Current State**: Public site and staff interface are in English (the primary commercial language for Kerala and South India tourism).
- **Next Step**: Implement internationalization (`i18next`) with dedicated language tracks for domestic North Indian travelers (Hindi) and Company A's foreign inbound groups (specifically German, French, and British cultural travelers).

---

## 4. Live Gateway Integrations (WhatsApp Cloud API & SendGrid)
- **Current State**: Instant acknowledgements and consultant quote proposals are logged into the `MessageLog` database table and visible in the staff triage inbox. WhatsApp messages are strictly gated by the DPDP Act 2023 consent flag.
- **Next Step**: Wire webhook endpoints to Meta's WhatsApp Business Cloud API (with approved HSM templates) and SendGrid/Postmark for production live transmission.

---

## 5. MongoDB Atlas Cluster Scaling
- **Current State**: MongoDB document database running with embedded in-memory persistence (`./data/mongodb`) for zero-friction evaluation, with native support for external MongoDB via `MONGODB_URI`.
- **Next Step**: Configure a managed multi-region MongoDB Atlas replica set (in `asia-south1` Mumbai) with auto-scaling read secondaries when organic traffic exceeds 50,000 monthly visits.
