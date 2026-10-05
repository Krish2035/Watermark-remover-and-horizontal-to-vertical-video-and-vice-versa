import { pgTable, text, serial, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

/**
 * Users Table for Authentication & Session Tracking
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Media Processing Jobs Table for Neon PostgreSQL
 */
export const mediaJobs = pgTable('media_jobs', {
  id: serial('id').primaryKey(),
  fileId: text('file_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  originalName: text('original_name').notNull(),
  mediaType: text('media_type').notNull(), // 'image' | 'video'
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  originalUrl: text('original_url'),
  operation: text('operation').notNull().default('watermark_removal'), // 'watermark_removal' | 'aspect_conversion'
  status: text('status').notNull().default('uploaded'), // 'uploaded' | 'processing' | 'completed' | 'failed'
  resultUrl: text('result_url'),
  downloadUrl: text('download_url'),
  metadata: jsonb('metadata'), // detection bounding boxes, target aspect ratios, etc.
  processingTimeMs: integer('processing_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
