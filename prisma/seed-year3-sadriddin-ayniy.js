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
  console.log('🌱 Starting Year 3 KS 2- Sadriddin Ayniy class and students seeding...');

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
    where: { name: 'Year 3 KS 2- Sadriddin Ayniy' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 16, // Number of students in the data
    },
    create: {
      name: 'Year 3 KS 2- Sadriddin Ayniy',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 16,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S84305',
      lastName: 'MANSURXODJAYEV',
      firstName: 'MUHAMMADSOLIH MUXTOR O\'G\'LI',
      dateOfBirth: '2018-06-03',
      phone: '+998974903727',
      password: '7Efg9hI1j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15757',
      lastName: 'MANNONJONOV',
      firstName: 'TEMURMALIK MAKSUD O\'G\'LI',
      dateOfBirth: '2018-07-11',
      phone: '+998943062117',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73067',
      lastName: 'ISOKULOVA',
      firstName: 'ODINA NURIDDIN QIZI',
      dateOfBirth: '2018-05-29',
      phone: '+998977723421',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49530',
      lastName: 'FARXODOV',
      firstName: 'IBROXIM ISLOMOVICH',
      dateOfBirth: '2018-01-12',
      phone: '+998950515555',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86260',
      lastName: 'SHUXRATOV',
      firstName: 'SAID SANJAROVICH',
      dateOfBirth: '2018-01-28',
      phone: '+998910151188',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73970',
      lastName: 'VOHIDJONOVA',
      firstName: 'OISHA QOSIM QIZI',
      dateOfBirth: '2018-09-29',
      phone: '+99890968734',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51858',
      lastName: 'JO\'RAYEVA',
      firstName: 'SOLIHA MUHIDDIN QIZI',
      dateOfBirth: '2018-01-17',
      phone: '+998974779996',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67559',
      lastName: 'SHARIFJONOVA',
      firstName: 'YASMINA MUZAFFARJON QIZI',
      dateOfBirth: '2017-08-28',
      phone: '+998903266611',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39291',
      lastName: 'XURMATULLAYEVA',
      firstName: 'IMONAXON XURSHIDOVNA',
      dateOfBirth: '2018-07-05',
      phone: '+998977747878',
      password: '9Abc1dE3f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95742',
      lastName: 'MIRKABILOV',
      firstName: 'MIRA\'LO MIRKAMOL O\'G\'LI',
      dateOfBirth: '2018-04-06',
      phone: '+998998658733',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61439',
      lastName: 'UMARJONOV',
      firstName: 'MUHAMMADIY NASRULLOXON',
      dateOfBirth: '2018-07-13',
      phone: '+998911111100',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28066',
      lastName: 'SHOBAHROMOV',
      firstName: 'SHOISLOM SHORUSTAMOVICH',
      dateOfBirth: '2018-07-05',
      phone: '+998911919090',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74629',
      lastName: 'BOSITXONOVA',
      firstName: 'AISHA',
      dateOfBirth: '2018-05-19',
      phone: '+998971198008',
      password: '3Yza5bC7d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89357',
      lastName: 'MAJIDOVA',
      firstName: 'OMINA ABDUSHKUR QIZI',
      dateOfBirth: '2018-04-22',
      phone: '+998909409950',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52208',
      lastName: 'ARMAN',
      firstName: 'SAAR',
      dateOfBirth: '2019-08-09',
      phone: '+998938104390',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67560',
      lastName: 'AZIMJONOV',
      firstName: 'MUXAMMADSAID AZIZOVICH',
      dateOfBirth: '2018-07-30',
      phone: '+998331210777',
      password: '2Qrs4tU6v',
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
    console.log(`\n✅ Year 3 KS 2- Sadriddin Ayniy class and students seeding completed successfully!`);
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
