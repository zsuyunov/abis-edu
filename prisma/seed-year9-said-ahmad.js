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
  console.log('🌱 Starting Year 9 KS 3- Said Ahmad Siddiqiy Ajziy class and students seeding...');

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
    where: { name: 'Year 9 KS 3- Said Ahmad Siddiqiy Ajziy' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20, // Number of students in the data
    },
    create: {
      name: 'Year 9 KS 3- Said Ahmad Siddiqiy Ajziy',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S42806',
      lastName: 'ABDUL',
      firstName: 'MOIZ NIAZI',
      dateOfBirth: '2014-10-28',
      phone: '+998908291434',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S75931',
      lastName: 'GAFUROV',
      firstName: 'ZAFARBEK AZIZOVICH',
      dateOfBirth: '2013-04-05',
      phone: '+998977044004',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S18642',
      lastName: 'KAZIMOV',
      firstName: 'SARDOR ASKAROVICH',
      dateOfBirth: '2012-10-16',
      phone: '+998909308338',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S97350',
      lastName: 'RAXIMJONOVA',
      firstName: 'XILOLA RASULJON QIZI',
      dateOfBirth: '2012-08-28',
      phone: '+998981287202',
      password: '5Klm7nO9p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61489',
      lastName: 'XAMIDJANOV',
      firstName: 'FIRDAVS NAZIMBEKOVICH',
      dateOfBirth: '2012-02-10',
      phone: '+998941635548',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S35027',
      lastName: 'G\'ULOMOV',
      firstName: 'MUMINJON',
      dateOfBirth: '2013-07-23',
      phone: '+998901302020',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89264',
      lastName: 'QODIRXOJAYEV',
      firstName: 'QOSIMXO\'JA BAXODIRXO\'JA O\'G\'LI',
      dateOfBirth: '2013-02-18',
      phone: '+998977307808',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S13795',
      lastName: 'SHAVKATULI',
      firstName: 'ALANBEK',
      dateOfBirth: '2012-04-12',
      phone: '+998900997228',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S56820',
      lastName: 'ZIYOIDDINOVA',
      firstName: 'OMINA ZOXIDJON QIZI',
      dateOfBirth: '2013-12-11',
      phone: '+998902692772',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S24973',
      lastName: 'ABDUQODIROV',
      firstName: 'MUHAMMADAMIN',
      dateOfBirth: '2012-11-16',
      phone: '+998999770800',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S70148',
      lastName: 'BAYRAMOVA',
      firstName: 'AFSONA GYARAEVNA',
      dateOfBirth: '2013-01-17',
      phone: '+998903250767',
      password: '8Abc0dE2f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S38516',
      lastName: 'BAXRIDDINOV',
      firstName: 'AMIRBEK FAZLIDDINOVICH',
      dateOfBirth: '2012-03-05',
      phone: '+998911638002',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S96247',
      lastName: 'XODJAYEV',
      firstName: 'KAMRONBEK JALOLIDDIN O\'G\'LI',
      dateOfBirth: '2013-03-18',
      phone: '+998974219555',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51839',
      lastName: 'RADJAPOV',
      firstName: 'MUXAMMADAZIZ RAVSHANOVICH',
      dateOfBirth: '2012-11-21',
      phone: '+998909225743',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67402',
      lastName: 'MARUPOV',
      firstName: 'SAIDAMIR NODIRBEKOVICH',
      dateOfBirth: '2012-11-02',
      phone: '+998903777488',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S21985',
      lastName: 'UZAKOV',
      firstName: 'ABBOSXON RAVSHANOVICH',
      dateOfBirth: '2012-08-24',
      phone: '+998901880022',
      password: '7Efg9hI1j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84631',
      lastName: 'QOBILJONOV',
      firstName: 'MUHAMMADALI ODILJON O\'G\'LI',
      dateOfBirth: '2012-09-28',
      phone: '+998981282202',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S57390',
      lastName: 'TURAKULOVA',
      firstName: 'MUBINA UTKUR QIZI',
      dateOfBirth: '2012-07-12',
      phone: '+998974043543',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S18045',
      lastName: 'QUDRATXONOV',
      firstName: 'SAIDAZIZ SUNNATILLA O\'G\'LI',
      dateOfBirth: '2012-12-02',
      phone: '+998909179295',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S92734',
      lastName: 'SHODMONBOYEV',
      firstName: 'MUXAMMADYUSUF NURMAT O\'G\'LI',
      dateOfBirth: '2012-10-29',
      phone: '+998998671747',
      password: '1Cde3fG5h',
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
    console.log(`\n✅ Year 9 KS 3- Said Ahmad Siddiqiy Ajziy class and students seeding completed successfully!`);
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
