/**
 * Invalidate All Sessions - Force Re-login
 * Run this once after security upgrade to invalidate all old tokens
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function invalidateAllSessions() {
  console.log('🔒 Starting session invalidation...\n');

  try {
    // Increment tokenVersion for all admins
    const adminsUpdated = await prisma.admin.updateMany({
      data: {
        tokenVersion: { increment: 1 }
      }
    });
    console.log(`✅ Invalidated ${adminsUpdated.count} admin sessions`);

    // Increment tokenVersion for all teachers
    const teachersUpdated = await prisma.teacher.updateMany({
      data: {
        tokenVersion: { increment: 1 }
      }
    });
    console.log(`✅ Invalidated ${teachersUpdated.count} teacher sessions`);

    // Increment tokenVersion for all students
    const studentsUpdated = await prisma.student.updateMany({
      data: {
        tokenVersion: { increment: 1 }
      }
    });
    console.log(`✅ Invalidated ${studentsUpdated.count} student sessions`);

    // Increment tokenVersion for all parents
    const parentsUpdated = await prisma.parent.updateMany({
      data: {
        tokenVersion: { increment: 1 }
      }
    });
    console.log(`✅ Invalidated ${parentsUpdated.count} parent sessions`);

    // Increment tokenVersion for all staff users
    const usersUpdated = await prisma.user.updateMany({
      data: {
        tokenVersion: { increment: 1 }
      }
    });
    console.log(`✅ Invalidated ${usersUpdated.count} staff sessions`);

    console.log('\n✨ All sessions invalidated successfully!');
    console.log('📌 All users will need to login again.');
    
  } catch (error) {
    console.error('❌ Error invalidating sessions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

invalidateAllSessions();

