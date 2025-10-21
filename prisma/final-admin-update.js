const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function finalAdminUpdate() {
  console.log('🔄 Final admin credential update...');

  try {
    // Check current admin count
    const initialCount = await prisma.admin.count();
    console.log('📊 Initial admin count:', initialCount);

    // Remove recently created admin
    const recentPhone = '+998951515186';
    const recentAdmin = await prisma.admin.findUnique({ where: { phone: recentPhone } });
    
    if (recentAdmin) {
      await prisma.admin.delete({ where: { phone: recentPhone } });
      console.log('✅ Removed recent admin with phone:', recentPhone);
    } else {
      console.log('⚠️  Recent admin not found with phone:', recentPhone);
    }

    // Create final admin
    const finalPhone = '+998951818185';
    const finalPassword = 'SmileLaugh85';
    
    // Check if final admin already exists
    const existingFinalAdmin = await prisma.admin.findUnique({ where: { phone: finalPhone } });
    if (existingFinalAdmin) {
      console.log('⚠️  Admin with final phone already exists, updating password...');
      const hashedPassword = await bcrypt.hash(finalPassword, 10);
      await prisma.admin.update({
        where: { phone: finalPhone },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          tokenVersion: { increment: 1 },
          lastPasswordChange: new Date(),
        },
      });
      console.log('✅ Updated existing final admin password');
    } else {
      const hashedPassword = await bcrypt.hash(finalPassword, 10);
      const finalAdmin = await prisma.admin.create({
        data: {
          id: `admin-${Date.now()}`,
          phone: finalPhone,
          password: hashedPassword,
        },
      });
      console.log('✅ Created final admin with ID:', finalAdmin.id);
    }

    // Verify final state
    const finalCount = await prisma.admin.count();
    const finalAdminExists = await prisma.admin.findUnique({ where: { phone: finalPhone } });
    const recentAdminExists = await prisma.admin.findUnique({ where: { phone: recentPhone } });

    console.log('📊 Final admin count:', finalCount);
    console.log('✅ Final admin exists:', !!finalAdminExists);
    console.log('❌ Recent admin removed:', !recentAdminExists);
    
    if (finalAdminExists) {
      console.log('🆔 Final admin ID:', finalAdminExists.id);
      console.log('📱 Final admin phone:', finalAdminExists.phone);
    }

    // List all remaining admins
    const allAdmins = await prisma.admin.findMany({
      select: { id: true, phone: true },
      orderBy: { createdAt: 'asc' }
    });
    console.log('📋 All remaining admins:');
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ID: ${admin.id}, Phone: ${admin.phone}`);
    });

  } catch (error) {
    console.error('❌ Error updating final admin credentials:', error.message);
    throw error;
  }
}

if (require.main === module) {
  finalAdminUpdate()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { finalAdminUpdate };
