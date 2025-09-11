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
  console.log('🌱 Starting Year 12 KS 5-Abdulla Avloniy class and students seeding...');

  // Verify branch with short name "85" exists
  const branch = await prisma.branch.findFirst({
    where: { shortName: '85' }
  });

  if (!branch) {
    console.error('❌ Branch with short name "85" not found. Please create branch with short name "85" first.');
    return;
  }

  console.log(`✅ Found branch: ${branch.shortName} (ID: ${branch.id})`);

  // Verify academic year 2025-2026 exists
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      name: '2025-2026'
    }
  });

  if (!academicYear) {
    console.error('❌ Academic year 2025-2026 not found. Please create academic year 2025-2026 first.');
    return;
  }

  console.log(`✅ Found academic year: ${academicYear.name} (ID: ${academicYear.id})`);

  // Create the class "Year 12 KS 5-Abdulla Avloniy"
  const classData = {
    name: 'Year 12 KS 5-Abdulla Avloniy',
    capacity: 14, // Number of students in the provided data
    branchId: branch.id,
    academicYearId: academicYear.id,
    language: ClassLanguage.ENGLISH,
    educationType: ClassEducationType.HIGH,
    status: ClassStatus.ACTIVE
  };

  const createdClass = await prisma.class.upsert({
    where: { name: classData.name },
    update: {},
    create: classData
  });

  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data from the provided records
  const studentsData = [
    {
      studentId: 'S91826',
      lastName: 'MEMMEDZADE',
      firstName: 'JELAL KERIMULLA O\'G\'LU',
      dateOfBirth: '2009-12-24',
      phone: '+998903708184',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S65409',
      lastName: 'SHUKURULLAYEV',
      firstName: 'IZZATILLA ASADULLA O\'G\'LI',
      dateOfBirth: '2009-09-29',
      phone: '+998909972292',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S29073',
      lastName: 'ALDABERGEN',
      firstName: 'ABDURAXMAN JANATBEK ULI',
      dateOfBirth: '2009-10-24',
      phone: '+998501016118',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S83756',
      lastName: 'UMAROV',
      firstName: 'JASURBEK RAHMATILLA O\'G\'LI',
      dateOfBirth: '2009-11-19',
      phone: '+998903190591',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S47120',
      lastName: 'RAXMATULLAYEV',
      firstName: 'ABDULVORIS BAXTIYOROVICH',
      dateOfBirth: '2009-10-20',
      phone: '+998903500777',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S10485',
      lastName: 'AKBAROV',
      firstName: 'UMARJON MUZAFFAROVICH',
      dateOfBirth: '2010-01-26',
      phone: '+998909880020',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S72839',
      lastName: 'MAXMUDJONOV',
      firstName: 'JAVOHIRJON JAMSHIDJON O\'G\'LI',
      dateOfBirth: '2010-03-21',
      phone: '+998974402227',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S38562',
      lastName: 'SAAD',
      firstName: 'TAREEN NIYAZI',
      dateOfBirth: '2007-03-31',
      phone: '+998908291434',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S94617',
      lastName: 'NIYAZOVA',
      firstName: 'RAYONAXON SHERZODOVNA',
      dateOfBirth: '2009-03-15',
      phone: '+998977235555',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S57280',
      lastName: 'ARMAN',
      firstName: 'MARYAM',
      dateOfBirth: '2011-01-01',
      phone: '+998909175445',
      password: '3Yza5bC7d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S21945',
      lastName: 'UZOQBERDIYEVA',
      firstName: 'ZEBO ABDURASULOVNA',
      dateOfBirth: '2010-01-06',
      phone: '+998977827677',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86301',
      lastName: 'YANG',
      firstName: 'YIYI',
      dateOfBirth: '2009-01-17',
      phone: '+998997670666',
      password: '5Klm7nO9p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49076',
      lastName: 'XAYDAROV',
      firstName: 'ABDURAXIM MAXAMADJANOVICH',
      dateOfBirth: '2010-09-04',
      phone: '+998948285272',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S12734',
      lastName: 'SAIDOV',
      firstName: 'MUXAMMAD MIRXOSILOVICH',
      dateOfBirth: '2009-10-05',
      phone: '+998946883858',
      password: '9Wxy1zA3b',
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
  console.log(`   - Total processed: ${createdCount + errorCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} students could not be created due to duplicate Student IDs.`);
    console.log(`   Please update the student data with unique Student IDs and run the script again.`);
    console.log(`\nDetailed errors:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ Year 12 KS 5-Abdulla Avloniy class and students seeding completed successfully!');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });