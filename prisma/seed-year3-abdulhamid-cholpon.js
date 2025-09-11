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
  console.log('🌱 Starting Year 3 KS 2- Abdulhamid Cholpon class and students seeding...');

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
    where: { name: 'Year 3 KS 2- Abdulhamid Cholpon' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20, // Number of students in the data
    },
    create: {
      name: 'Year 3 KS 2- Abdulhamid Cholpon',
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
      studentId: 'S31997',
      lastName: 'ASROROV',
      firstName: 'NURISLOM ALIO\'GLI',
      dateOfBirth: '2018-05-08',
      phone: '+998903479021',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84306',
      lastName: 'GANIYEVA',
      firstName: 'AYZADA BAXTIYOROVNA',
      dateOfBirth: '2018-11-27',
      phone: '+998907884855',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15758',
      lastName: 'KHABIBULLAYEVA',
      firstName: 'OSIYO',
      dateOfBirth: '2018-12-13',
      phone: '+998911636776',
      password: '7Ijk9lM1n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73068',
      lastName: 'KOMILJONOVA',
      firstName: 'YASMINA NE\'MATJON QIZI',
      dateOfBirth: '2018-06-02',
      phone: '+998996758016',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49531',
      lastName: 'MAMADJANOV',
      firstName: 'ABUBAKR YIGITALIYEVICH',
      dateOfBirth: '2018-09-11',
      phone: '+998909142002',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86261',
      lastName: 'RUZIBOYEV',
      firstName: 'MUXAMMADALI OYBEK O\'G\'LI',
      dateOfBirth: '2018-01-04',
      phone: '+998957373737',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73971',
      lastName: 'SULTONOV',
      firstName: 'MUSTAFO',
      dateOfBirth: '2018-04-14',
      phone: '+998977059350',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51859',
      lastName: 'BEKZOD',
      firstName: 'SUMYYA QIZI',
      dateOfBirth: '2018-09-09',
      phone: '+998977079021',
      password: '2Mno4pQ6r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67561',
      lastName: 'ALDABERGEN',
      firstName: 'HADICHA',
      dateOfBirth: '2018-05-20',
      phone: '+998501016118',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39292',
      lastName: 'NIMATXONOV',
      firstName: 'ASATXON',
      dateOfBirth: '2018-06-09',
      phone: '+998935808787',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95743',
      lastName: 'UMAROVA',
      firstName: 'NURIYA',
      dateOfBirth: '2018-08-15',
      phone: '+998330405555',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61440',
      lastName: 'RAXBAROV',
      firstName: 'BURXON NODIRBEKOVICH',
      dateOfBirth: '2018-06-29',
      phone: '+998947524060',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28067',
      lastName: 'DORVISH',
      firstName: 'MEHRSAM SHAHAB',
      dateOfBirth: '2018-12-13',
      phone: '+998909491117',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74630',
      lastName: 'SAYIDNABIYEV',
      firstName: 'SAYIDISLOMBEK SAYIDNABIYEVICH',
      dateOfBirth: '2017-09-18',
      phone: '+998900540040',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89358',
      lastName: 'AXBORXO\'JAYEV',
      firstName: 'USMON BOTIR O\'G\'LI',
      dateOfBirth: '2018-07-16',
      phone: '+998908109001',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52209',
      lastName: 'ARMAN',
      firstName: 'MASLKH',
      dateOfBirth: '2018-02-23',
      phone: '+998908109000',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67562',
      lastName: 'IBROHIMOVA',
      firstName: 'SAMIYA AKMAL QIZI',
      dateOfBirth: '2018-07-11',
      phone: '+998903542202',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31998',
      lastName: 'KARIMBERDIYEVA',
      firstName: 'MUBINA',
      dateOfBirth: '2018-07-12',
      phone: '+998934659931',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84307',
      lastName: 'SULTONOV',
      firstName: 'IMRON',
      dateOfBirth: '2018-07-13',
      phone: '+998934659932',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15759',
      lastName: 'SULTONOV',
      firstName: 'MUSTAFO',
      dateOfBirth: '2018-07-14',
      phone: '+998977756584',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73069',
      lastName: 'ERGASHBEKOV',
      firstName: 'DILMUROD',
      dateOfBirth: '2018-10-21',
      phone: '+998977756585',
      password: '7Mno9pQ1r',
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
    console.log(`\n✅ Year 3 KS 2- Abdulhamid Cholpon class and students seeding completed successfully!`);
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
