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
  console.log('🌱 Starting Year 3 KS 2- Munavvar Qori class and students seeding...');

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
    where: { name: 'Year 3 KS 2- Munavvar Qori' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 18, // Number of students in the data
    },
    create: {
      name: 'Year 3 KS 2- Munavvar Qori',
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
      studentId: 'S49532',
      lastName: 'AXMEDXODJAYEV',
      firstName: 'MUXAMMADXODJA ABDULAZIZXONOVICH',
      dateOfBirth: '2018-01-19',
      phone: '+998935390004',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86262',
      lastName: 'FAYZULLAYEV',
      firstName: 'HAFIZULLOX XAYRULLA O\'G\'LI',
      dateOfBirth: '2018-01-19',
      phone: '+998935009933',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73972',
      lastName: 'KADIROVA',
      firstName: 'SAODAT SHERALIYEVNA',
      dateOfBirth: '2018-10-20',
      phone: '+998990856079',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51860',
      lastName: 'SAYFUDINOV',
      firstName: 'IMRON MURODJON O\'G\'LI',
      dateOfBirth: '2018-07-28',
      phone: '+998903563636',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67563',
      lastName: 'XIDIROV',
      firstName: 'OTABEK ALISHEROVICH',
      dateOfBirth: '2018-09-09',
      phone: '+998901382200',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39293',
      lastName: 'XUDOYBERDIYEV',
      firstName: 'SAMIR SARVAROVICH',
      dateOfBirth: '2018-02-09',
      phone: '+998990520892',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95744',
      lastName: 'JAVLONOVA',
      firstName: 'MADINAXON JAMSHID QIZI',
      dateOfBirth: '2018-08-27',
      phone: '+998977342020',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61441',
      lastName: 'RUSTAMOV',
      firstName: 'MUXAMMADYUSUF',
      dateOfBirth: '2018-01-09',
      phone: '+998909893403',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28068',
      lastName: 'RASHIDOV',
      firstName: 'ABDURAXMON OTABEK O\'G\'LI',
      dateOfBirth: '2018-05-23',
      phone: '+998977275157',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74631',
      lastName: 'NURMATOVA',
      firstName: 'SHAXINA SHERZODBEK QIZI',
      dateOfBirth: '2018-04-18',
      phone: '+998909071991',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89359',
      lastName: 'FOZILOV',
      firstName: 'XUSAN ABDURAXMON O\'G\'LI',
      dateOfBirth: '2018-06-08',
      phone: '+998900459006',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52210',
      lastName: 'FOZILOV',
      firstName: 'XASAN ABDURAXMON O\'G\'LI',
      dateOfBirth: '2018-06-08',
      phone: '+998900459006',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67564',
      lastName: 'MUXAMEDOVA',
      firstName: 'HADICHABONU BOBUR QIZI',
      dateOfBirth: '2008-10-29',
      phone: '+998998838844',
      password: '2Mno4pQ6r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31999',
      lastName: 'XOLMUMINOVA',
      firstName: 'JAXONA ULUG\'BEKOVNA',
      dateOfBirth: '2018-12-31',
      phone: '+998901390909',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84308',
      lastName: 'TOLIPOVA',
      firstName: 'SAMIRA AZIZBEKOVNA',
      dateOfBirth: '2018-08-02',
      phone: '+998944330943',
      password: '4Yza6bC8d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15760',
      lastName: 'KOMILOVA',
      firstName: 'FARZONA DONIYOROVNA',
      dateOfBirth: '2019-01-28',
      phone: '+998910109909',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73070',
      lastName: 'MUMINJONOV',
      firstName: 'MUHAMMADYAHYO UMIDJONOVICH',
      dateOfBirth: '2018-06-19',
      phone: '+998998200760',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49533',
      lastName: 'TO\'LAGANOV',
      firstName: 'ABDURAXMON',
      dateOfBirth: '2018-06-20',
      phone: '+998998200761',
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
  console.log(`   - Total processed: ${studentsData.length}`);

  if (errorCount > 0) {
    console.warn(`\n⚠️  ${errorCount} students could not be created due to errors.`);
    console.log('\nDetailed errors:');
    errors.forEach((err, index) => console.log(`   ${index + 1}. ${err}`));
  } else {
    console.log(`\n✅ Year 3 KS 2- Munavvar Qori class and students seeding completed successfully!`);
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
