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
  console.log('🌱 Starting Year 2 KS 1- Abdurauf Fitrat class and students seeding...');

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
    where: { name: 'Year 2 KS 1- Abdurauf Fitrat' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20, // Number of students in the data
    },
    create: {
      name: 'Year 2 KS 1- Abdurauf Fitrat',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S95746',
      lastName: 'BOTIRJONOV',
      firstName: 'MUHAMMADZIYO ALIMARDON O\'G\'LI',
      dateOfBirth: '2020-10-21',
      phone: '+998950035345',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61443',
      lastName: 'GANIYEVA',
      firstName: 'GULZODA BAXTIYOROVNA',
      dateOfBirth: '2020-03-20',
      phone: '+998907884855',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28070',
      lastName: 'ISHMUHAMMEDOV',
      firstName: 'MUHAMMAD XOLID ABDULADJON O\'G\'LI',
      dateOfBirth: '2020-09-21',
      phone: '+998946072716',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74633',
      lastName: 'FARXODOV',
      firstName: 'IMRON ISLOMOVICH',
      dateOfBirth: '2020-09-05',
      phone: '+998950515555',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89361',
      lastName: 'USMONOVA',
      firstName: 'OMINA QOBILJON QIZI',
      dateOfBirth: '2020-08-23',
      phone: '+998954448080',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52212',
      lastName: 'DOLIMJONOVA',
      firstName: 'SOFIYA FARRUXBEK QIZI',
      dateOfBirth: '2020-08-07',
      phone: '+998996384706',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67568',
      lastName: 'ISHQUVATOV',
      firstName: 'MUHAMMADALI SHOHRUZ O\'G\'LI',
      dateOfBirth: '2020-03-26',
      phone: '+998913159093',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S32001',
      lastName: 'BAXROMOV',
      firstName: 'IBROXIMBEK SADULLA O\'G\'LI',
      dateOfBirth: '2020-10-05',
      phone: '+998974539199',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84310',
      lastName: 'KARIMBERDIYEV',
      firstName: 'MUXAMMAD JAMSHID O\'G\'LI',
      dateOfBirth: '2020-10-15',
      phone: '+998977379931',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15762',
      lastName: 'ISLOMOV',
      firstName: 'SALOHIDDIN RUSTAMOVICH',
      dateOfBirth: '2019-01-30',
      phone: '+998973302302',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73072',
      lastName: 'XODJAYEVA',
      firstName: 'SAMINAXON FARXODOVNA',
      dateOfBirth: '2019-09-14',
      phone: '+998935888585',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49535',
      lastName: 'ALISHEROV',
      firstName: 'ANVAR',
      dateOfBirth: '2019-03-30',
      phone: '+998971173444',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86265',
      lastName: 'ANVARXONOV',
      firstName: 'ABUBAKRXON',
      dateOfBirth: '2019-11-11',
      phone: '+998992599595',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73975',
      lastName: 'SHARAFUTDINOVA',
      firstName: 'POKIZA FAZLIDDIN QIZI',
      dateOfBirth: '2019-05-14',
      phone: '+998941804444',
      password: '3Yza5bC7d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51863',
      lastName: 'USMONOVA',
      firstName: 'YASINAXON AZIZJON QIZI',
      dateOfBirth: '2019-01-29',
      phone: '+998977539992',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67569',
      lastName: 'ABDURAHIMOV',
      firstName: 'MUHAMMAD YAXYO ALISHER O\'G\'LI',
      dateOfBirth: '2019-08-02',
      phone: '+998331434444',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39296',
      lastName: 'ANVAROV',
      firstName: 'MIRONSHOX ERKIN O\'G\'LI',
      dateOfBirth: '2019-06-15',
      phone: '+998904886642',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95747',
      lastName: 'BAHTIYAROV',
      firstName: 'YUSUFXON SHAXRIYOR O\'G\'LI',
      dateOfBirth: '2019-11-15',
      phone: '+998904886643',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61444',
      lastName: 'GIYOSOV',
      firstName: 'MUXAMMAD DONIYOR O\'G\'LI',
      dateOfBirth: '2019-11-16',
      phone: '+998904886644',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28071',
      lastName: 'XOLMATOV',
      firstName: 'IBROXIM AKBAR O\'G\'LI',
      dateOfBirth: '2020-04-02',
      phone: '+998885718588',
      password: '7Ijk9lM1n',
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
    console.log(`\n✅ Year 2 KS 1- Abdurauf Fitrat class and students seeding completed successfully!`);
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
