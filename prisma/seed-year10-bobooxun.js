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
  console.log('🌱 Starting Year 10 KS 4- Bobooxun Salimov class and students seeding...');

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

  // Create the class "Year 10 KS 4- Bobooxun Salimov"
  const classData = {
    name: 'Year 10 KS 4- Bobooxun Salimov',
    capacity: 16, // Number of students in the provided data
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
      studentId: 'S58139',
      lastName: 'ABDULLAYEVA',
      firstName: 'SAMIRABONU AZIZ QIZI',
      dateOfBirth: '2012-08-04',
      phone: '+998974101020',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S20674',
      lastName: 'BAYZAQOV',
      firstName: 'MUZAFFAR E\'LYOR O\'G\'LI',
      dateOfBirth: '2011-05-19',
      phone: '+998933704141',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73951',
      lastName: 'DILSHODOVA',
      firstName: 'AZIZAXON DILMUROD QIZI',
      dateOfBirth: '2011-12-17',
      phone: '+998999134648',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S48520',
      lastName: 'FOZILOV',
      firstName: 'AHMADJON MOHIRJON O\'G\'LI',
      dateOfBirth: '2011-10-02',
      phone: '+998909318517',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89263',
      lastName: 'ISAKOV',
      firstName: 'BOBUR GAYRATOVICH',
      dateOfBirth: '2011-08-21',
      phone: '+998971198888',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15784',
      lastName: 'QUDRATXONOVA',
      firstName: 'RUXSHONA SUNNATILLA QIZI',
      dateOfBirth: '2011-01-03',
      phone: '+998909179295',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S72039',
      lastName: 'TASHPULATOV',
      firstName: 'ALI XUSAM AL DIN O\'G\'LI',
      dateOfBirth: '2011-09-20',
      phone: '+998999999494',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S34892',
      lastName: 'AZIMJONOVA',
      firstName: 'LAZIZA',
      dateOfBirth: '2012-04-22',
      phone: '+998881895156',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S91507',
      lastName: 'MAXKAMOV',
      firstName: 'ABDURAXMON AXMAD O\'G\'LI',
      dateOfBirth: '2012-02-19',
      phone: '+998909727027',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S56248',
      lastName: 'BOLTAYEVA',
      firstName: 'GULNOZA SHAVKATOVNA',
      dateOfBirth: '2013-06-27',
      phone: '+998950074480',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S20963',
      lastName: 'AKBAROV',
      firstName: 'MAHMUDJON MUZAFFAROVICH',
      dateOfBirth: '2012-01-06',
      phone: '+998909880020',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67481',
      lastName: 'SADRIDDINOV',
      firstName: 'AZIZBEK ULUG\'BEK O\'G\'LI',
      dateOfBirth: '2011-12-01',
      phone: '+998981117718',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S43175',
      lastName: 'HIKMATOVA',
      firstName: 'XADICHA',
      dateOfBirth: '2011-07-07',
      phone: '+998977540770',
      password: '7Mno9pQ1r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S98620',
      lastName: 'MIRSAITOV',
      firstName: 'MURZOXID MIRABBOS O\'G\'LI',
      dateOfBirth: '2011-06-10',
      phone: '+998977580034',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S75309',
      lastName: 'USANOVA',
      firstName: 'DIYORA JAMSHIDOVNA',
      dateOfBirth: '2012-10-08',
      phone: '+998771142428',
      password: '3Yza5bC7d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S21847',
      lastName: 'RAXIMOV',
      firstName: 'SARVAR RAVSHANOVICH',
      dateOfBirth: '2011-10-22',
      phone: '+998771142429',
      password: '8Efg0hI2j',
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
    console.log('\n✅ Year 10 KS 4- Bobooxun Salimov class and students seeding completed successfully!');
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