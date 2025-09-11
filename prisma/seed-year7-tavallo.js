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
  console.log('🌱 Starting Year 7 KS 3-Tavallo class and students seeding...');

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
    where: { name: 'Year 7 KS 3-Tavallo' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22, // Number of students in the data
    },
    create: {
      name: 'Year 7 KS 3-Tavallo',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S72850',
      lastName: 'ABDUQODIROVA',
      firstName: 'SABINA ABDUMUTAL QIZI',
      dateOfBirth: '2013-11-16',
      phone: '+998935344002',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39281',
      lastName: 'ABDURAXMONOV',
      firstName: 'AKBARSHOX BOBIR O`G`LI',
      dateOfBirth: '2015-02-24',
      phone: '+998998204114',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95732',
      lastName: 'JO`RABOYEV',
      firstName: 'MUHAMMAD AXMAD O`G`LI',
      dateOfBirth: '2014-08-14',
      phone: '+998998375044',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61429',
      lastName: 'JO`RAYEVA',
      firstName: 'OMINA MUXIDDIN QIZI',
      dateOfBirth: '2014-08-18',
      phone: '+998974779996',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28056',
      lastName: 'MEMMADZADE',
      firstName: 'ZEBULLA KERIMULLA O`G`LU',
      dateOfBirth: '2015-12-02',
      phone: '+998903708184',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74619',
      lastName: 'ORIFXONOVA',
      firstName: 'SOLIHA ODILBEK QIZI',
      dateOfBirth: '2015-10-28',
      phone: '+998974500230',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89347',
      lastName: 'SAIDOV',
      firstName: 'BEKZOD JAXONGIROVICH',
      dateOfBirth: '2024-06-19',
      phone: '+998909100707',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52198',
      lastName: 'ULUG`BEKOVA',
      firstName: 'ZILOLA BEHZOD QIZI',
      dateOfBirth: '2014-09-26',
      phone: '+998993401124',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67540',
      lastName: 'UMAROVA',
      firstName: 'ZAHIYDAXON JAMSHIDXON QIZI',
      dateOfBirth: '2014-08-01',
      phone: '+998998172829',
      password: '0Klm2nO4p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31987',
      lastName: 'ZOKIROV',
      firstName: 'ASADBEK SHERZODOVICH',
      dateOfBirth: '2014-06-01',
      phone: '+998977019003',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84296',
      lastName: 'MUXAMEDKARIMOVA',
      firstName: 'SAMINAXON ALISHEROVNA',
      dateOfBirth: '2015-02-04',
      phone: '+998977266066',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15748',
      lastName: 'KAMILOVA',
      firstName: 'ASALYA',
      dateOfBirth: '2014-09-08',
      phone: '+998977058020',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73058',
      lastName: 'VOHIDJONOVA',
      firstName: 'OMINAXON QOSIMJON QIZI',
      dateOfBirth: '2014-09-06',
      phone: '+998909108734',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49521',
      lastName: 'RASHIDOV',
      firstName: 'JOBIRXON ZIYOVIDDINXONOVICH',
      dateOfBirth: '2014-07-26',
      phone: '+998900000190',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86251',
      lastName: 'NIYAZOV',
      firstName: 'AKBARBEK AVAZBEK O\'G\'LI',
      dateOfBirth: '2014-02-22',
      phone: '+998971568837',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73961',
      lastName: 'ARIFJONOVA',
      firstName: 'SHAXRIZODA UTKUROVNA',
      dateOfBirth: '2014-10-22',
      phone: '+998974541507',
      password: '9Abc1dE3f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51849',
      lastName: 'NEMATULLAYEVA',
      firstName: 'MUSLIMA JAXONGIROVNA',
      dateOfBirth: '2017-07-24',
      phone: '+998977228381',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67541',
      lastName: 'BAXODIROV',
      firstName: 'MUHAMMAD YUSUF NODIR O`G`LI',
      dateOfBirth: '2015-05-07',
      phone: '+998909725793',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39282',
      lastName: 'TO`RAQULOV',
      firstName: 'MUHAMMADAMIN UTKIR O`G`LI',
      dateOfBirth: '2014-10-12',
      phone: '+998974043543',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95733',
      lastName: 'AZIMJONOV',
      firstName: 'MUHAMMADRIZO AZIZOVICH',
      dateOfBirth: '2014-08-12',
      phone: '+998331210777',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61430',
      lastName: 'FATTAXOV',
      firstName: 'XABIBULLOX ABDURAXMON O\'G\'LI',
      dateOfBirth: '2014-12-10',
      phone: '+998998445354',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28057',
      lastName: 'ABDUSALIMOVA',
      firstName: 'RAYHONA UMAR QIZI',
      dateOfBirth: '2015-12-24',
      phone: '+998882420707',
      password: '5Klm7nO9p',
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
    console.log(`\n✅ Year 7 KS 3-Tavallo class and students seeding completed successfully!`);
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
