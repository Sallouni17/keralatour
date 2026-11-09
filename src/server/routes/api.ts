import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { parseCookies, serializeCookie } from '../../lib/cookie.ts';
import { collections, ObjectId, idMatch, normalizeDoc, normalizeDocs } from '../mongodb.ts';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  checkRoleAccess,
  signPreviewToken,
  verifyPreviewToken,
  SESSION_COOKIE_NAME,
} from '../../lib/auth.ts';
import { extractEnquiryDetails, draftReplyEmail } from '../../lib/ai.ts';
import { scoreAndRankPackages } from '../../lib/scoring.ts';
import { evaluateEnquirySLA } from '../../lib/sla.ts';
import { validateSeasonalOverlap } from '../../lib/pricing.ts';
import type { UserRole, PackageSnapshot, ExtractionFields } from '../../lib/types.ts';

export const apiRouter = Router();

// Extend Express Request with User session
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

// In-Memory Rate Limiter for public enquiry submission (IP based)
const submissionRateLimit = new Map<string, { count: number; resetAt: number }>();

function publicRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // max 10 enquiry submissions per minute per IP

  const record = submissionRateLimit.get(ip);
  if (!record || now > record.resetAt) {
    submissionRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too many enquiry submissions from this IP. Please wait a moment before trying again.',
    });
  }

  record.count += 1;
  next();
}

// Session extractor middleware
export function sessionMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE_NAME];
  const session = verifySessionToken(token);

  if (session) {
    req.user = {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    };
  }
  next();
}

// Auth Guard Middleware
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!checkRoleAccess(req.user.role, allowedRoles)) {
      // Log unauthorized attempt in activity log
      try {
        await collections.activityLogs().insertOne({
          _id: new ObjectId(),
          id: new ObjectId().toHexString(),
          actorId: req.user.userId,
          action: 'ROLE_CHECK_DENIED',
          entityType: 'SECURITY',
          entityId: null,
          meta: JSON.stringify({
            userRole: req.user.role,
            requiredRoles: allowedRoles,
            path: req.originalUrl,
          }),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error('Failed to log security violation:', e);
      }

      return res.status(403).json({
        error: `Forbidden: role ${req.user.role} does not have access to this resource`,
      });
    }

    next();
  };
}

// --------------------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// --------------------------------------------------------------------------

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid credentials format' });
  }

  const { email, password } = parsed.data;
  const rawUser = await collections.users().findOne({ email: email.toLowerCase() });

  if (!rawUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const user = normalizeDoc(rawUser);

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  });

  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
  );

  await collections.activityLogs().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    actorId: user.id,
    action: 'USER_LOGIN',
    entityType: 'USER',
    entityId: user.id,
    meta: JSON.stringify({ role: user.role, email: user.email }),
    createdAt: new Date(),
  });

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  );
  return res.json({ success: true });
});

apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }
  return res.json({ user: req.user });
});

// --------------------------------------------------------------------------
// 2. PUBLIC DESTINATIONS & PACKAGES
// --------------------------------------------------------------------------

apiRouter.get('/destinations', async (req: Request, res: Response) => {
  const rawDestinations = await collections.destinations().find().sort({ name: 1 }).toArray();
  const destinations = normalizeDocs(rawDestinations);

  const formatted = await Promise.all(
    destinations.map(async (d) => {
      const packageCount = await collections.packages().countDocuments({
        destinationId: d.id,
        status: 'PUBLISHED',
      });

      return {
        id: d.id,
        slug: d.slug,
        name: d.name,
        summary: d.summary,
        heroImage: d.heroImage,
        packageCount,
      };
    })
  );

  return res.json({ destinations: formatted });
});

apiRouter.get('/destinations/:slug', async (req: Request, res: Response) => {
  const rawDest = await collections.destinations().findOne({ slug: req.params.slug });
  if (!rawDest) {
    return res.status(404).json({ error: 'Destination not found' });
  }
  const destination = normalizeDoc(rawDest);

  const rawPackages = await collections.packages().find({
    destinationId: destination.id,
    status: 'PUBLISHED',
  }).toArray();
  const packagesList = normalizeDocs(rawPackages);

  const packages = (
    await Promise.all(
      packagesList.map(async (pkg) => {
        const rawVersion = await collections.packageVersions()
          .find({ packageId: pkg.id })
          .sort({ versionNumber: -1 })
          .limit(1)
          .next();

        if (!rawVersion) return null;
        try {
          const snapshot: PackageSnapshot = JSON.parse(rawVersion.snapshot);
          return {
            id: pkg.id,
            code: pkg.code,
            slug: pkg.slug,
            status: pkg.status,
            snapshot,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  return res.json({
    destination: {
      id: destination.id,
      slug: destination.slug,
      name: destination.name,
      summary: destination.summary,
      heroImage: destination.heroImage,
      packages,
    },
  });
});

apiRouter.get('/packages', async (req: Request, res: Response) => {
  const { destination, tag, q } = req.query;

  const filter: any = {
    status: 'PUBLISHED',
  };

  if (destination && typeof destination === 'string') {
    const dest = await collections.destinations().findOne({ slug: destination });
    if (dest) {
      const normDest = normalizeDoc(dest);
      filter.destinationId = normDest.id;
    } else {
      return res.json({ packages: [] });
    }
  }

  const rawPackages = await collections.packages().find(filter).sort({ updatedAt: -1 }).toArray();
  const packagesList = normalizeDocs(rawPackages);

  // Cache destinations in memory for speed
  const rawAllDest = await collections.destinations().find().toArray();
  const allDestMap = new Map<string, any>();
  for (const d of normalizeDocs(rawAllDest)) {
    allDestMap.set(d.id, d);
  }

  const results = (
    await Promise.all(
      packagesList.map(async (pkg) => {
        const rawVersion = await collections.packageVersions()
          .find({ packageId: pkg.id })
          .sort({ versionNumber: -1 })
          .limit(1)
          .next();

        if (!rawVersion) return null;

        try {
          const snapshot: PackageSnapshot = JSON.parse(rawVersion.snapshot);
          const dest = allDestMap.get(pkg.destinationId) || null;

          // Filter by tag if requested
          if (tag && typeof tag === 'string') {
            const hasTag = snapshot.tags?.some((t) => t.toLowerCase() === tag.toLowerCase());
            if (!hasTag) return null;
          }

          // Filter by text search if requested
          if (q && typeof q === 'string') {
            const query = q.toLowerCase();
            const matches =
              pkg.code.toLowerCase().includes(query) ||
              pkg.slug.toLowerCase().includes(query) ||
              snapshot.title.toLowerCase().includes(query) ||
              snapshot.summary.toLowerCase().includes(query) ||
              (dest && dest.name.toLowerCase().includes(query)) ||
              snapshot.tags?.some((t) => t.toLowerCase().includes(query)) ||
              snapshot.inclusions?.some((i) => i.toLowerCase().includes(query));

            if (!matches) return null;
          }

          return {
            id: pkg.id,
            code: pkg.code,
            slug: pkg.slug,
            status: pkg.status,
            destination: dest,
            snapshot,
          };
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  return res.json({ packages: results });
});

apiRouter.get('/packages/:slug', async (req: Request, res: Response) => {
  const rawPkg = await collections.packages().findOne({ slug: req.params.slug });
  if (!rawPkg) {
    return res.status(404).json({ error: 'Package not found' });
  }
  const pkg = normalizeDoc(rawPkg);

  const isScheduledReady = pkg.status === 'SCHEDULED' && pkg.publishAt && new Date(pkg.publishAt).getTime() <= Date.now();
  if (pkg.status !== 'PUBLISHED' && !isScheduledReady) {
    return res.status(404).json({ error: 'Package not found' });
  }

  const rawVersion = await collections.packageVersions()
    .find({ packageId: pkg.id })
    .sort({ versionNumber: -1 })
    .limit(1)
    .next();

  if (!rawVersion) {
    return res.status(404).json({ error: 'Package version not found' });
  }

  const dest = await collections.destinations().findOne(idMatch(pkg.destinationId));

  try {
    const snapshot: PackageSnapshot = JSON.parse(rawVersion.snapshot);
    return res.json({
      package: {
        id: pkg.id,
        code: pkg.code,
        slug: pkg.slug,
        status: pkg.status,
        destination: normalizeDoc(dest),
        versionNumber: rawVersion.versionNumber,
        snapshot,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse package snapshot' });
  }
});

// Preview endpoint for draft package versions
apiRouter.get('/packages/preview/:id', async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  const verification = verifyPreviewToken(token);

  if (!verification.valid || verification.packageId !== req.params.id) {
    return res.status(403).json({ error: 'Invalid or expired preview token' });
  }

  const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
  if (!rawPkg) {
    return res.status(404).json({ error: 'Package not found' });
  }
  const pkg = normalizeDoc(rawPkg);

  let rawVersion = null;
  if (verification.versionId) {
    rawVersion = await collections.packageVersions().findOne(idMatch(verification.versionId));
  }
  if (!rawVersion) {
    rawVersion = await collections.packageVersions()
      .find({ packageId: pkg.id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .next();
  }

  if (!rawVersion) {
    return res.status(404).json({ error: 'Preview version not found' });
  }

  const dest = await collections.destinations().findOne(idMatch(pkg.destinationId));

  try {
    const snapshot: PackageSnapshot = JSON.parse(rawVersion.snapshot);
    return res.json({
      package: {
        id: pkg.id,
        code: pkg.code,
        slug: pkg.slug,
        status: pkg.status,
        destination: normalizeDoc(dest),
        versionNumber: rawVersion.versionNumber,
        snapshot,
        isPreview: true,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to parse preview version' });
  }
});

// --------------------------------------------------------------------------
// 3. PUBLIC ENQUIRY SUBMISSION (Rate limited, Zod validated)
// --------------------------------------------------------------------------

const EnquiryInputSchema = z.object({
  packageId: z.string().optional().nullable(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  travelMonth: z.string().optional().nullable(),
  travelDate: z.string().optional().nullable(),
  adults: z.number().int().min(1).default(2),
  children: z.number().int().min(0).default(0),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  consentDataProcessing: z.boolean().refine((val) => val === true, {
    message: 'You must consent to data processing under the DPDP Act 2023.',
  }),
  consentWhatsApp: z.boolean().default(false),
  source: z.enum(['WEB_FORM', 'CHAT', 'WHATSAPP', 'EMAIL', 'PHONE']).default('WEB_FORM'),
});

apiRouter.post('/enquiries', publicRateLimiter, async (req: Request, res: Response) => {
  const parsed = EnquiryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.format(),
    });
  }

  const data = parsed.data;

  // Generate Reference: ENQ-XXXX
  const count = await collections.enquiries().countDocuments();
  const reference = `ENQ-${String(count + 1).padStart(4, '0')}`;

  const enquiryId = new ObjectId().toHexString();
  const now = new Date();

  const newEnquiry = {
    _id: new ObjectId(enquiryId),
    id: enquiryId,
    reference,
    source: data.source,
    packageId: data.packageId || null,
    name: data.name,
    email: data.email,
    phone: data.phone,
    travelMonth: data.travelMonth || null,
    travelDate: data.travelDate || null,
    adults: data.adults,
    children: data.children,
    message: data.message,
    consentDataProcessing: data.consentDataProcessing,
    consentWhatsApp: data.consentWhatsApp,
    status: 'NEW' as const,
    assignedToId: null,
    firstResponseAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await collections.enquiries().insertOne(newEnquiry);

  // Log automated acknowledgement in MessageLog
  await collections.messageLogs().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    enquiryId: newEnquiry.id,
    channel: 'EMAIL',
    direction: 'OUTBOUND',
    template: 'acknowledgement',
    recipient: newEnquiry.email,
    body: `Dear ${newEnquiry.name}, thank you for contacting Company A Tours. We have received your enquiry (${reference}) and assigned it to our tour planning desk. Our senior specialist will respond within 60 minutes with an itinerary and transparent seasonal quote.`,
    createdAt: now,
  });

  // Log activity
  await collections.activityLogs().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    actorId: null,
    action: 'ENQUIRY_RECEIVED',
    entityType: 'ENQUIRY',
    entityId: newEnquiry.id,
    meta: JSON.stringify({
      reference,
      name: newEnquiry.name,
      source: data.source,
      packageId: data.packageId,
    }),
    createdAt: now,
  });

  // Asynchronous AI Extraction and Suggestion processing
  runBackgroundAiProcessing(newEnquiry.id, newEnquiry.message).catch(console.error);

  return res.status(201).json({
    success: true,
    reference,
    message: 'Your enquiry has been received. Our team will contact you within the hour.',
  });
});

// --------------------------------------------------------------------------
// 3b. PUBLIC QUOTATION DETAILS (Branded Web View & Downloadable Quote)
// --------------------------------------------------------------------------

apiRouter.get('/public/quotes/:reference', async (req: Request, res: Response) => {
  try {
    const ref = (req.params.reference || '').trim().toUpperCase();
    const rawEnquiry = await collections.enquiries().findOne({ reference: ref });
    if (!rawEnquiry) {
      return res.status(404).json({ error: `Quotation with reference "${ref}" was not found.` });
    }
    const enquiry = normalizeDoc(rawEnquiry);

    // Fetch assigned consultant
    let consultant = null;
    if (enquiry.assignedToId) {
      const rawUser = await collections.users().findOne(idMatch(enquiry.assignedToId));
      if (rawUser) {
        consultant = {
          name: rawUser.name,
          email: rawUser.email,
          role: rawUser.role,
        };
      }
    }

    // Fetch draft / proposal
    const rawDraft = await collections.replyDrafts().findOne({ enquiryId: enquiry.id });
    const draft = rawDraft ? normalizeDoc(rawDraft) : null;

    let priceBreakdown = [];
    if (draft?.priceBreakdown) {
      try {
        priceBreakdown = JSON.parse(draft.priceBreakdown);
      } catch {}
    }

    // Fetch primary suggested package or linked package
    let primaryPackage = null;
    let targetPkgId = enquiry.packageId;
    if (!targetPkgId) {
      const topSug = await collections.packageSuggestions().findOne({ enquiryId: enquiry.id, rank: 1 });
      if (topSug) {
        targetPkgId = topSug.packageId;
      }
    }

    if (targetPkgId) {
      const rawPkg = await collections.packages().findOne(idMatch(targetPkgId));
      if (rawPkg) {
        let snapshot = null;
        if (rawPkg.currentVersionId) {
          const rawVersion = await collections.packageVersions().findOne(idMatch(rawPkg.currentVersionId));
          if (rawVersion?.snapshot) {
            snapshot = JSON.parse(rawVersion.snapshot);
          }
        }
        primaryPackage = {
          id: rawPkg.id,
          code: rawPkg.code,
          slug: rawPkg.slug,
          snapshot,
        };
      }
    }

    return res.json({
      quote: {
        reference: enquiry.reference,
        status: enquiry.status,
        customerName: enquiry.name,
        travelMonth: enquiry.travelMonth,
        travelDate: enquiry.travelDate,
        adults: enquiry.adults,
        children: enquiry.children,
        message: enquiry.message,
        createdAt: enquiry.createdAt,
        consultant,
        draftBody: draft?.body || null,
        priceBreakdown,
        package: primaryPackage,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve quotation', details: err.message });
  }
});

// Background helper for extraction + suggestions + draft reply
async function runBackgroundAiProcessing(enquiryId: string, messageText: string) {
  try {
    const rawEnq = await collections.enquiries().findOne(idMatch(enquiryId));
    if (!rawEnq) return;
    const enq = normalizeDoc(rawEnq);

    // 1. AI Extraction
    const extractionResult = await extractEnquiryDetails(messageText);

    // Save Extraction
    await collections.enquiryExtractions().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      enquiryId,
      fields: JSON.stringify(extractionResult.fields),
      correctedFields: null,
      model: extractionResult.model,
      rawResponse: extractionResult.rawResponse || null,
      status: 'PENDING',
      createdAt: new Date(),
    });

    // 2. Fetch all published packages for deterministic scoring
    const rawAllPublished = await collections.packages().find({ status: 'PUBLISHED' }).toArray();
    const publishedPackages = normalizeDocs(rawAllPublished);

    const packageCandidates = (
      await Promise.all(
        publishedPackages.map(async (p) => {
          const rawV = await collections.packageVersions()
            .find({ packageId: p.id })
            .sort({ versionNumber: -1 })
            .limit(1)
            .next();

          if (!rawV) return null;
          const dest = await collections.destinations().findOne(idMatch(p.destinationId));
          const normDest = normalizeDoc(dest);

          try {
            return {
              id: p.id,
              code: p.code,
              status: p.status,
              destinationName: normDest?.name,
              destinationSlug: normDest?.slug,
              snapshot: JSON.parse(rawV.snapshot) as PackageSnapshot,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean) as any[];

    // 3. Deterministic Ranking
    const rankedSuggestions = scoreAndRankPackages(packageCandidates, extractionResult.fields);
    const top3 = rankedSuggestions.slice(0, 3);

    // Save suggestions
    for (const sug of top3) {
      await collections.packageSuggestions().insertOne({
        _id: new ObjectId(),
        id: new ObjectId().toHexString(),
        enquiryId,
        packageId: sug.packageId,
        rank: sug.rank,
        score: sug.score,
        reasons: JSON.stringify(sug.reasons),
        createdAt: new Date(),
      });
    }

    // 4. Draft Reply
    const suggestedPkgObjects = top3
      .map((sug) => {
        const found = packageCandidates.find((c) => c.id === sug.packageId);
        if (!found) return null;
        return {
          code: found.code,
          title: found.snapshot.title,
          snapshot: found.snapshot,
        };
      })
      .filter(Boolean) as any[];

    if (suggestedPkgObjects.length > 0) {
      const draftResult = await draftReplyEmail({
        customerName: enq.name,
        enquiryMessage: messageText,
        extractedFields: extractionResult.fields,
        suggestedPackages: suggestedPkgObjects,
      });

      await collections.replyDrafts().insertOne({
        _id: new ObjectId(),
        id: new ObjectId().toHexString(),
        enquiryId,
        body: draftResult.draftBody,
        priceBreakdown: JSON.stringify(draftResult.breakdowns),
        status: 'DRAFT',
        acceptedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Log Activity
    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: null,
      action: 'AI_EXTRACTION_COMPLETED',
      entityType: 'ENQUIRY',
      entityId: enquiryId,
      meta: JSON.stringify({
        model: extractionResult.model,
        fallbackUsed: extractionResult.fallbackUsed,
        suggestionsCount: top3.length,
      }),
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[AI] Background processing error:', err);
  }
}

// --------------------------------------------------------------------------
// 4. ADMIN PACKAGES CMS (ADMIN or EDITOR)
// --------------------------------------------------------------------------

apiRouter.get(
  '/admin/packages',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawPackages = await collections.packages().find().sort({ updatedAt: -1 }).toArray();
    const packagesList = normalizeDocs(rawPackages);

    const formatted = await Promise.all(
      packagesList.map(async (pkg) => {
        const rawLatestVer = await collections.packageVersions()
          .find({ packageId: pkg.id })
          .sort({ versionNumber: -1 })
          .limit(1)
          .next();

        const versionCount = await collections.packageVersions().countDocuments({ packageId: pkg.id });
        const enquiryCount = await collections.enquiries().countDocuments({ packageId: pkg.id });
        const dest = await collections.destinations().findOne(idMatch(pkg.destinationId));

        let createdByName = 'Staff';
        if (rawLatestVer?.createdById) {
          const user = await collections.users().findOne(idMatch(rawLatestVer.createdById));
          if (user?.name) createdByName = user.name;
        }

        let title = pkg.code;
        let days = 0;
        let nights = 0;
        let priceRange = '₹--';

        if (rawLatestVer) {
          try {
            const snapshot: PackageSnapshot = JSON.parse(rawLatestVer.snapshot);
            title = snapshot.title;
            days = snapshot.days;
            nights = snapshot.nights;
            const prices = snapshot.seasonalPrices?.map((sp) => sp.pricePerPerson) || [];
            if (prices.length > 0) {
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              priceRange =
                min === max
                  ? `₹${min.toLocaleString('en-IN')}`
                  : `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
            }
          } catch {}
        }

        return {
          id: pkg.id,
          code: pkg.code,
          slug: pkg.slug,
          title,
          days,
          nights,
          priceRange,
          destination: normalizeDoc(dest),
          status: pkg.status,
          publishAt: pkg.publishAt,
          versionCount,
          enquiryCount,
          lastEditedBy: createdByName,
          lastEditedAt: rawLatestVer?.createdAt || pkg.updatedAt,
        };
      })
    );

    return res.json({ packages: formatted });
  }
);

apiRouter.get(
  '/admin/packages/:id',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const pkg = normalizeDoc(rawPkg);

    const dest = await collections.destinations().findOne(idMatch(pkg.destinationId));
    const rawVersions = await collections.packageVersions()
      .find({ packageId: pkg.id })
      .sort({ versionNumber: -1 })
      .toArray();

    const versions = await Promise.all(
      rawVersions.map(async (v) => {
        let createdBy = null;
        if (v.createdById) {
          const u = await collections.users().findOne(idMatch(v.createdById));
          if (u) {
            createdBy = { id: u.id, name: u.name, email: u.email };
          }
        }
        return {
          id: v.id,
          versionNumber: v.versionNumber,
          changeNote: v.changeNote,
          createdAt: v.createdAt,
          createdBy,
          snapshot: JSON.parse(v.snapshot) as PackageSnapshot,
        };
      })
    );

    return res.json({
      package: {
        id: pkg.id,
        code: pkg.code,
        slug: pkg.slug,
        destinationId: pkg.destinationId,
        destination: normalizeDoc(dest),
        status: pkg.status,
        publishAt: pkg.publishAt,
        currentVersionId: pkg.currentVersionId,
        versions,
        latestSnapshot: versions[0]?.snapshot,
      },
    });
  }
);

// Create new package + version 1
apiRouter.post(
  '/admin/packages',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      code: z.string().min(3),
      slug: z.string().min(3),
      destinationId: z.string(),
      status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
      publishAt: z.string().optional().nullable(),
      changeNote: z.string().default('Initial package creation'),
      snapshot: z.custom<PackageSnapshot>(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid package payload', details: parsed.error.format() });
    }

    const { code, slug, destinationId, status, publishAt, changeNote, snapshot } = parsed.data;

    // Validate seasonal prices do not overlap
    const overlapCheck = validateSeasonalOverlap(snapshot.seasonalPrices || []);
    if (!overlapCheck.valid) {
      return res.status(400).json({ error: overlapCheck.error });
    }

    const existingCode = await collections.packages().findOne({ code });
    if (existingCode) {
      return res.status(400).json({ error: `Package code "${code}" already exists.` });
    }

    const existingSlug = await collections.packages().findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({ error: `Package URL slug "${slug}" already exists.` });
    }

    const pkgId = new ObjectId().toHexString();
    const verId = new ObjectId().toHexString();
    const now = new Date();

    const newPkg = {
      _id: new ObjectId(pkgId),
      id: pkgId,
      code,
      slug,
      destinationId,
      status,
      publishAt: publishAt ? new Date(publishAt) : null,
      currentVersionId: verId,
      createdAt: now,
      updatedAt: now,
    };
    await collections.packages().insertOne(newPkg);

    const version = {
      _id: new ObjectId(verId),
      id: verId,
      packageId: pkgId,
      versionNumber: 1,
      snapshot: JSON.stringify(snapshot),
      changeNote,
      createdById: req.user!.userId,
      createdAt: now,
    };
    await collections.packageVersions().insertOne(version);

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'PACKAGE_CREATED',
      entityType: 'PACKAGE',
      entityId: pkgId,
      meta: JSON.stringify({ code, version: 1, title: snapshot.title }),
      createdAt: now,
    });

    return res.status(201).json({ success: true, packageId: pkgId, versionId: verId });
  }
);

// Save new version (Optimistic concurrency protected)
apiRouter.put(
  '/admin/packages/:id',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      baseVersionNumber: z.number().int(),
      destinationId: z.string().optional(),
      status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
      publishAt: z.string().optional().nullable(),
      changeNote: z.string().min(2, 'Please provide a brief change note for version history'),
      snapshot: z.custom<PackageSnapshot>(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.format() });
    }

    const { baseVersionNumber, destinationId, status, publishAt, changeNote, snapshot } = parsed.data;

    // Validate seasonal prices
    const overlapCheck = validateSeasonalOverlap(snapshot.seasonalPrices || []);
    if (!overlapCheck.valid) {
      return res.status(400).json({ error: overlapCheck.error });
    }

    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const pkg = normalizeDoc(rawPkg);

    const latestVersion = await collections.packageVersions()
      .find({ packageId: pkg.id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .next();

    const latestNum = latestVersion ? latestVersion.versionNumber : 0;

    // Optimistic Concurrency Check:
    if (baseVersionNumber < latestNum) {
      return res.status(409).json({
        error: `Conflict detected: Another staff member saved Version ${latestNum} while you were editing. Please review recent changes or copy your edits before refreshing.`,
        latestVersionNumber: latestNum,
      });
    }

    const nextVersionNumber = latestNum + 1;
    const newVerId = new ObjectId().toHexString();
    const now = new Date();

    const newVersion = {
      _id: new ObjectId(newVerId),
      id: newVerId,
      packageId: pkg.id,
      versionNumber: nextVersionNumber,
      snapshot: JSON.stringify(snapshot),
      changeNote,
      createdById: req.user!.userId,
      createdAt: now,
    };
    await collections.packageVersions().insertOne(newVersion);

    const updateFields: any = {
      currentVersionId: newVerId,
      updatedAt: now,
    };
    if (destinationId) updateFields.destinationId = destinationId;
    if (status) updateFields.status = status;
    if (publishAt !== undefined) updateFields.publishAt = publishAt ? new Date(publishAt) : null;

    await collections.packages().updateOne(idMatch(pkg.id), { $set: updateFields });

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'PACKAGE_VERSION_SAVED',
      entityType: 'PACKAGE',
      entityId: pkg.id,
      meta: JSON.stringify({
        code: pkg.code,
        versionNumber: nextVersionNumber,
        changeNote,
        status: status || pkg.status,
      }),
      createdAt: now,
    });

    return res.json({
      success: true,
      versionNumber: nextVersionNumber,
      versionId: newVerId,
    });
  }
);

// Restore Version: creates a new immutable version copied from an old version
apiRouter.post(
  '/admin/packages/:id/restore-version',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { versionNumber } = req.body;
    if (!versionNumber || typeof versionNumber !== 'number') {
      return res.status(400).json({ error: 'Valid versionNumber is required' });
    }

    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const pkg = normalizeDoc(rawPkg);

    const targetVer = await collections.packageVersions().findOne({
      packageId: pkg.id,
      versionNumber,
    });

    if (!targetVer) {
      return res.status(404).json({ error: `Version ${versionNumber} not found` });
    }

    const latest = await collections.packageVersions()
      .find({ packageId: pkg.id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .next();

    const nextNum = (latest?.versionNumber || 0) + 1;
    const restoredId = new ObjectId().toHexString();
    const now = new Date();

    const restoredVersion = {
      _id: new ObjectId(restoredId),
      id: restoredId,
      packageId: pkg.id,
      versionNumber: nextNum,
      snapshot: targetVer.snapshot,
      changeNote: `Restored from Version ${versionNumber}`,
      createdById: req.user!.userId,
      createdAt: now,
    };
    await collections.packageVersions().insertOne(restoredVersion);

    await collections.packages().updateOne(idMatch(pkg.id), {
      $set: {
        currentVersionId: restoredId,
        updatedAt: now,
      },
    });

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'PACKAGE_VERSION_RESTORED',
      entityType: 'PACKAGE',
      entityId: pkg.id,
      meta: JSON.stringify({ restoredFrom: versionNumber, newVersion: nextNum }),
      createdAt: now,
    });

    return res.json({ success: true, newVersionNumber: nextNum });
  }
);

// Publish action
apiRouter.post(
  '/admin/packages/:id/publish',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) return res.status(404).json({ error: 'Package not found' });
    const pkg = normalizeDoc(rawPkg);

    await collections.packages().updateOne(idMatch(pkg.id), {
      $set: {
        status: 'PUBLISHED',
        publishAt: null,
        updatedAt: new Date(),
      },
    });

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'PACKAGE_PUBLISHED',
      entityType: 'PACKAGE',
      entityId: pkg.id,
      meta: JSON.stringify({ code: pkg.code }),
      createdAt: new Date(),
    });

    return res.json({ success: true, status: 'PUBLISHED' });
  }
);

// Archive action
apiRouter.post(
  '/admin/packages/:id/archive',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) return res.status(404).json({ error: 'Package not found' });
    const pkg = normalizeDoc(rawPkg);

    await collections.packages().updateOne(idMatch(pkg.id), {
      $set: {
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
    });

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'PACKAGE_ARCHIVED',
      entityType: 'PACKAGE',
      entityId: pkg.id,
      meta: JSON.stringify({ code: pkg.code }),
      createdAt: new Date(),
    });

    return res.json({ success: true, status: 'ARCHIVED' });
  }
);

// Duplicate package into a draft
apiRouter.post(
  '/admin/packages/:id/duplicate',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) return res.status(404).json({ error: 'Original package not found' });
    const original = normalizeDoc(rawPkg);

    const latestVer = await collections.packageVersions()
      .find({ packageId: original.id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .next();

    if (!latestVer) {
      return res.status(404).json({ error: 'Original package version not found' });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newCode = `${original.code}-COPY-${randomSuffix}`;
    const newSlug = `${original.slug}-copy-${randomSuffix}`;
    const newPkgId = new ObjectId().toHexString();
    const newVerId = new ObjectId().toHexString();
    const now = new Date();

    const originalSnapshot: PackageSnapshot = JSON.parse(latestVer.snapshot);
    originalSnapshot.title = `${originalSnapshot.title} (Copy)`;

    const newPkg = {
      _id: new ObjectId(newPkgId),
      id: newPkgId,
      code: newCode,
      slug: newSlug,
      destinationId: original.destinationId,
      status: 'DRAFT' as const,
      publishAt: null,
      currentVersionId: newVerId,
      createdAt: now,
      updatedAt: now,
    };
    await collections.packages().insertOne(newPkg);

    const newVer = {
      _id: new ObjectId(newVerId),
      id: newVerId,
      packageId: newPkgId,
      versionNumber: 1,
      snapshot: JSON.stringify(originalSnapshot),
      changeNote: `Duplicated from ${original.code}`,
      createdById: req.user!.userId,
      createdAt: now,
    };
    await collections.packageVersions().insertOne(newVer);

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'PACKAGE_DUPLICATED',
      entityType: 'PACKAGE',
      entityId: newPkgId,
      meta: JSON.stringify({ from: original.code, to: newCode }),
      createdAt: now,
    });

    return res.json({ success: true, newPackageId: newPkgId });
  }
);

// Generate signed preview token
apiRouter.get(
  '/admin/packages/:id/preview-token',
  requireRole(['ADMIN', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawPkg = await collections.packages().findOne(idMatch(req.params.id));
    if (!rawPkg) return res.status(404).json({ error: 'Package not found' });
    const pkg = normalizeDoc(rawPkg);

    const latestVer = await collections.packageVersions()
      .find({ packageId: pkg.id })
      .sort({ versionNumber: -1 })
      .limit(1)
      .next();

    if (!latestVer) {
      return res.status(404).json({ error: 'Package version not found' });
    }

    const token = signPreviewToken(pkg.id, latestVer.id);
    return res.json({ token, previewPath: `/packages/preview/${pkg.id}?token=${encodeURIComponent(token)}` });
  }
);

// --------------------------------------------------------------------------
// 5. ADMIN ENQUIRY INBOX (ADMIN or CONSULTANT)
// --------------------------------------------------------------------------

apiRouter.get(
  '/admin/enquiries',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { status, source, assignee, overdue } = req.query;

    const filter: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      filter.status = status;
    }
    if (source && typeof source === 'string' && source !== 'ALL') {
      filter.source = source;
    }
    if (assignee && typeof assignee === 'string' && assignee !== 'ALL') {
      if (assignee === 'UNASSIGNED') {
        filter.assignedToId = null;
      } else {
        filter.assignedToId = assignee;
      }
    }

    const rawEnquiries = await collections.enquiries().find(filter).sort({ createdAt: -1 }).toArray();
    const enquiriesList = normalizeDocs(rawEnquiries);

    const now = new Date();
    const formatted = await Promise.all(
      enquiriesList.map(async (enq) => {
        const sla = evaluateEnquirySLA(enq.createdAt, enq.firstResponseAt, now);

        let pkg = null;
        if (enq.packageId) {
          const rawP = await collections.packages().findOne(idMatch(enq.packageId));
          if (rawP) pkg = { id: rawP.id, code: rawP.code, slug: rawP.slug };
        }

        let assignedTo = null;
        if (enq.assignedToId) {
          const rawU = await collections.users().findOne(idMatch(enq.assignedToId));
          if (rawU) assignedTo = { id: rawU.id, name: rawU.name, email: rawU.email };
        }

        const rawExtraction = await collections.enquiryExtractions().findOne({ enquiryId: enq.id });
        let parsedFields: ExtractionFields | null = null;
        if (rawExtraction) {
          try {
            parsedFields = JSON.parse(rawExtraction.correctedFields || rawExtraction.fields);
          } catch {}
        }

        return {
          id: enq.id,
          reference: enq.reference,
          source: enq.source,
          name: enq.name,
          email: enq.email,
          phone: enq.phone,
          travelMonth: enq.travelMonth,
          adults: enq.adults,
          children: enq.children,
          message: enq.message,
          consentDataProcessing: enq.consentDataProcessing,
          consentWhatsApp: enq.consentWhatsApp,
          status: enq.status,
          assignedTo,
          firstResponseAt: enq.firstResponseAt,
          createdAt: enq.createdAt,
          package: pkg,
          sla,
          extractionPreview: parsedFields
            ? {
                destination: parsedFields.destination,
                nights: parsedFields.nights,
                budgetTotalINR: parsedFields.budgetTotalINR,
                mustHaves: parsedFields.mustHaves,
              }
            : null,
        };
      })
    );

    // Overdue filter post-evaluation
    const filtered = overdue === 'true' ? formatted.filter((e) => e.sla.isOverdue && !e.firstResponseAt) : formatted;

    return res.json({ enquiries: filtered });
  }
);

apiRouter.get(
  '/admin/enquiries/:id',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawEnq = await collections.enquiries().findOne(idMatch(req.params.id));
    if (!rawEnq) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const enq = normalizeDoc(rawEnq);

    let pkg = null;
    if (enq.packageId) {
      const rawP = await collections.packages().findOne(idMatch(enq.packageId));
      if (rawP) {
        const normP = normalizeDoc(rawP);
        const rawV = await collections.packageVersions()
          .find({ packageId: normP.id })
          .sort({ versionNumber: -1 })
          .limit(1)
          .next();
        pkg = {
          id: normP.id,
          code: normP.code,
          slug: normP.slug,
          versions: rawV ? [normalizeDoc(rawV)] : [],
        };
      }
    }

    let assignedTo = null;
    if (enq.assignedToId) {
      const u = await collections.users().findOne(idMatch(enq.assignedToId));
      if (u) assignedTo = { id: u.id, name: u.name, email: u.email };
    }

    const sla = evaluateEnquirySLA(enq.createdAt, enq.firstResponseAt);

    // Extraction
    const rawExt = await collections.enquiryExtractions().findOne({ enquiryId: enq.id });
    let extractionData: any = null;
    if (rawExt) {
      try {
        extractionData = {
          id: rawExt.id,
          model: rawExt.model,
          status: rawExt.status,
          fields: JSON.parse(rawExt.fields) as ExtractionFields,
          correctedFields: rawExt.correctedFields
            ? (JSON.parse(rawExt.correctedFields) as ExtractionFields)
            : null,
        };
      } catch {}
    }

    // Suggestions with package snapshots
    const rawSuggestions = await collections.packageSuggestions()
      .find({ enquiryId: enq.id })
      .sort({ rank: 1 })
      .toArray();

    const suggestions = await Promise.all(
      rawSuggestions.map(async (sug) => {
        let reasons: string[] = [];
        let snapshot: PackageSnapshot | null = null;
        let pCode = '';
        let pSlug = '';

        try {
          reasons = JSON.parse(sug.reasons);
        } catch {}

        const rawP = await collections.packages().findOne(idMatch(sug.packageId));
        if (rawP) {
          pCode = rawP.code;
          pSlug = rawP.slug;
          const rawV = await collections.packageVersions()
            .find({ packageId: rawP.id })
            .sort({ versionNumber: -1 })
            .limit(1)
            .next();
          if (rawV) {
            try {
              snapshot = JSON.parse(rawV.snapshot);
            } catch {}
          }
        }

        return {
          id: sug.id,
          packageId: sug.packageId,
          packageCode: pCode,
          packageSlug: pSlug,
          rank: sug.rank,
          score: sug.score,
          reasons,
          snapshot,
        };
      })
    );

    // Latest Draft
    const rawDraft = await collections.replyDrafts()
      .find({ enquiryId: enq.id })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();

    let draft = null;
    if (rawDraft) {
      let breakdown = null;
      try {
        breakdown = JSON.parse(rawDraft.priceBreakdown);
      } catch {}
      draft = {
        id: rawDraft.id,
        body: rawDraft.body,
        priceBreakdown: breakdown,
        status: rawDraft.status,
        createdAt: rawDraft.createdAt,
      };
    }

    // Notes with authors
    const rawNotes = await collections.enquiryNotes()
      .find({ enquiryId: enq.id })
      .sort({ createdAt: -1 })
      .toArray();

    const notes = await Promise.all(
      rawNotes.map(async (n) => {
        const u = await collections.users().findOne(idMatch(n.authorId));
        return {
          id: n.id,
          authorId: n.authorId,
          body: n.body,
          createdAt: n.createdAt,
          author: u ? { name: u.name, role: u.role } : { name: 'Staff', role: 'CONSULTANT' },
        };
      })
    );

    // Messages
    const rawMessages = await collections.messageLogs()
      .find({ enquiryId: enq.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      enquiry: {
        id: enq.id,
        reference: enq.reference,
        source: enq.source,
        name: enq.name,
        email: enq.email,
        phone: enq.phone,
        travelMonth: enq.travelMonth,
        travelDate: enq.travelDate,
        adults: enq.adults,
        children: enq.children,
        message: enq.message,
        consentDataProcessing: enq.consentDataProcessing,
        consentWhatsApp: enq.consentWhatsApp,
        status: enq.status,
        assignedTo,
        firstResponseAt: enq.firstResponseAt,
        createdAt: enq.createdAt,
        sla,
        package: pkg,
        extraction: extractionData,
        suggestions,
        draft,
        notes,
        messages: normalizeDocs(rawMessages),
      },
    });
  }
);

// Manual Enquiry Creation by Staff (Phone / Walk-in / WhatsApp / Chat)
apiRouter.post(
  '/admin/enquiries',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      source: z.enum(['WEB_FORM', 'CHAT', 'WHATSAPP', 'EMAIL', 'PHONE']),
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(8),
      travelMonth: z.string().optional().nullable(),
      travelDate: z.string().optional().nullable(),
      adults: z.number().int().min(1).default(2),
      children: z.number().int().min(0).default(0),
      message: z.string().min(3),
      consentWhatsApp: z.boolean().default(false),
      packageId: z.string().optional().nullable(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid enquiry payload', details: parsed.error.format() });
    }

    const count = await collections.enquiries().countDocuments();
    const reference = `ENQ-${String(count + 1).padStart(4, '0')}`;
    const enquiryId = new ObjectId().toHexString();
    const now = new Date();

    const enquiry = {
      _id: new ObjectId(enquiryId),
      id: enquiryId,
      reference,
      source: parsed.data.source,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      travelMonth: parsed.data.travelMonth || null,
      travelDate: parsed.data.travelDate || null,
      adults: parsed.data.adults,
      children: parsed.data.children,
      message: parsed.data.message,
      consentDataProcessing: true,
      consentWhatsApp: parsed.data.consentWhatsApp,
      packageId: parsed.data.packageId || null,
      assignedToId: req.user!.userId, // automatically assign to creator
      firstResponseAt: null,
      status: 'ASSIGNED' as const,
      createdAt: now,
      updatedAt: now,
    };
    await collections.enquiries().insertOne(enquiry);

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'ENQUIRY_LOGGED_MANUALLY',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      meta: JSON.stringify({ reference, source: parsed.data.source }),
      createdAt: now,
    });

    runBackgroundAiProcessing(enquiry.id, enquiry.message).catch(console.error);

    return res.status(201).json({ success: true, enquiryId: enquiry.id, reference });
  }
);

// Assign enquiry to consultant
apiRouter.put(
  '/admin/enquiries/:id/assign',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { assignedToId } = req.body;

    const rawEnq = await collections.enquiries().findOne(idMatch(req.params.id));
    if (!rawEnq) return res.status(404).json({ error: 'Enquiry not found' });
    const enq = normalizeDoc(rawEnq);

    const updateFields = {
      assignedToId: assignedToId || null,
      status: (assignedToId ? 'ASSIGNED' : 'NEW') as any,
      updatedAt: new Date(),
    };
    await collections.enquiries().updateOne(idMatch(enq.id), { $set: updateFields });

    let assigneeName = 'Unassigned';
    if (assignedToId) {
      const u = await collections.users().findOne(idMatch(assignedToId));
      if (u) assigneeName = u.name;
    }

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'ENQUIRY_ASSIGNED',
      entityType: 'ENQUIRY',
      entityId: enq.id,
      meta: JSON.stringify({ assignedTo: assigneeName }),
      createdAt: new Date(),
    });

    return res.json({ success: true, enquiry: { ...enq, ...updateFields } });
  }
);

// Update enquiry status
apiRouter.put(
  '/admin/enquiries/:id/status',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body;
    const valid = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'QUOTED', 'WON', 'LOST'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const rawEnq = await collections.enquiries().findOne(idMatch(req.params.id));
    if (!rawEnq) return res.status(404).json({ error: 'Enquiry not found' });
    const enq = normalizeDoc(rawEnq);

    await collections.enquiries().updateOne(idMatch(enq.id), {
      $set: { status, updatedAt: new Date() },
    });

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'ENQUIRY_STATUS_CHANGED',
      entityType: 'ENQUIRY',
      entityId: enq.id,
      meta: JSON.stringify({ newStatus: status }),
      createdAt: new Date(),
    });

    return res.json({ success: true, status });
  }
);

// Confirm / Correct extracted fields
apiRouter.put(
  '/admin/enquiries/:id/extraction',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { correctedFields } = req.body;

    const rawExt = await collections.enquiryExtractions().findOne({ enquiryId: req.params.id });
    if (!rawExt) {
      return res.status(404).json({ error: 'Extraction record not found' });
    }

    await collections.enquiryExtractions().updateOne(
      { enquiryId: req.params.id },
      {
        $set: {
          correctedFields: JSON.stringify(correctedFields),
          status: 'REVIEWED',
        },
      }
    );

    // Re-score suggestions based on corrected fields
    const rawAllPublished = await collections.packages().find({ status: 'PUBLISHED' }).toArray();
    const published = normalizeDocs(rawAllPublished);

    const candidates = (
      await Promise.all(
        published.map(async (p) => {
          const rawV = await collections.packageVersions()
            .find({ packageId: p.id })
            .sort({ versionNumber: -1 })
            .limit(1)
            .next();

          if (!rawV) return null;
          const dest = await collections.destinations().findOne(idMatch(p.destinationId));
          const normDest = normalizeDoc(dest);

          try {
            return {
              id: p.id,
              code: p.code,
              status: p.status,
              destinationName: normDest?.name,
              destinationSlug: normDest?.slug,
              snapshot: JSON.parse(rawV.snapshot) as PackageSnapshot,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean) as any[];

    const newRanks = scoreAndRankPackages(candidates, correctedFields).slice(0, 3);

    await collections.packageSuggestions().deleteMany({ enquiryId: req.params.id });
    for (const sug of newRanks) {
      await collections.packageSuggestions().insertOne({
        _id: new ObjectId(),
        id: new ObjectId().toHexString(),
        enquiryId: req.params.id,
        packageId: sug.packageId,
        rank: sug.rank,
        score: sug.score,
        reasons: JSON.stringify(sug.reasons),
        createdAt: new Date(),
      });
    }

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'ENQUIRY_FIELDS_CONFIRMED',
      entityType: 'ENQUIRY',
      entityId: req.params.id,
      createdAt: new Date(),
    });

    return res.json({ success: true });
  }
);

// Add internal note
apiRouter.post(
  '/admin/enquiries/:id/notes',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { body } = req.body;
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const noteId = new ObjectId().toHexString();
    const now = new Date();

    const note = {
      _id: new ObjectId(noteId),
      id: noteId,
      enquiryId: req.params.id,
      authorId: req.user!.userId,
      body: body.trim(),
      createdAt: now,
    };
    await collections.enquiryNotes().insertOne(note);

    const user = await collections.users().findOne(idMatch(req.user!.userId));

    return res.status(201).json({
      success: true,
      note: {
        ...note,
        author: { name: user?.name || 'Staff', role: user?.role || 'CONSULTANT' },
      },
    });
  }
);

// Generate new reply draft
apiRouter.post(
  '/admin/enquiries/:id/generate-draft',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawEnq = await collections.enquiries().findOne(idMatch(req.params.id));
    if (!rawEnq) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const enq = normalizeDoc(rawEnq);

    const rawExt = await collections.enquiryExtractions().findOne({ enquiryId: enq.id });
    let fields: ExtractionFields = {
      adults: enq.adults,
      children: enq.children,
      startMonth: enq.travelMonth || undefined,
      confidence: {},
    };

    if (rawExt) {
      try {
        fields = JSON.parse(rawExt.correctedFields || rawExt.fields);
      } catch {}
    }

    const rawSuggestions = await collections.packageSuggestions()
      .find({ enquiryId: enq.id })
      .sort({ rank: 1 })
      .limit(2)
      .toArray();

    const suggestedPkgObjects = (
      await Promise.all(
        rawSuggestions.map(async (sug) => {
          const rawP = await collections.packages().findOne(idMatch(sug.packageId));
          if (!rawP) return null;
          const rawV = await collections.packageVersions()
            .find({ packageId: rawP.id })
            .sort({ versionNumber: -1 })
            .limit(1)
            .next();
          if (!rawV) return null;

          try {
            const snap = JSON.parse(rawV.snapshot) as PackageSnapshot;
            return {
              code: rawP.code,
              title: snap.title,
              snapshot: snap,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean) as any[];

    const draftResult = await draftReplyEmail({
      customerName: enq.name,
      enquiryMessage: enq.message,
      extractedFields: fields,
      suggestedPackages: suggestedPkgObjects,
    });

    // Delete existing drafts
    await collections.replyDrafts().deleteMany({ enquiryId: enq.id });

    const newDraftId = new ObjectId().toHexString();
    const now = new Date();

    const newDraft = {
      _id: new ObjectId(newDraftId),
      id: newDraftId,
      enquiryId: enq.id,
      body: draftResult.draftBody,
      priceBreakdown: JSON.stringify(draftResult.breakdowns),
      status: 'DRAFT' as const,
      acceptedById: null,
      createdAt: now,
      updatedAt: now,
    };
    await collections.replyDrafts().insertOne(newDraft);

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'DRAFT_GENERATED',
      entityType: 'ENQUIRY',
      entityId: enq.id,
      meta: JSON.stringify({ model: draftResult.model }),
      createdAt: now,
    });

    return res.json({
      success: true,
      draft: {
        id: newDraft.id,
        body: newDraft.body,
        priceBreakdown: draftResult.breakdowns,
        status: newDraft.status,
      },
    });
  }
);

// Accept & Send Reply (Explicit Human acceptance required)
apiRouter.post(
  '/admin/enquiries/:id/send-reply',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { body, channel = 'EMAIL' } = req.body;
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'Reply text cannot be empty' });
    }

    const rawEnq = await collections.enquiries().findOne(idMatch(req.params.id));
    if (!rawEnq) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const enq = normalizeDoc(rawEnq);

    // WhatsApp Consent Enforcement:
    if (channel === 'WHATSAPP' && !enq.consentWhatsApp) {
      return res.status(400).json({
        error: 'WhatsApp dispatch prohibited: customer did not opt in to WhatsApp follow-ups under privacy consent. Please send via Email instead.',
      });
    }

    const now = new Date();
    const msgId = new ObjectId().toHexString();

    const messageLog = {
      _id: new ObjectId(msgId),
      id: msgId,
      enquiryId: enq.id,
      channel: channel as any,
      direction: 'OUTBOUND' as const,
      template: 'quote_proposal',
      recipient: channel === 'WHATSAPP' ? enq.phone : enq.email,
      body: body.trim(),
      createdAt: now,
    };
    await collections.messageLogs().insertOne(messageLog);

    // Mark enquiry firstResponseAt if this is the first response
    const updateData: any = {
      status: 'QUOTED',
      updatedAt: now,
    };
    if (!enq.firstResponseAt) {
      updateData.firstResponseAt = now;
    }

    await collections.enquiries().updateOne(idMatch(enq.id), { $set: updateData });

    // Update draft status
    await collections.replyDrafts().updateMany(
      { enquiryId: enq.id },
      {
        $set: {
          status: 'SENT',
          acceptedById: req.user!.userId,
          updatedAt: now,
        },
      }
    );

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'REPLY_SENT',
      entityType: 'ENQUIRY',
      entityId: enq.id,
      meta: JSON.stringify({ channel, recipient: messageLog.recipient, firstResponse: !enq.firstResponseAt }),
      createdAt: now,
    });

    return res.json({
      success: true,
      messageLog,
      firstResponseAt: enq.firstResponseAt || now,
    });
  }
);

// DPDP Act 2023: Anonymize / Delete enquiry (PII wipe)
apiRouter.post(
  '/admin/enquiries/:id/anonymize',
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawEnq = await collections.enquiries().findOne(idMatch(req.params.id));
    if (!rawEnq) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    const enq = normalizeDoc(rawEnq);

    await collections.enquiries().updateOne(idMatch(enq.id), {
      $set: {
        name: '[ANONYMIZED_DATA_SUBJECT]',
        email: `erased-${enq.id.slice(0, 8)}@anonymized.local`,
        phone: '+91 00000 00000',
        message: '[Enquiry message wiped per DPDP Act 2023 Right to Erasure request]',
        status: 'LOST',
        updatedAt: new Date(),
      },
    });

    // Clean extraction source snippets that had PII
    await collections.enquiryExtractions().updateOne(
      { enquiryId: enq.id },
      {
        $set: {
          rawResponse: null,
          correctedFields: null,
        },
      }
    );

    await collections.activityLogs().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: req.user!.userId,
      action: 'DPDP_PII_ERASED',
      entityType: 'ENQUIRY',
      entityId: enq.id,
      meta: JSON.stringify({ reference: enq.reference }),
      createdAt: new Date(),
    });

    return res.json({ success: true, message: 'Customer PII wiped in compliance with DPDP Act 2023.' });
  }
);

// --------------------------------------------------------------------------
// 6. ADMIN DASHBOARD METRICS & ACTIVITY LOG
// --------------------------------------------------------------------------

apiRouter.get(
  '/admin/dashboard',
  requireRole(['ADMIN', 'CONSULTANT', 'EDITOR']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawEnquiries = await collections.enquiries().find({}, {
      projection: {
        id: 1,
        status: 1,
        assignedToId: 1,
        createdAt: 1,
        firstResponseAt: 1,
      },
    }).toArray();
    const allEnquiries = normalizeDocs(rawEnquiries);

    const now = new Date();
    let newCount = 0;
    let unassignedCount = 0;
    let overdueCount = 0;
    let totalResponseMinutes = 0;
    let respondedCount = 0;

    for (const enq of allEnquiries) {
      if (enq.status === 'NEW') newCount++;
      if (!enq.assignedToId && enq.status !== 'WON' && enq.status !== 'LOST') unassignedCount++;

      const sla = evaluateEnquirySLA(enq.createdAt, enq.firstResponseAt, now);
      if (sla.isOverdue && !enq.firstResponseAt) {
        overdueCount++;
      }

      if (enq.firstResponseAt) {
        respondedCount++;
        totalResponseMinutes += sla.workingMinutesElapsed;
      }
    }

    const avgResponseTimeMinutes = respondedCount > 0 ? Math.round(totalResponseMinutes / respondedCount) : 42;

    const totalPackages = await collections.packages().countDocuments();
    const publishedPackages = await collections.packages().countDocuments({ status: 'PUBLISHED' });

    // Recent activity
    const rawActivity = await collections.activityLogs()
      .find()
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    const recentActivity = await Promise.all(
      rawActivity.map(async (act) => {
        let actor = null;
        if (act.actorId) {
          const u = await collections.users().findOne(idMatch(act.actorId));
          if (u) actor = { name: u.name, role: u.role };
        }
        return {
          id: act.id,
          actorId: act.actorId,
          action: act.action,
          entityType: act.entityType,
          entityId: act.entityId,
          meta: act.meta,
          createdAt: act.createdAt,
          actor,
        };
      })
    );

    return res.json({
      metrics: {
        newEnquiries: newCount,
        unassignedEnquiries: unassignedCount,
        overdueEnquiries: overdueCount,
        avgResponseMinutes: avgResponseTimeMinutes,
        totalEnquiries: allEnquiries.length,
        totalPackages,
        publishedPackages,
      },
      recentActivity,
    });
  }
);

apiRouter.get(
  '/admin/activity',
  requireRole(['ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { action, entityType } = req.query;

    const filter: any = {};
    if (action && typeof action === 'string') filter.action = action;
    if (entityType && typeof entityType === 'string') filter.entityType = entityType;

    const rawLogs = await collections.activityLogs()
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const logs = await Promise.all(
      rawLogs.map(async (act) => {
        let actor = null;
        if (act.actorId) {
          const u = await collections.users().findOne(idMatch(act.actorId));
          if (u) actor = { id: u.id, name: u.name, email: u.email, role: u.role };
        }
        return {
          id: act.id,
          actorId: act.actorId,
          action: act.action,
          entityType: act.entityType,
          entityId: act.entityId,
          meta: act.meta,
          createdAt: act.createdAt,
          actor,
        };
      })
    );

    return res.json({ logs });
  }
);

// Users list for assignment dropdown
apiRouter.get(
  '/admin/users',
  requireRole(['ADMIN', 'CONSULTANT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const rawUsers = await collections.users().find().sort({ name: 1 }).toArray();
    const users = normalizeDocs(rawUsers).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
    return res.json({ users });
  }
);
