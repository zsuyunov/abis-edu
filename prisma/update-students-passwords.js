const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Starting students password update...');

  try {
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        password: true
      }
    });

    console.log(`📊 Found ${students.length} students to update`);

    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const student of students) {
      try {
        // Generate new password: last_name_abisedu
        const newPassword = `${student.lastName.toLowerCase()}_abisedu`;
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the student's password
        await prisma.student.update({
          where: { id: student.id },
          data: { password: hashedPassword }
        });

        updatedCount++;
        console.log(`✅ Updated password for: ${student.firstName} ${student.lastName} (${student.studentId}) -> ${newPassword}`);

      } catch (error) {
        const errorMsg = `Error updating password for student ${student.studentId}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Students updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total processed: ${updatedCount + errorCount}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} students could not be updated.`);
      console.log(`\nDetailed errors:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ All students passwords updated successfully!');
      console.log('🔐 New password format: last_name_abisedu');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
