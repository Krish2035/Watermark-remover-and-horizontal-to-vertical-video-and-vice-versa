import dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://user:pass@ep-cool-sample.neon.tech/neondb?sslmode=require'
  }
};
