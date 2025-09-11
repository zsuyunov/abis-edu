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
  console.log('🌱 Starting Year 8 KS 3-Fayzulla Xo\'jayev class and students seeding...');

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
    where: { name: 'Year 8 KS 3-Fayzulla Xo\'jayev' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20, // Number of students in the data
    },
    create: {
      name: 'Year 8 KS 3-Fayzulla Xo\'jayev',
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
      studentId: 'S61904',
      lastName: 'ABDUKARIMOVA',
      firstName: 'ZEBO XAYRULLA QIZI',
      dateOfBirth: '2013-09-30',
      phone: '+998909749999',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28571',
      lastName: 'ARMAN',
      firstName: 'ASMA',
      dateOfBirth: '2014-01-11',
      phone: '+998909175445',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S94628',
      lastName: 'ARMAN',
      firstName: 'MUSTAFA',
      dateOfBirth: '2013-01-27',
      phone: '+998908109000',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73049',
      lastName: 'ARMAN',
      firstName: 'ZIUKHAL',
      dateOfBirth: '2013-01-27',
      phone: '+998908109000',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15793',
      lastName: 'AXMAD',
      firstName: 'NASIR ARSALAN ABDUL SAMAD',
      dateOfBirth: '2013-12-10',
      phone: '+998909175445',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S80246',
      lastName: 'SHAMSIDDINOVA',
      firstName: 'SOLIHA ZAYNIDDIN QIZI',
      dateOfBirth: '2013-03-13',
      phone: '+998970025404',
      password: '7Mno9pQ1r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S53917',
      lastName: 'SHERQULOVA',
      firstName: 'E`ZOZAXON SHERZOD QIZI',
      dateOfBirth: '2013-11-09',
      phone: '+998971390888',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S68402',
      lastName: 'XOLMAMATOV',
      firstName: 'AHRORBEK AKBAR O`G`LI',
      dateOfBirth: '2013-04-04',
      phone: '+998912132388',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S27189',
      lastName: 'ELCHINBEKOVA',
      firstName: 'ZILOLA NARIMONBEK QIZI',
      dateOfBirth: '2014-03-23',
      phone: '+998909878184',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S45620',
      lastName: 'ABDURASHIDOVA',
      firstName: 'AZIZA BAHODIROVNA',
      dateOfBirth: '2013-07-24',
      phone: '+998909404846',
      password: '5Klm7nO9p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S98371',
      lastName: 'RUSTAMOVA',
      firstName: 'SAMIYA MA`RUF QIZI',
      dateOfBirth: '2013-07-22',
      phone: '+998901313900',
      password: '2Qrs4tU6v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61059',
      lastName: 'RASULOV',
      firstName: 'NURMUHAMMAD RUSTAMJONOVICH',
      dateOfBirth: '2014-05-14',
      phone: '+998917750000',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S72840',
      lastName: 'SOBIROVA',
      firstName: 'FARZONAXON PO`LATOVNA',
      dateOfBirth: '2013-07-01',
      phone: '+998996477612',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15937',
      lastName: 'ALENDAR',
      firstName: 'MERT LATIF OGLU',
      dateOfBirth: '2014-05-16',
      phone: '+998900434646',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S48207',
      lastName: 'ARMAN',
      firstName: 'MOKHAMMAD MURTAZA',
      dateOfBirth: '2014-11-20',
      phone: '+998938104390',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S69318',
      lastName: 'HIOSHIMOVA',
      firstName: 'MUXSINA MUZAFFAROVNA',
      dateOfBirth: '2013-10-15',
      phone: '+998900012908',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S82549',
      lastName: 'XUDOYSHUKUROV',
      firstName: 'OTAJON',
      dateOfBirth: '2013-07-01',
      phone: '+998909350045',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S17653',
      lastName: 'BAXRIDDINOV',
      firstName: 'AMIRBEK',
      dateOfBirth: '2015-08-05',
      phone: '+998976700001',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S83921',
      lastName: 'FAZLIDDINOV',
      firstName: 'MUHAMMADSODIQ XUSNIDDIN OGLI',
      dateOfBirth: '2013-08-15',
      phone: '+998977275155',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S50278',
      lastName: 'BEGALIYEV',
      firstName: 'MUSTAFA FARXODJON O\'G\'LI',
      dateOfBirth: '2025-10-12',
      phone: '+998977275156',
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
    console.log(`\n✅ Year 8 KS 3-Fayzulla Xo'jayev class and students seeding completed successfully!`);
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
