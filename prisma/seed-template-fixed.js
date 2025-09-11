const { PrismaClient, UserSex, StudentStatus, ClassStatus, ClassEducationType, ClassLanguage } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Template for creating seed files with proper duplicate Student ID handling
 * 
 * This template ensures that:
 * 1. Student IDs are unique per class by prefixing with class identifier
 * 2. Original student IDs are checked for conflicts across classes
 * 3. Clear error messages are shown when duplicate IDs are found
 * 4. No students are updated - only new students are created
 */

async function createClassWithStudents(classData, studentsData, classPrefix) {
  console.log(`🌱 Starting ${classData.name} class and students seeding...`);

  // Verify branch with short name "85" exists
  const branch = await prisma.branch.findFirst({
    where: { shortName: '85' }
  });

  if (!branch) {
    console.error('❌ Branch with short name "85" not found. Please create branch with short name "85" first.');
    return;
  }

  console.log(`✅ Found branch: ${branch.shortName} (ID: ${branch.id})`);

  // Verify academic year 2025-2026 exists
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      name: '2025-2026'
    }
  });

  if (!academicYear) {
    console.error('❌ Academic year 2025-2026 not found. Please create academic year 2025-2026 first.');
    return;
  }

  console.log(`✅ Found academic year: ${academicYear.name} (ID: ${academicYear.id})`);

  // Set branch and academic year IDs
  classData.branchId = branch.id;
  classData.academicYearId = academicYear.id;

  // Create the class
  const createdClass = await prisma.class.upsert({
    where: { name: classData.name },
    update: {},
    create: classData
  });

  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Create students with class-prefixed student IDs
  let createdCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const studentData of studentsData) {
    try {
      // Create class-prefixed student ID
      const prefixedStudentId = `${classPrefix}-${createdClass.id}-${studentData.studentId}`;
      
      // Check if this prefixed student ID already exists
      const existingStudent = await prisma.student.findUnique({
        where: { studentId: prefixedStudentId }
      });

      if (existingStudent) {
        const error = `Student ID "${prefixedStudentId}" already exists for student: ${existingStudent.firstName} ${existingStudent.lastName}`;
        console.error(`❌ ERROR: ${error}`);
        console.error(`   Please change the original student ID "${studentData.studentId}" to a new unique one.`);
        errors.push(error);
        errorCount++;
        continue;
      }

      // Check if the original student ID exists in any other class
      const originalIdExists = await prisma.student.findFirst({
        where: { 
          studentId: studentData.studentId,
          classId: { not: createdClass.id }
        },
        include: { class: { select: { name: true } } }
      });

      if (originalIdExists) {
        const error = `Original Student ID "${studentData.studentId}" already exists in class "${originalIdExists.class.name}" for student: ${originalIdExists.firstName} ${originalIdExists.lastName}`;
        console.error(`❌ ERROR: ${error}`);
        console.error(`   Please change the student ID "${studentData.studentId}" to a new unique one.`);
        errors.push(error);
        errorCount++;
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(studentData.password, 12);

      // Create new student with prefixed ID
      const student = await prisma.student.create({
        data: {
          id: `student-${prefixedStudentId.toLowerCase()}`,
          studentId: prefixedStudentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: new Date(studentData.dateOfBirth),
          phone: studentData.phone,
          password: hashedPassword,
          gender: studentData.gender,
          status: studentData.status,
          branchId: branch.id,
          classId: createdClass.id
        }
      });

      createdCount++;
      console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${prefixedStudentId})`);

    } catch (error) {
      const errorMsg = `Error processing student ${studentData.studentId}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Class: ${createdClass.name} (ID: ${createdClass.id})`);
  console.log(`   - Branch: ${branch.shortName} (ID: ${branch.id})`);
  console.log(`   - Academic Year: ${academicYear.name} (ID: ${academicYear.id})`);
  console.log(`   - Students created: ${createdCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Total processed: ${createdCount + errorCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} students could not be created due to duplicate Student IDs.`);
    console.log(`   Please update the student data with unique Student IDs and run the script again.`);
    console.log(`\nDetailed errors:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ Class and students seeding completed successfully!');
  }

  return { createdCount, errorCount, errors };
}

// Example usage:
/*
const classData = {
  name: 'Year 9 KS 3- Obidjon Mahmudov',
  capacity: 22,
  language: ClassLanguage.ENGLISH,
  educationType: ClassEducationType.HIGH,
  status: ClassStatus.ACTIVE
};

const studentsData = [
  // ... student data array
];

// Run the seeding
createClassWithStudents(classData, studentsData, 'Y9')
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
*/

module.exports = { createClassWithStudents };
