import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

let db = null;
let isConnected = false;

// In-memory fallback registries
const inMemoryUsers = new Map();
let memoryUserIdCounter = 1;

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && (databaseUrl.includes('neon.tech') || databaseUrl.includes('postgres'))) {
  try {
    const sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
    isConnected = true;
    console.log('✅ Connected to Neon PostgreSQL via Drizzle ORM');

    // Auto-create tables if they don't exist
    initTables(sql);
  } catch (error) {
    console.warn('⚠️ Neon PostgreSQL connection failed:', error.message);
  }
} else {
  console.log('ℹ️ DATABASE_URL not detected or not set. Running in resilient in-memory mode.');
}

async function initTables(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS media_jobs (
        id SERIAL PRIMARY KEY,
        file_id TEXT NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id),
        original_name TEXT NOT NULL,
        media_type TEXT NOT NULL,
        mime_type TEXT,
        file_size INTEGER,
        original_url TEXT,
        operation TEXT NOT NULL DEFAULT 'watermark_removal',
        status TEXT NOT NULL DEFAULT 'uploaded',
        result_url TEXT,
        download_url TEXT,
        metadata JSONB,
        processing_time_ms INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log('✅ Neon PostgreSQL schema verified & ready.');
  } catch (err) {
    console.warn('⚠️ Table initialization notice:', err.message);
  }
}

/**
 * Create a new user
 */
export async function createUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  if (db && isConnected) {
    try {
      const [newUser] = await db
        .insert(schema.users)
        .values({
          name: name.trim(),
          email: normalizedEmail,
          password
        })
        .returning();
      return newUser;
    } catch (err) {
      console.warn('Drizzle ORM createUser warning, falling back to memory:', err.message);
    }
  }

  // Memory fallback
  const user = {
    id: memoryUserIdCounter++,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  inMemoryUsers.set(normalizedEmail, user);
  return user;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();

  if (db && isConnected) {
    try {
      const [found] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, normalizedEmail))
        .limit(1);
      if (found) return found;
    } catch (err) {
      console.warn('Drizzle ORM findUserByEmail warning, checking memory:', err.message);
    }
  }

  return inMemoryUsers.get(normalizedEmail) || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id) {
  if (!id) return null;

  if (db && isConnected) {
    try {
      const [found] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, Number(id)))
        .limit(1);
      if (found) return found;
    } catch (err) {
      console.warn('Drizzle ORM findUserById warning, checking memory:', err.message);
    }
  }

  for (const user of inMemoryUsers.values()) {
    if (user.id === Number(id)) return user;
  }
  return null;
}

/**
 * Save or update media processing job in PostgreSQL (if connected) with fallback
 */
export async function saveJobRecord(jobData) {
  if (!db || !isConnected) return null;
  try {
    const [saved] = await db
      .insert(schema.mediaJobs)
      .values({
        fileId: jobData.fileId,
        userId: jobData.userId || null,
        originalName: jobData.originalName || 'media',
        mediaType: jobData.mediaType || 'image',
        mimeType: jobData.mimeType,
        fileSize: jobData.fileSize,
        originalUrl: jobData.originalUrl,
        operation: jobData.operation || 'watermark_removal',
        status: jobData.status || 'uploaded',
        resultUrl: jobData.resultUrl,
        downloadUrl: jobData.downloadUrl,
        metadata: jobData.metadata || {},
        processingTimeMs: jobData.processingTimeMs
      })
      .onConflictDoUpdate({
        target: schema.mediaJobs.fileId,
        set: {
          status: jobData.status,
          resultUrl: jobData.resultUrl,
          downloadUrl: jobData.downloadUrl,
          metadata: jobData.metadata,
          processingTimeMs: jobData.processingTimeMs,
          updatedAt: new Date()
        }
      })
      .returning();
    return saved;
  } catch (err) {
    console.warn('Drizzle ORM saveJobRecord warning:', err.message);
    return null;
  }
}

/**
 * Get all recent jobs
 */
export async function getRecentJobs(limit = 20) {
  if (!db || !isConnected) return [];
  try {
    return await db.select().from(schema.mediaJobs).limit(limit);
  } catch (err) {
    console.warn('Drizzle ORM getRecentJobs warning:', err.message);
    return [];
  }
}

export { db, isConnected };
