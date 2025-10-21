const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureAdmin(phone, password) {
  console.log('🔎 Ensuring admin exists for phone:', phone);

  try {
    const totalBefore = await prisma.admin.count();

    const existing = await prisma.admin.findUnique({ where: { phone } });
    if (existing) {
      console.log('✅ Admin already exists.');
      console.log('🆔 ID:', existing.id);
      const totalAfter = await prisma.admin.count();
      console.log('📊 Admin count:', totalAfter);
      return existing;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        id: `admin-${Date.now()}`,
        phone,
        password: hashedPassword,
      },
    });

    console.log('✅ Admin created.');
    console.log('🆔 ID:', admin.id);
    const totalAfter = await prisma.admin.count();
    console.log('📊 Admin count:', totalAfter);
    return admin;
  } catch (error) {
    console.error('❌ Error ensuring admin:', error.message);
    throw error;
  }
}

if (require.main === module) {
  const phone = '+998951515185';
  const password = 'SmileLaugh85';
  ensureAdmin(phone, password)
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { ensureAdmin };


