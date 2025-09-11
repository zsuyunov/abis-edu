const { PrismaClient, UserSex, StudentStatus, ClassStatus, ClassEducationType, ClassLanguage } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper function to generate a unique student ID
async function generateUniqueStudentId(originalId) {
  let newId = originalId;
  let counter = 1;
  
  while (true) {
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: newId }
    });
    
    if (!existingStudent) {
      return newId;
    }
    
    // Generate new ID by appending counter
    newId = `${originalId.slice(0, -1)}${counter}`;
    counter++;
    
    // Prevent infinite loop (safety check)
    if (counter > 999) {
      throw new Error(`Could not generate unique ID for ${originalId} after 999 attempts`);
    }
  }
}

async function main() {
  console.log('🌱 Starting Year 8 KS 3 - Ubaydullaxo\'ja Asadullaxo\'jayev class and students seeding...');

  // Verify branch with short name "85" exists
  const branch = await prisma.branch.findFirst({
    where: { shortName: '85' },
  });

  if (!branch) {
    console.error('❌ Branch with shortName "85" not found. Please ensure it exists.');
    return;
  }
  console.log(`✅ Found branch: ${branch.shortName} (ID: ${branch.id})`);

  // Verify academic year 2025-2026 exists
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      startDate: new Date('2025-09-01T00:00:00.000Z'),
      endDate: new Date('2026-06-01T00:00:00.000Z'),
    },
  });

  if (!academicYear) {
    console.error('❌ Academic Year 2025-2026 not found. Please ensure it exists.');
    return;
  }
  console.log(`✅ Found academic year: ${academicYear.name} (ID: ${academicYear.id})`);

  // Create or update the class
  const createdClass = await prisma.class.upsert({
    where: { name: 'Year 8 KS 3 - Ubaydullaxo\'ja Asadullaxo\'jayev' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 8, // Number of students in the data
    },
    create: {
      name: 'Year 8 KS 3 - Ubaydullaxo\'ja Asadullaxo\'jayev',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 8,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S46289',
      lastName: 'ASROROV',
      firstName: 'ASLAN AZAMATOVICH',
      dateOfBirth: '2014-01-10',
      phone: '+998905382050',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S13570',
      lastName: 'ALIMXANOVA',
      firstName: 'SAMIRAXON DILSHODXONOVNA',
      dateOfBirth: '2014-06-06',
      phone: '+998973308855',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S98246',
      lastName: 'AZIMXO\'JAYEV',
      firstName: 'SAYYID JALOLIDDIN BEHZODOVICH',
      dateOfBirth: '2013-01-06',
      phone: '+998983076457',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S75931',
      lastName: 'MEMMEDZADE',
      firstName: 'AYNAZ KERIMULLA QIZI',
      dateOfBirth: '2014-01-07',
      phone: '+998903708184',
      password: '9Abc1dE3f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61408',
      lastName: 'QODIRJONOVA',
      firstName: 'SAFINA NODIROVNA',
      dateOfBirth: '2014-06-06',
      phone: '+998973308855',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28659',
      lastName: 'RASULOVA',
      firstName: 'GO`ZAL JAMSHID QIZI',
      dateOfBirth: '2013-12-17',
      phone: '+998900000040',
      password: '7Mno9pQ1r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84027',
      lastName: 'SULTANOV',
      firstName: 'AKBAR AZIZOVICH',
      dateOfBirth: '2013-03-12',
      phone: '+998977141702',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S57391',
      lastName: 'ILHAMOV',
      firstName: 'HABIBULLOX SHERZOD O\'G\'LI',
      dateOfBirth: '2013-05-25',
      phone: '+998906772979',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    }
  ];

  // Create students with proper duplicate ID handling
  let createdCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const studentData of studentsData) {
    try {
      // Generate unique student ID (auto-fix duplicates)
      const uniqueStudentId = await generateUniqueStudentId(studentData.studentId);
      
      // Log if ID was changed
      if (uniqueStudentId !== studentData.studentId) {
        console.log(`🔄 Auto-generated unique ID: ${studentData.studentId} → ${uniqueStudentId}`);
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(studentData.password, 12);

      // Create new student with unique ID
      const student = await prisma.student.create({
        data: {
          id: `student-${uniqueStudentId.toLowerCase()}`,
          studentId: uniqueStudentId,
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
      console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${uniqueStudentId})`);

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
  console.log(`   - Total processed: ${studentsData.length}`);

  if (errorCount > 0) {
    console.warn(`\n⚠️  ${errorCount} students could not be created due to errors.`);
    console.log('\nDetailed errors:');
    errors.forEach((err, index) => console.log(`   ${index + 1}. ${err}`));
  } else {
    console.log(`\n✅ Year 8 KS 3 - Ubaydullaxo'ja Asadullaxo'jayev class and students seeding completed successfully!`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
