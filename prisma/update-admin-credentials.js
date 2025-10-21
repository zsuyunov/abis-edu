const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminCredentials() {
  console.log('🔄 Updating admin credentials...');

  try {
    // First, check current admin count
    const initialCount = await prisma.admin.count();
    console.log('📊 Initial admin count:', initialCount);

    // Remove old admin
    const oldPhone = '+998951515185';
    const oldAdmin = await prisma.admin.findUnique({ where: { phone: oldPhone } });
    
    if (oldAdmin) {
      await prisma.admin.delete({ where: { phone: oldPhone } });
      console.log('✅ Removed old admin with phone:', oldPhone);
    } else {
      console.log('⚠️  Old admin not found with phone:', oldPhone);
    }

    // Create new admin
    const newPhone = '+998951515186';
    const newPassword = 'SmileLaugh86';
    
    // Check if new admin already exists
    const existingNewAdmin = await prisma.admin.findUnique({ where: { phone: newPhone } });
    if (existingNewAdmin) {
      console.log('⚠️  Admin with new phone already exists, updating password...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.admin.update({
        where: { phone: newPhone },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          tokenVersion: { increment: 1 },
          lastPasswordChange: new Date(),
        },
      });
      console.log('✅ Updated existing admin password');
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const newAdmin = await prisma.admin.create({
        data: {
          id: `admin-${Date.now()}`,
          phone: newPhone,
          password: hashedPassword,
        },
      });
      console.log('✅ Created new admin with ID:', newAdmin.id);
    }

    // Verify final state
    const finalCount = await prisma.admin.count();
    const newAdminExists = await prisma.admin.findUnique({ where: { phone: newPhone } });
    const oldAdminExists = await prisma.admin.findUnique({ where: { phone: oldPhone } });

    console.log('📊 Final admin count:', finalCount);
    console.log('✅ New admin exists:', !!newAdminExists);
    console.log('❌ Old admin removed:', !oldAdminExists);
    
    if (newAdminExists) {
      console.log('🆔 New admin ID:', newAdminExists.id);
    }

  } catch (error) {
    console.error('❌ Error updating admin credentials:', error.message);
    throw error;
  }
}

if (require.main === module) {
  updateAdminCredentials()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { updateAdminCredentials };
