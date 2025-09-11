const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting teachers password update...');

  // Get all teachers
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      teacherId: true
    }
  });

  console.log(`📊 Found ${teachers.length} teachers to update`);

  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const teacher of teachers) {
    try {
      // Generate new password: firstname_abis
      const firstName = teacher.firstName || teacher.lastName; // Use lastName if firstName is empty
      const newPassword = `${firstName.toLowerCase()}_abis`;
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update teacher password
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { password: hashedPassword }
      });

      updatedCount++;
      console.log(`✅ Updated teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId}) - Password: ${newPassword}`);

    } catch (error) {
      const errorMsg = `Error updating teacher ${teacher.firstName} ${teacher.lastName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Teachers updated: ${updatedCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Total processed: ${teachers.length}`);

  if (errorCount > 0) {
    console.warn(`\n⚠️  ${errorCount} teachers could not be updated due to errors.`);
    console.log('\nDetailed errors:');
    errors.forEach((err, index) => console.log(`   ${index + 1}. ${err}`));
  } else {
    console.log(`\n✅ Teachers password update completed successfully!`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during password update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
