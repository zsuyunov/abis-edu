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
  console.log('🌱 Starting Year 8 KS 3-Abduqodir Shakuriy class and students seeding...');

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
    where: { name: 'Year 8 KS 3-Abduqodir Shakuriy' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 19, // Number of students in the data
    },
    create: {
      name: 'Year 8 KS 3-Abduqodir Shakuriy',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 19,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S12946',
      lastName: 'BOQIYEVA',
      firstName: 'MUBINAXON SAHIB QIZI',
      dateOfBirth: '2013-10-13',
      phone: '+998959221500',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S87532',
      lastName: 'MANDO',
      firstName: 'YUSIF MAHMUD O`G`LI',
      dateOfBirth: '2013-09-12',
      phone: '+998946109792',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S64189',
      lastName: 'MURODOV',
      firstName: 'ABDUVALI MUROD O`G`LI',
      dateOfBirth: '2015-02-10',
      phone: '+998903166203',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S30257',
      lastName: 'MANDO',
      firstName: 'AMMAR MAXMUD O\'G\'LI',
      dateOfBirth: '2012-04-16',
      phone: '+998946109792',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S96840',
      lastName: 'USMANOVA',
      firstName: 'UMIDAXON AZIZJON QIZI',
      dateOfBirth: '2014-01-24',
      phone: '+998977539992',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S71523',
      lastName: 'YO\'LDOSHEVA',
      firstName: 'IZORA',
      dateOfBirth: '2013-04-23',
      phone: '+998999081183',
      password: '7Ijk9lM1n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S48296',
      lastName: 'AXMEDOVA',
      firstName: 'NIGINABONU RUSTAMOVNA',
      dateOfBirth: '2014-10-25',
      phone: '+998931830049',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S85927',
      lastName: 'NURILLAXO`JAYEV',
      firstName: 'IBRATILLAXO`JA LUTFILLA O`G`LI',
      dateOfBirth: '2014-08-01',
      phone: '+998998181661',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S37641',
      lastName: 'SHOMURADOV',
      firstName: 'AMIRXON AKMALJONOVICH',
      dateOfBirth: '2013-03-17',
      phone: '+998903573253',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S90328',
      lastName: 'TOXIRJONOVA',
      firstName: 'FAZLIYABONU ABDUVOXIDOVNA',
      dateOfBirth: '2013-06-14',
      phone: '+998974705005',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S54719',
      lastName: 'USMANOV',
      firstName: 'MUHAMMADAMIN SANJAROVICH',
      dateOfBirth: '2014-01-03',
      phone: '+998990400903',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S68253',
      lastName: 'MUXAMEDOV',
      firstName: 'ASLBEK ANVAROVICH',
      dateOfBirth: '2014-01-24',
      phone: '+998880098127',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S21984',
      lastName: 'AKBAROVA',
      firstName: 'MALIKA AKBAROVNA',
      dateOfBirth: '2013-08-15',
      phone: '+998991021888',
      password: '4Yza6bC8d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S76590',
      lastName: 'TURAKULOVA',
      firstName: 'SOFIYA BEKZODOVNA',
      dateOfBirth: '2013-12-05',
      phone: '+998908097887',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S43182',
      lastName: 'KOMILOV',
      firstName: 'MUHAMAD AKROMJON O\'GLI',
      dateOfBirth: '2013-12-25',
      phone: '+998909847282',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S59871',
      lastName: 'ASROROV',
      firstName: 'NURMUHAMMAD ALIJON O`G`LI',
      dateOfBirth: '2014-07-07',
      phone: '+998911334344',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S14267',
      lastName: 'YUNUSOVA',
      firstName: 'ZILNURA RAVSHAN QIZI',
      dateOfBirth: '2013-12-07',
      phone: '+998771001234',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S87539',
      lastName: 'SAIDOVA',
      firstName: 'MARYAM BAHODIR QIZI',
      dateOfBirth: '2013-09-26',
      phone: '+998909749998',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
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
    console.log(`\n✅ Year 8 KS 3-Abduqodir Shakuriy class and students seeding completed successfully!`);
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
