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
  console.log('🌱 Starting Year 11 KS 4-Usmon Xo\'ja class and students seeding...');

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

  // Create the class "Year 11 KS 4-Usmon Xo'ja"
  const classData = {
    name: 'Year 11 KS 4-Usmon Xo\'ja',
    capacity: 18, // Number of students in the provided data
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
      studentId: 'S23457',
      lastName: 'NIYAZOVA',
      firstName: 'ROZIYAXON SHERZODOVNA',
      dateOfBirth: '2011-04-18',
      phone: '+998977235555',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89012',
      lastName: 'XABIBULLAYEV',
      firstName: 'ISMOIL SHERZOD O\'G\'LI',
      dateOfBirth: '2010-10-21',
      phone: '+998911636776',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S45689',
      lastName: 'ARMAN',
      firstName: 'MODJIBRAXMAN YUNUS MOXAMMAD',
      dateOfBirth: '2011-04-02',
      phone: '+998909175445',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S12345',
      lastName: 'FATTAXOV',
      firstName: 'MUHAMMADQODIR ABDUVORIS O\'GLI',
      dateOfBirth: '2011-07-14',
      phone: '+998971604949',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67890',
      lastName: 'MIRKABILOV',
      firstName: 'MIRMAXMUD MIRKAMOL O\'G\'LI',
      dateOfBirth: '2010-04-18',
      phone: '+998998658733',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S24680',
      lastName: 'RASULOV',
      firstName: 'OQILXON MAXMUD O\'G\'LI',
      dateOfBirth: '2010-09-21',
      phone: '+998901766803',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S13579',
      lastName: 'XODJAYEV',
      firstName: 'SAIDXON FARXODOVICH',
      dateOfBirth: '2011-04-18',
      phone: '+998935888585',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S80246',
      lastName: 'AHMADJONOVA',
      firstName: 'ZIYODAXON AZIMJON QIZI',
      dateOfBirth: '2011-12-16',
      phone: '+998991804443',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S57913',
      lastName: 'SHUKRULLAYEV',
      firstName: 'AZIZXON ASADULLA O\'G\'LI',
      dateOfBirth: '2010-11-24',
      phone: '+998909972292',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S69124',
      lastName: 'SOBITXO\'JAYEV',
      firstName: 'SOBITXO\'JA UMIDXO\'JAYEVICH',
      dateOfBirth: '2011-01-06',
      phone: '+998909760595',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S35791',
      lastName: 'ALMOMEDOV',
      firstName: 'ALI MUHAMMAD ULUG\'BEKOVICH',
      dateOfBirth: '2010-06-07',
      phone: '+998998228596',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S82460',
      lastName: 'ZOYIROVA',
      firstName: 'MUBINA BAXTIYOR QIZI',
      dateOfBirth: '2011-01-22',
      phone: '+998903158037',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S46802',
      lastName: 'XAMIDOV',
      firstName: 'SAID BURXONIDDIN ZUXRIDDINOVICH',
      dateOfBirth: '2011-07-12',
      phone: '+998996039229',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S91357',
      lastName: 'SUVONOV',
      firstName: 'TEMUR BUNYODOVICH',
      dateOfBirth: '2011-09-07',
      phone: '+998909170009',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S64028',
      lastName: 'GELDI',
      firstName: 'MELIK CINAR',
      dateOfBirth: '2011-06-24',
      phone: '+998909211490',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S27593',
      lastName: 'XASANOVA',
      firstName: 'DILZODA SHUXRAT QIZI',
      dateOfBirth: '2010-10-03',
      phone: '+998994340004',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S80247',
      lastName: 'AHMED',
      firstName: 'FOTIMA',
      dateOfBirth: '2012-01-31',
      phone: '+998903381417',
      password: '4Yza6bC8d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15937',
      lastName: 'YO\'LDOSHYEV',
      firstName: 'MUHAMMADNO\'MON ABDULLO O\'G\'LI',
      dateOfBirth: '2011-02-11',
      phone: '+998908170076',
      password: '7Efg9hI1j',
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
    console.log('\n✅ Year 11 KS 4-Usmon Xo\'ja class and students seeding completed successfully!');
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