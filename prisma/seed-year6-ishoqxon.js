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
  console.log('🌱 Starting Year 6 KS 2- Is\'hoqxon To\'ra Ibrat class and students seeding...');

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
    where: { name: 'Year 6 KS 2- Is\'hoqxon To\'ra Ibrat' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 18, // Number of students in the data
    },
    create: {
      name: 'Year 6 KS 2- Is\'hoqxon To\'ra Ibrat',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 18,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S74620',
      lastName: 'ABDUJABBOROV',
      firstName: 'ANVARBEK ZAFAR O`G`LI',
      dateOfBirth: '2015-02-16',
      phone: '+998880083080',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89348',
      lastName: 'ABDULLAYEVA',
      firstName: 'RAYYONA MIRAXMAD QIZI',
      dateOfBirth: '2015-06-30',
      phone: '+998998401001',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52199',
      lastName: 'ABDURAXIMOVA',
      firstName: 'MUSLIMAXON ABDURASUL QIZI',
      dateOfBirth: '2015-11-14',
      phone: '+998946026113',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67542',
      lastName: 'AHMADJONOV',
      firstName: 'MUHAMMADAZIZ AZIMJON O`G`LI',
      dateOfBirth: '2015-09-22',
      phone: '+998991804443',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31988',
      lastName: 'AZIMOV',
      firstName: 'BILOL ZOKIRJON O`G`LI',
      dateOfBirth: '2015-03-16',
      phone: '+998910108300',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84297',
      lastName: 'JO`RABOYEV',
      firstName: 'YUSUF AXMAD O`G`LI',
      dateOfBirth: '2015-12-31',
      phone: '+998998900402',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15749',
      lastName: 'JO`RAYEVA',
      firstName: 'DILNURA MUXIDDIN QIZI',
      dateOfBirth: '2015-12-01',
      phone: '+998974779996',
      password: '8Abc0dE2f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73059',
      lastName: 'RAVSHANOVA',
      firstName: 'OSIYO RUSTAMJON QIZI',
      dateOfBirth: '2015-03-04',
      phone: '+998933891515',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49522',
      lastName: 'SAIDKARIMOV',
      firstName: 'SAYIDUMAR SAIDAKBAR O`G`LI',
      dateOfBirth: '2015-04-12',
      phone: '+998977176363',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86252',
      lastName: 'SHARIFJONOV',
      firstName: 'ABDUBORIY MUZAFFARJON O`G`LI',
      dateOfBirth: '2015-05-20',
      phone: '+998903266611',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73962',
      lastName: 'YO`LDOSHEV',
      firstName: 'ABDURAUF JAMOLIDDIN O`G`LI',
      dateOfBirth: '2015-03-16',
      phone: '+998999081183',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51850',
      lastName: 'XAMIDULLAYEV',
      firstName: 'ABUBAKIR XONDAMIR O\'G\'LI',
      dateOfBirth: '2015-02-09',
      phone: '+998903200707',
      password: '7Efg9hI1j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67543',
      lastName: 'SUVONOVA',
      firstName: 'SOLIHA BUNYODOVNA',
      dateOfBirth: '2015-12-16',
      phone: '+998909170009',
      password: '0Klm2nO4p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39283',
      lastName: 'BAXRIDDINOV',
      firstName: 'TEMUR ANVAR O\'G\'LI',
      dateOfBirth: '2015-08-05',
      phone: '+998976700001',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95734',
      lastName: 'QODIROVA',
      firstName: 'LOLA',
      dateOfBirth: '2015-01-01', // Default date since it was empty
      phone: '+998909080811',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61431',
      lastName: 'MUHAMMEDOVA',
      firstName: 'IMONA',
      dateOfBirth: '2015-04-05',
      phone: '+998998701520',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28058',
      lastName: 'ABDURAZIKOV',
      firstName: 'ABDUAZIZ AXROR O\'G\'LI',
      dateOfBirth: '2015-06-05',
      phone: '+998998892890',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74621',
      lastName: 'KOMILOV',
      firstName: 'ABDUHOLIQ AKROMJON O`G`LI',
      dateOfBirth: '2015-08-25',
      phone: '+998889847282',
      password: '5Opq7rS9t',
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
    console.log(`\n✅ Year 6 KS 2- Is'hoqxon To'ra Ibrat class and students seeding completed successfully!`);
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
