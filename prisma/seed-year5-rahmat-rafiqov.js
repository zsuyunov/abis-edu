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
  console.log('🌱 Starting Year 5 KS 2-Rahmat Rafiqov class and students seeding...');

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
    where: { name: 'Year 5 KS 2-Rahmat Rafiqov' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 21, // Number of students in the data
    },
    create: {
      name: 'Year 5 KS 2-Rahmat Rafiqov',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 21,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S74622',
      lastName: 'ABDURAHIMOV',
      firstName: 'MUHAMMADYUSUF ALISHER O`G`LI',
      dateOfBirth: '2016-10-26',
      phone: '+998331334444',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89350',
      lastName: 'ABDURAXMONOVA',
      firstName: 'GULASAL JAXONGIR QIZI',
      dateOfBirth: '2016-09-03',
      phone: '+998946582505',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52201',
      lastName: 'BOTIROVA',
      firstName: 'MUBINA OYATILLA QIZI',
      dateOfBirth: '2016-03-08',
      phone: '+998974906660',
      password: '4Yza6bC8d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67546',
      lastName: 'NORSOATOVA',
      firstName: 'SHAHRUZA',
      dateOfBirth: '2016-06-26',
      phone: '+998977031255',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31990',
      lastName: 'RASHIDOV',
      firstName: 'DIYORBEK DONIYOROVICH',
      dateOfBirth: '2016-07-04',
      phone: '+998909630000',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84299',
      lastName: 'RASULOVA',
      firstName: 'KOMILA FARXADOVNA',
      dateOfBirth: '2016-07-16',
      phone: '+998909667274',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15751',
      lastName: 'XAMIDOVA',
      firstName: 'XADIJABONU ABDUKAHHOR QIZI',
      dateOfBirth: '2016-10-14',
      phone: '+998974437181',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73061',
      lastName: 'XODJAYEV',
      firstName: 'ALIXON FARXODOVICH',
      dateOfBirth: '2016-04-13',
      phone: '+998935888585',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49524',
      lastName: 'XOSHIMOVA',
      firstName: 'MO\'MINA MUZAFFAR QIZI',
      dateOfBirth: '2016-07-22',
      phone: '+998900012908',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86254',
      lastName: 'FAZLIDDINXO`JAYEVA',
      firstName: 'KOMILAXON JAMOLIDDINOVNA',
      dateOfBirth: '2016-06-19',
      phone: '+998977173323',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73964',
      lastName: 'AXMADJONOVA',
      firstName: 'MADINABONU ANVARJON QIZI',
      dateOfBirth: '2016-05-31',
      phone: '+998994477770',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51852',
      lastName: 'BOTIROVA',
      firstName: 'OMINAXON BEXZOD QIZI',
      dateOfBirth: '2016-08-15',
      phone: '+998977007327',
      password: '9Abc1dE3f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67547',
      lastName: 'JABBOROV',
      firstName: 'USMON OZOD O`G`LI',
      dateOfBirth: '2016-12-10',
      phone: '+998974504497',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39285',
      lastName: 'JO`RABOYEV',
      firstName: 'ABDULLOH AKMAL O`G`LI',
      dateOfBirth: '2016-01-04',
      phone: '+998971772255',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95736',
      lastName: 'KODIRJONOVA',
      firstName: 'MADINA NODIROVNA',
      dateOfBirth: '2016-09-23',
      phone: '+998973308855',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61433',
      lastName: 'SAIDOVA',
      firstName: 'MUSLIMA JAXONGIROVNA',
      dateOfBirth: '2016-04-22',
      phone: '+998900457373',
      password: '3Yza5bC7d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28060',
      lastName: 'ABDUG`ANIYEV',
      firstName: 'ISMOIL ABDULLO O`G`LI',
      dateOfBirth: '2016-09-22',
      phone: '+998974043757',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74623',
      lastName: 'ABDUMAJITOV',
      firstName: 'AHMADYOR SHAVKAT O`G`LI',
      dateOfBirth: '2016-04-27',
      phone: '+998974043758',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89351',
      lastName: 'SOBITXO`JAYEV',
      firstName: 'SAIDXO`JA UMIDXOJAYEVICH',
      dateOfBirth: '2016-10-14',
      phone: '+998909760595',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52202',
      lastName: 'CHINMATEE',
      firstName: 'AADYA MANDASMITA',
      dateOfBirth: '2025-07-30',
      phone: '+998996943444',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67548',
      lastName: 'SHUXRATOV',
      firstName: 'G`AYRAT FARXODOVICH',
      dateOfBirth: '2016-06-18',
      phone: '+998958373333',
      password: '4Cde6fG8h',
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
    console.log(`\n✅ Year 5 KS 2-Rahmat Rafiqov class and students seeding completed successfully!`);
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
