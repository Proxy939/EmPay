// prisma/seed.js — Seeds admin user + system config
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed SystemConfig defaults
  const configs = [
    { key: 'company_name', value: 'EmPay Inc.' },
    { key: 'company_logo_url', value: '' },
    { key: 'standard_daily_hours', value: '8' },
    { key: 'joining_serial_counter', value: '2' }, // 1 is used by the admin
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: cfg,
    });
  }
  console.log('✅ System config seeded');

  // 2. Create default Admin user
  const adminEmail = 'admin@empay.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const adminUser = await prisma.user.create({
      data: {
        loginId: 'EPADMI20260001',
        name: 'Admin User',
        email: adminEmail,
        phone: '9999999999',
        password: hashedPassword,
        role: 'ADMIN',
        companyName: 'EmPay Inc.',
        companyPrefix: 'EP',
        mustChangePassword: false,
        employee: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            department: 'Management',
            designation: 'System Administrator',
            joinDate: new Date(),
          },
        },
      },
    });

    console.log(`✅ Admin user created: loginId=${adminUser.loginId}, password=Admin@123`);
  } else {
    console.log('ℹ️  Admin user already exists, skipping');
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
