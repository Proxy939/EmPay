// src/index.js - Entry point
require('dotenv').config();
const app = require('./app');
const { prisma } = require('./config/prisma');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('\n🛑 Server shut down gracefully');
  process.exit(0);
});

startServer();
