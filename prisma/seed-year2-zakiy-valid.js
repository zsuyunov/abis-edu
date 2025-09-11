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
  console.log('🌱 Starting Year 2 KS 1- Zakiy Valid class and students seeding...');

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
    where: { name: 'Year 2 KS 1- Zakiy Valid' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22, // Number of students in the data
    },
    create: {
      name: 'Year 2 KS 1- Zakiy Valid',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S86263',
      lastName: 'UMAROV',
      firstName: 'MUHAMMADXO\'JA',
      dateOfBirth: '2020-01-10',
      phone: '+998976831111',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73973',
      lastName: 'ALEMDAROGLU',
      firstName: 'GULCE LATIF',
      dateOfBirth: '2019-12-31',
      phone: '+998900434646',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51861',
      lastName: 'USMONOV',
      firstName: 'ABDULLOX QOBILJON O\'G\'LI',
      dateOfBirth: '2019-01-21',
      phone: '+998954448080',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67565',
      lastName: 'HIKMATULLAYEV',
      firstName: 'ZARNIGOR AZIZBEKOVNA',
      dateOfBirth: '2019-01-04',
      phone: '+998999661529',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39294',
      lastName: 'RASULOVA',
      firstName: 'SAMIRA BEKZODOVNA',
      dateOfBirth: '2019-06-28',
      phone: '+998900210770',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95745',
      lastName: 'NASSIRI',
      firstName: 'AMIRPASHA NEJAD',
      dateOfBirth: '2019-11-15',
      phone: '+998938120680',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61442',
      lastName: 'JO\'RABOYEV',
      firstName: 'ISMOIL AXMAD O\'G\'LI',
      dateOfBirth: '2019-11-08',
      phone: '+998998375044',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28069',
      lastName: 'MIRSAIDOVA',
      firstName: 'MUSLIMA',
      dateOfBirth: '2019-01-22',
      phone: '+998995253838',
      password: '7Mno9pQ1r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74632',
      lastName: 'ALIMOVA',
      firstName: 'FERUZA RAHMATULLA QIZI',
      dateOfBirth: '2019-08-08',
      phone: '+998977229195',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89360',
      lastName: 'NISHONBOYEV',
      firstName: 'AMIRXON XURSHID QIZI',
      dateOfBirth: '2019-01-10',
      phone: '+998903173333',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52211',
      lastName: 'MIRAXMATOV',
      firstName: 'MUHAMMADAMIN',
      dateOfBirth: '2019-02-13',
      phone: '+998903173334',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67566',
      lastName: 'VOHIDOV',
      firstName: 'ABDULBOSIT ABDULLOX O\'G\'LI',
      dateOfBirth: '2019-06-05',
      phone: '+998977672614',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S32000',
      lastName: 'XAMIDULLAYEVA',
      firstName: 'RAYYONA XONDAMIR QIZI',
      dateOfBirth: '2019-06-29',
      phone: '+998903200707',
      password: '2Qrs4tU6v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84309',
      lastName: 'XAMIDULLAYEVA',
      firstName: 'FARZONA XONDAMIR QIZI',
      dateOfBirth: '2019-06-02',
      phone: '+998903200707',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15761',
      lastName: 'XOLMAXMATOV',
      firstName: 'AXMAD ABDUHALIL O\'G\'LI',
      dateOfBirth: '2019-04-04',
      phone: '+998770040603',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73071',
      lastName: 'IBROHIMOVA',
      firstName: 'SOFIYA AKMAL QIZI',
      dateOfBirth: '2019-08-08',
      phone: '+998903542202',
      password: '7Ijk9lM1n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49534',
      lastName: 'FOUDEH',
      firstName: 'OMAR',
      dateOfBirth: '2019-01-31',
      phone: '+998998426443',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86264',
      lastName: 'QOBILJONOV',
      firstName: 'MUHAMMAD YUSUF FARXOD O\'G\'LI',
      dateOfBirth: '2019-09-30',
      phone: '+998993222112',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73974',
      lastName: 'ISLOMXO\'JAYEV',
      firstName: 'ABDURAHMON',
      dateOfBirth: '2019-01-15',
      phone: '+998993222113',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51862',
      lastName: 'ISMATOV',
      firstName: 'SHOVKAT ISMAILOVICH',
      dateOfBirth: '2019-01-16',
      phone: '+998936717000',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67567',
      lastName: 'BERDIYEV',
      firstName: 'ALISHER ABROROVICH',
      dateOfBirth: '2019-02-19',
      phone: '+998977635508',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39295',
      lastName: 'NOSIROV',
      firstName: 'MIRSOLIX XASANOVICH',
      dateOfBirth: '2019-01-03',
      phone: '+998977635509',
      password: '9Stu1vW3x',
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
    console.log(`\n✅ Year 2 KS 1- Zakiy Valid class and students seeding completed successfully!`);
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
