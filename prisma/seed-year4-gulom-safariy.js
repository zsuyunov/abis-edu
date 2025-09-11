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
  console.log('🌱 Starting Year 4 KS 2-G\'ulom Safariy class and students seeding...');

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
    where: { name: 'Year 4 KS 2-G\'ulom Safariy' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22, // Number of students in the data
    },
    create: {
      name: 'Year 4 KS 2-G\'ulom Safariy',
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
      studentId: 'S74627',
      lastName: 'BOTIRJONOVA',
      firstName: 'SAKINA ALMARDON QIZI',
      dateOfBirth: '2017-06-06',
      phone: '+998950035345',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89355',
      lastName: 'JAVLONOVA',
      firstName: 'ZARIFAXON JAMSHID QIZI',
      dateOfBirth: '2017-07-04',
      phone: '+998977342020',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52206',
      lastName: 'MUSTAFA',
      firstName: 'RAED JOUDAH WISHHAH',
      dateOfBirth: '2017-09-24',
      phone: '+998947888382',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67556',
      lastName: 'NABIYEVA',
      firstName: 'SAIDA NABIJONOVNA',
      dateOfBirth: '2017-04-09',
      phone: '+998933950011',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31995',
      lastName: 'RASHIDOV',
      firstName: 'IMRONBEK DONIYOROVICH',
      dateOfBirth: '2017-10-06',
      phone: '+998903493333',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84304',
      lastName: 'XUSNITDINOV',
      firstName: 'UMAR MURODJON O`G`LI',
      dateOfBirth: '2017-03-14',
      phone: '+998909369226',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15756',
      lastName: 'YUNUSOV',
      firstName: 'SAIDA`LO RAVSHAN O`G`LI',
      dateOfBirth: '2017-05-26',
      phone: '+998935777735',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73066',
      lastName: 'MAXKAMOVA',
      firstName: 'XADICHA AXMAD QIZI',
      dateOfBirth: '2017-10-11',
      phone: '+998909727027',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49529',
      lastName: 'ABDUKAYUMOV',
      firstName: 'MUHAMMAD SODIQ KAXRAMON O`G`LI',
      dateOfBirth: '2017-08-21',
      phone: '+998999397771',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86259',
      lastName: 'DILSHODOV',
      firstName: 'AHMADJON DILMUROD O`G`LI',
      dateOfBirth: '2017-05-17',
      phone: '+998971846666',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73969',
      lastName: 'KUDRATOV',
      firstName: 'IMRONBEK BEKZODOVICH',
      dateOfBirth: '2017-07-07',
      phone: '+998999916100',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51857',
      lastName: 'MANDO',
      firstName: 'YAKOUB MAXMUD O`G`LI',
      dateOfBirth: '2017-02-19',
      phone: '+998946109792',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67557',
      lastName: 'MAXMUDOV',
      firstName: 'BEHRUZ AMINBAYEVICH',
      dateOfBirth: '2017-05-07',
      phone: '+998972210069',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39290',
      lastName: 'RASHITOV',
      firstName: 'ABDURAHMONXON ADXAM O`G`LI',
      dateOfBirth: '2017-11-16',
      phone: '+998988888800',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95741',
      lastName: 'SIROJIDDINOV',
      firstName: 'MUHAMMADSODIQ ZAHRIDDIN O`G`LI',
      dateOfBirth: '2016-07-02',
      phone: '+998903747213',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61438',
      lastName: 'TURABOV',
      firstName: 'ABDURAZZOQ RAVSHAN O`G`LI',
      dateOfBirth: '2017-01-25',
      phone: '+998998160468',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28065',
      lastName: 'USMANOV',
      firstName: 'ABDURAHMON OLIMOVICH',
      dateOfBirth: '2017-10-17',
      phone: '+998998885231',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74628',
      lastName: 'RAVSHANBEKOV',
      firstName: 'MUHAMMADUMAR SHUXRATBEKOVICH',
      dateOfBirth: '2017-01-03',
      phone: '+998903211264',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89356',
      lastName: 'XAMIDULLAYEV',
      firstName: 'MUHAMMAD YUSUF SHOHRUH O`G`LI',
      dateOfBirth: '2017-03-29',
      phone: '+998903200707',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52207',
      lastName: 'XOJISUNNAT',
      firstName: 'UMAR JAXONGIR O`G`LI',
      dateOfBirth: '2017-02-08',
      phone: '+998903520205',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67558',
      lastName: 'USANOV',
      firstName: 'USMON',
      dateOfBirth: '2018-01-03',
      phone: '+998771142428',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31996',
      lastName: 'TOSHBOYEVA',
      firstName: 'MASHHURA NURALI QIZI',
      dateOfBirth: '2017-01-09',
      phone: '+998990011410',
      password: '4Yza6bC8d',
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
    console.log(`\n✅ Year 4 KS 2-G'ulom Safariy class and students seeding completed successfully!`);
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
