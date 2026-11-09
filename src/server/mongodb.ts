import { MongoClient, ObjectId, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';

let client: MongoClient | null = null;
let db: Db | null = null;
let memoryServerInstance: any = null;

export { ObjectId };

export interface MongoUser {
  _id?: ObjectId;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'EDITOR' | 'CONSULTANT' | 'TRAVELLER';
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoDestination {
  _id?: ObjectId;
  id: string;
  slug: string;
  name: string;
  summary: string;
  heroImage: string;
  createdAt: Date;
}

export interface MongoPackage {
  _id?: ObjectId;
  id: string;
  code: string;
  slug: string;
  destinationId: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  publishAt?: Date | null;
  currentVersionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoPackageVersion {
  _id?: ObjectId;
  id: string;
  packageId: string;
  versionNumber: number;
  snapshot: string; // JSON string of PackageSnapshot
  changeNote?: string | null;
  createdById?: string | null;
  createdAt: Date;
}

export interface MongoEnquiry {
  _id?: ObjectId;
  id: string;
  reference: string;
  source: 'WEB_FORM' | 'CHAT' | 'WHATSAPP' | 'EMAIL' | 'PHONE';
  packageId?: string | null;
  name: string;
  email: string;
  phone: string;
  travelMonth?: string | null;
  travelDate?: string | null;
  adults: number;
  children: number;
  message: string;
  consentDataProcessing: boolean;
  consentWhatsApp: boolean;
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'QUOTED' | 'WON' | 'LOST';
  assignedToId?: string | null;
  firstResponseAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoEnquiryExtraction {
  _id?: ObjectId;
  id: string;
  enquiryId: string;
  fields: string; // JSON
  correctedFields?: string | null;
  model: string;
  rawResponse?: string | null;
  status: 'PENDING' | 'REVIEWED';
  createdAt: Date;
}

export interface MongoPackageSuggestion {
  _id?: ObjectId;
  id: string;
  enquiryId: string;
  packageId: string;
  rank: number;
  score: number;
  reasons: string; // JSON array
  createdAt: Date;
}

export interface MongoReplyDraft {
  _id?: ObjectId;
  id: string;
  enquiryId: string;
  body: string;
  priceBreakdown: string; // JSON
  status: 'DRAFT' | 'ACCEPTED' | 'SENT' | 'DISCARDED';
  acceptedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoEnquiryNote {
  _id?: ObjectId;
  id: string;
  enquiryId: string;
  authorId: string;
  body: string;
  createdAt: Date;
}

export interface MongoMessageLog {
  _id?: ObjectId;
  id: string;
  enquiryId: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  direction: 'OUTBOUND' | 'INBOUND';
  body: string;
  template?: string | null;
  recipient?: string | null;
  createdAt: Date;
}

export interface MongoActivityLog {
  _id?: ObjectId;
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  meta?: string | null;
  createdAt: Date;
}

export interface MongoRedirect {
  _id?: ObjectId;
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  createdAt: Date;
}

export function idMatch(id: string) {
  if (ObjectId.isValid(id)) {
    try {
      return { $or: [{ _id: new ObjectId(id) }, { id }] };
    } catch {
      return { id };
    }
  }
  return { id };
}

export function normalizeDoc<T = any>(doc: any): T {
  if (!doc) return null as any;
  const id = doc.id || (doc._id ? doc._id.toString() : '');
  return {
    ...doc,
    id,
  } as T;
}

export function normalizeDocs<T = any>(docs: any[]): T[] {
  return docs.map((d) => normalizeDoc<T>(d));
}

export async function connectMongo(): Promise<Db> {
  if (db && client) {
    return db;
  }

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      uri = memoryServerInstance.getUri();
    } else {
      const dataDir = path.resolve(process.cwd(), 'data/mongodb');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create({
          instance: {
            dbPath: dataDir,
            storageEngine: 'wiredTiger',
          },
        });
        uri = memoryServerInstance.getUri();
        console.log(`[MongoDB] Embedded MongoDB started with persistence at ${dataDir}`);
      } catch (err) {
        console.warn('[MongoDB] Persistent storage failed, launching in-memory MongoMemoryServer:', err);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create();
        uri = memoryServerInstance.getUri();
        console.log('[MongoDB] Embedded in-memory MongoDB started at', uri);
      }
    }
  }

  console.log(`[MongoDB] Connecting to MongoDB instance...`);
  client = new MongoClient(uri || 'mongodb://127.0.0.1:27017/companya');
  await client.connect();

  const dbName = process.env.MONGODB_DB_NAME || 'companya';
  db = client.db(dbName);

  // Initialize essential indexes
  await ensureIndexes(db);

  console.log(`[MongoDB] Connected successfully to database "${dbName}"`);
  return db;
}

async function ensureIndexes(database: Db) {
  try {
    await database.collection('users').createIndex({ email: 1 }, { unique: true });
    await database.collection('destinations').createIndex({ slug: 1 }, { unique: true });
    await database.collection('packages').createIndex({ code: 1 }, { unique: true });
    await database.collection('packages').createIndex({ slug: 1 }, { unique: true });
    await database.collection('package_versions').createIndex({ packageId: 1, versionNumber: 1 }, { unique: true });
    await database.collection('enquiries').createIndex({ reference: 1 }, { unique: true });
    await database.collection('enquiries').createIndex({ status: 1 });
    await database.collection('redirects').createIndex({ fromPath: 1 }, { unique: true });
    await database.collection('activity_logs').createIndex({ createdAt: -1 });
  } catch (err) {
    console.warn('[MongoDB] Index creation notice:', err);
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Please call connectMongo() before accessing collections.');
  }
  return db;
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error('MongoClient not initialized. Please call connectMongo() first.');
  }
  return client;
}

export const collections = {
  users: () => getDb().collection<MongoUser>('users'),
  destinations: () => getDb().collection<MongoDestination>('destinations'),
  packages: () => getDb().collection<MongoPackage>('packages'),
  packageVersions: () => getDb().collection<MongoPackageVersion>('package_versions'),
  enquiries: () => getDb().collection<MongoEnquiry>('enquiries'),
  enquiryExtractions: () => getDb().collection<MongoEnquiryExtraction>('enquiry_extractions'),
  packageSuggestions: () => getDb().collection<MongoPackageSuggestion>('package_suggestions'),
  replyDrafts: () => getDb().collection<MongoReplyDraft>('reply_drafts'),
  enquiryNotes: () => getDb().collection<MongoEnquiryNote>('enquiry_notes'),
  messageLogs: () => getDb().collection<MongoMessageLog>('message_logs'),
  activityLogs: () => getDb().collection<MongoActivityLog>('activity_logs'),
  redirects: () => getDb().collection<MongoRedirect>('redirects'),
};

export async function closeMongo() {
  if (client) {
    try {
      await client.close(true);
    } catch {}
    client = null;
    db = null;
  }
  if (memoryServerInstance) {
    try {
      await memoryServerInstance.stop({ doCleanup: true, force: true });
    } catch {}
    memoryServerInstance = null;
  }
}
