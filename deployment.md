# Deployment & Local Operations Guide — Company A Tours

This document provides complete instructions for local execution, demo reviewer authentication, and production container deployment for the **Company A Tours** platform.

---

## 1. How to Run Locally (Step by Step)

### Prerequisites
- **Node.js**: v20+ or v22+ (tested on Node v22.17.0)
- **npm**: v10+ or v11+
- **Git**

No external MongoDB server installation is required for local evaluation. The system automatically launches an embedded MongoDB instance with local persistence in `./data/mongodb` via `mongodb-memory-server`.

### Step 1: Clone and Enter the Directory
```bash
git clone
cd keralatour
```

### Step 2: Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

The `.env` file requires no manual edits for local testing. It defaults to:
- `SESSION_SECRET` (auto-set default secret for signed session cookies)
- `PREVIEW_SECRET` (auto-set default salt for signed draft previews)
- `APP_URL=http://localhost:3000`
- `MONGODB_DB_NAME=companya`
- `GEMINI_API_KEY` (Optional: AI extraction & replies automatically use rule-based anti-hallucination fallback if unset)

### Step 3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 4: Seed the Database
Populates 8+ packages (including required `PKG-KL-07` and `PKG-SI-12`), 15+ enquiries (including client sample enquiry), 3 staff accounts, and 140 legacy 301 redirects:
```bash
npm run db:seed
```

### Step 5: Run Automated Tests
Executes the comprehensive Vitest test suite (pricing math, seasonal resolution, SLA calculation, versioning, RBAC, and MongoDB persistence):
```bash
npm test
```

### Step 6: Start the Development Server
```bash
npm run dev
```
Open your browser to:
- **Public Tourist Portal**: [http://localhost:3000](http://localhost:3000)
- **Staff Operations Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Travel Journal & Guides**: [http://localhost:3000/journal](http://localhost:3000/journal)
- **Sample Branded Quotation**: [http://localhost:3000/quote/ENQ-0001](http://localhost:3000/quote/ENQ-0001)

---

## 2. Demo Login Details for the Reviewer

The staff portal (`/admin`) features 1-click login buttons for instant evaluation, or credentials can be entered manually:

| Persona | Role | Email | Password | Access Boundaries & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Radhika Menon** | `ADMIN` (Managing Director) | `admin@companya.test` | `Admin@123` | Universal access across package CMS, enquiry triage, user management, and security audit logs (`/admin/activity`). |
| **Arjun Varma** | `EDITOR` (Content Editor) | `editor@companya.test` | `Editor@123` | Package creation, seasonal pricing, scheduling, and version rollback. Strictly forbidden from viewing or accessing customer enquiry inbox. |
| **Anjali Thomas** | `CONSULTANT` (Travel Specialist) | `consultant@companya.test` | `Consultant@123` | Enquiry inbox triage, AI field correction, certified quotation generation, and email/WhatsApp dispatch. Strictly forbidden from modifying package catalog. |

---

## 3. Environment Variables (Names Only)

As per security guidelines, only variable names are listed. Values must be provided via your secure secrets manager:

- `GEMINI_API_KEY`: API key for Gemini 3.8 Flash model execution (auto-injected in AI Studio / GCP Secret Manager).
- `MONGODB_URI`: Connection string for managed MongoDB (e.g. MongoDB Atlas or Cloud MongoDB). If unset, defaults to embedded MongoDB with local persistence in `./data/mongodb`.
- `MONGODB_DB_NAME`: MongoDB database namespace (defaults to `companya`).
- `SESSION_SECRET`: Minimum 32-character high-entropy secret string used for signing session HMAC-SHA256 cookies.
- `PREVIEW_SECRET`: Secret key used for signing temporary package draft preview tokens.
- `APP_URL`: Canonical public base URL (e.g., `https://keralatour-pro.run.app` or `http://localhost:3000`).
- `PORT`: Server binding port (defaults to `3000`).

---

## 4. Cloud Deployment (Google Cloud Run / Docker)

### Option A: Google Cloud Run (Serverless Container)
Cloud Run automatically manages HTTPS certificates, autoscaling to zero, and regional deployment in `asia-south1` (Mumbai):

1. **Build container**:
   ```bash
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/companya-tours
   ```
2. **Deploy service**:
   ```bash
   gcloud run deploy companya-tours \
     --image gcr.io/<PROJECT_ID>/companya-tours \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars MONGODB_DB_NAME=companya,APP_URL=https://SERVICE_URL \
     --set-secrets GEMINI_API_KEY=gemini-key:latest,SESSION_SECRET=session-secret:latest,MONGODB_URI=mongo-uri:latest
   ```

### Option B: Multi-Stage Production Dockerfile
```dockerfile
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

EXPOSE 3000
CMD ["npm", "run", "start"]
```
