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
  console.log('🌱 Starting Year 12 KS 5-Maxmudxo\'ja Behbudiy class and students seeding...');

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

  // Create the class "Year 12 KS 5-Maxmudxo'ja Behbudiy"
  const classData = {
    name: 'Year 12 KS 5-Maxmudxo\'ja Behbudiy',
    capacity: 13, // Number of students in the provided data
    branchId: branch.id,
    academicYearId: academicYear.id,
    language: ClassLanguage.ENGLISH,
    educationType: ClassEducationType.HIGH,
    status: ClassStatus.ACTIVE
  };

  const createdClass = await prisma.class.upsert({
    where: { name: classData.name },
    update: {},
    create: classData
  });

  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data from the provided records
  const studentsData = [
    {
      studentId: 'S73506',
      lastName: 'RO\'ZIBOYEVA',
      firstName: 'DILNOZA OYBEK QIZI',
      dateOfBirth: '2009-11-07',
      phone: '+998770840000',
      password: '4Wxy8zA1b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S48192',
      lastName: 'UZAKOV',
      firstName: 'UMARXON RAVSHANOVICH',
      dateOfBirth: '2009-12-12',
      phone: '+998901880022',
      password: '1Cde2fG3h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S85937',
      lastName: 'SULTANOV',
      firstName: 'MUXAMMADALI OBIDJON O\'G\'LI',
      dateOfBirth: '2010-01-12',
      phone: '+998977059350',
      password: '6Ijk4lM7n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S62418',
      lastName: 'SHERQULOVA',
      firstName: 'SHAXRIZODA SHERZOD QIZI',
      dateOfBirth: '2009-10-20',
      phone: '+998971390888',
      password: '9Opq0rS2t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S37045',
      lastName: 'MURODILLAYEVA',
      firstName: 'ZARNIGOR ULUG\'BEKOVNA',
      dateOfBirth: '2009-07-06',
      phone: '+998994405445',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S91682',
      lastName: 'AZIMJONOVA',
      firstName: 'DILAZIZ',
      dateOfBirth: '2009-05-20',
      phone: '+998881895156',
      password: '8Abc1dE3f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S25879',
      lastName: 'SAFAROV',
      firstName: 'ABDULAZIZ SHAVKAT O\'G\'LI',
      dateOfBirth: '2009-09-08',
      phone: '+998990171176',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S69314',
      lastName: 'BEKMURATOVA',
      firstName: 'BEGOYIM FARXODBEK QIZI',
      dateOfBirth: '2010-07-22',
      phone: '+998974547750',
      password: '2Mno4pQ6r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S42760',
      lastName: 'NAMOZOV',
      firstName: 'BOBURJON BAXTIYORJON O\'G\'LI',
      dateOfBirth: '2009-12-03',
      phone: '+998998631551',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S14083',
      lastName: 'ABDUMALIKOV',
      firstName: 'FIRDAVS ULUG\'BEK O\'G\'LI',
      dateOfBirth: '2009-07-15',
      phone: '+998901750203',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S87521',
      lastName: 'BOTIRJONOVA',
      firstName: 'MUSLIMA ALIMARDON QIZI',
      dateOfBirth: '2011-01-17',
      phone: '+998950035345',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S50964',
      lastName: 'KAMALOV',
      firstName: 'JAVOHIR JASUROVICH',
      dateOfBirth: '2009-08-22',
      phone: '+998909579798',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S36287',
      lastName: 'TURAKULOV',
      firstName: 'XUMOYUN UTKIROVICH',
      dateOfBirth: '2009-04-19',
      phone: '+998974043543',
      password: '3Qrs5tU7v',
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
  console.log(`   - Total processed: ${createdCount + errorCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} students could not be created due to duplicate Student IDs.`);
    console.log(`   Please update the student data with unique Student IDs and run the script again.`);
    console.log(`\nDetailed errors:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ Year 12 KS 5-Maxmudxo\'ja Behbudiy class and students seeding completed successfully!');
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