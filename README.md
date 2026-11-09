# Company A Tours — Kochi Operations Platform

A modern, production-grade tour operator platform and bespoke enquiry management system built for **Company A**, an established tour operator in Kochi, Kerala (₹28–34 Cr revenue, 4,300+ bookings/year).

---

## Key Problems Solved

1. **5-Minute Package & Tariff Changes**: Content staff and editors can update seasonal price bands, day-by-day itineraries, and inclusions with zero code deployments or agency dependency (previously ₹3,000 and 3 days per change).
2. **Sub-60-Minute Enquiry Triage**: All enquiries from Web, WhatsApp, Phone, Chat, and Email land in a single admin queue with automated extraction, deterministic package scoring, and certified pricing breakdown.
3. **Transparent Twin-Sharing Pricing**: Eliminates quotation ambiguities with standardized calculations: *"per person, twin sharing, plus 5% GST"* with child discounts.
4. **Strict Anti-Hallucination AI Safety**: Gemini 3.8 Flash writes warm, contextual reply drafts using `{{PRICE:PKG-CODE}}` placeholders; the server substitutes verified figures computed directly from the tariff table.

---

## Tech Stack & Architecture

- **Frontend**: React 19, Tailwind CSS v4, custom design system adhering to the Universal Frontend Design Constitution (anti-AI slop, zero static pill clutter, balanced editorial typography).
- **Backend**: Node.js & Express full-stack server running with Vite middleware in development and static/SSR optimization in production.
- **Database & Persistence**: **MongoDB** (`mongodb` official driver ^7.8) with document collections:
  - Supports external MongoDB / MongoDB Atlas via `MONGODB_URI`.
  - In local development, an embedded MongoDB instance runs automatically with persistent storage in `./data/mongodb` via `mongodb-memory-server` without external software installation requirements.
  - Automatic seed initialization: If collections are empty on server boot, sample data is automatically seeded.
- **Authentication & RBAC**: HTTP-only signed session cookies, bcrypt password hashing, server-side role enforcement on every API and page route:
  - `ADMIN`: Managing Director — universal control across packages, enquiries, users, and audit logs.
  - `EDITOR`: Content Editor — package catalog, tariffs, and versions; blocked on enquiry data.
  - `CONSULTANT`: Travel Consultant — enquiry inbox, lead triage, and draft dispatch; blocked on package editing.
- **AI Engine**: Server-side `@google/genai` with model `gemini-3.8-flash` (`httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }`), structured JSON output validated with Zod, and a deterministic rule-based fallback.
- **Compliance**: Digital Personal Data Protection (DPDP) Act, 2023 compliant consent capture, unbundled WhatsApp permission, and 1-click PII erasure.

---

## Demo Staff Login Personas

For instant testing, 1-click buttons are provided on the login page (`/admin`):

| Role | Email | Password | Scope & Boundaries |
| :--- | :--- | :--- | :--- |
| **Admin** (MD) | `admin@companya.test` | `Admin@123` | Universal access to packages, enquiries, users, and audit trail |
| **Editor** | `editor@companya.test` | `Editor@123` | Can create/edit packages; forbidden on enquiries |
| **Consultant** | `consultant@companya.test` | `Consultant@123` | Can triage enquiries & send replies; forbidden on package CMS |

---

## Local Setup & Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Seed demo packages, 15+ enquiries, redirects, and staff users
npm run db:seed

# 3. Run automated test suite (17 Vitest tests across pricing, AI, RBAC, and MongoDB)
npm test

# 4. Start the full-stack development server on port 3000
npm run dev
```

Visit `http://localhost:3000` for the public site, or `http://localhost:3000/admin` for the staff portal.

---

## Environment Variables

Defined in `.env.example` (no secrets committed):

- `GEMINI_API_KEY`: API key for Gemini 3.8 Flash model execution (auto-injected by AI Studio).
- `MONGODB_URI`: MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/companya` or MongoDB Atlas). If unset, defaults to embedded MongoDB with local persistence.
- `MONGODB_DB_NAME`: Database name (defaults to `companya`).
- `SESSION_SECRET`: Secret key used for signing session HMAC-SHA256 cookies.
- `PREVIEW_SECRET`: Secret key used for temporary signed package preview URLs.
- `APP_URL`: Canonical public base URL (`http://localhost:3000` or Cloud Run URL).
