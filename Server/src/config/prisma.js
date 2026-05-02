// src/config/prisma.js — Prisma client singleton with Neon cold-start resilience
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Increase connection timeout for Neon cold-start (free tier sleeps after inactivity)
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * Warm up the DB connection on startup.
 * Neon free tier can take 2-5s to wake. We retry up to 5 times.
 */
async function connectWithRetry(attempts = 5, delayMs = 2000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return;
    } catch (err) {
      console.warn(`⚠️  DB connection attempt ${i}/${attempts} failed: ${err.message}`);
      if (i === attempts) {
        console.error('❌ Could not connect to database after all retries. Server will start anyway — queries will fail until DB is reachable.');
        return; // Don't crash — let the server start, individual queries will retry
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

connectWithRetry();

module.exports = { prisma };
