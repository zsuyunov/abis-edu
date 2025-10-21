const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword(phone, newPassword) {
  console.log('🔐 Resetting admin password for:', phone);

  try {
    const admin = await prisma.admin.findUnique({ where: { phone } });
    if (!admin) {
      console.log('❌ Admin not found for phone:', phone);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.admin.update({
      where: { phone },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        tokenVersion: { increment: 1 },
        lastPasswordChange: new Date(),
      },
      select: { id: true, phone: true },
    });

    console.log('✅ Password updated successfully.');
    console.log('🆔 ID:', updated.id);
    console.log('📱 Phone:', updated.phone);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    throw error;
  }
}

if (require.main === module) {
  const phone = '+998951515185';
  const newPassword = 'SmileLaugh85';
  resetAdminPassword(phone, newPassword)
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { resetAdminPassword };


