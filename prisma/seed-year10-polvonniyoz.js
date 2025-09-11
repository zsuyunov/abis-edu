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
  console.log('🌱 Starting Year 10 KS 4-Polvonniyoz hoji Yusupov class and students seeding...');

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

  // Create the class "Year 10 KS 4-Polvonniyoz hoji Yusupov"
  const classData = {
    name: 'Year 10 KS 4-Polvonniyoz hoji Yusupov',
    capacity: 22, // Number of students in the provided data
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
      studentId: 'S72468',
      lastName: 'AKBAROV',
      firstName: 'IBROHIM BAHODIR O\'G\'LI',
      dateOfBirth: '2011-04-30',
      phone: '+998977770747',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39125',
      lastName: 'ALDABERGEN',
      firstName: 'YUSUF JANATBEK ULI',
      dateOfBirth: '2010-12-08',
      phone: '+998501016118',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S85693',
      lastName: 'ASROROVA',
      firstName: 'SHAHRUZA ALIYEVNA',
      dateOfBirth: '2012-08-14',
      phone: '+998903479021',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S41907',
      lastName: 'AZIMOV',
      firstName: 'ASRORXON MAXMUD O\'G\'LI',
      dateOfBirth: '2011-08-07',
      phone: '+998933960060',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S97254',
      lastName: 'BOTIRJONOV',
      firstName: 'ABDULAZIZ ALIMARDON O\'G\'LI',
      dateOfBirth: '2012-09-18',
      phone: '+998950035345',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S63821',
      lastName: 'HABIBULLAYEV',
      firstName: 'IBROHIM DILSHOD O\'G\'LI',
      dateOfBirth: '2012-03-20',
      phone: '+998998166000',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28576',
      lastName: 'KURBANOV',
      firstName: 'ASADBEK OTABEK O\'G\'LI',
      dateOfBirth: '2012-01-26',
      phone: '+998974433223',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S90134',
      lastName: 'SHAMSUDDINOV',
      firstName: 'ABDURAHMON ZAYNIDDIN O\'G\'LI',
      dateOfBirth: '2011-02-24',
      phone: '+998970025404',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S54789',
      lastName: 'UMAROVA',
      firstName: 'MARYAMXON JAMSHIDXON QIZI',
      dateOfBirth: '2011-11-28',
      phone: '+998998172829',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S16302',
      lastName: 'ABDUSAMADOV',
      firstName: 'JAVOXIRBEK XASAN O\'G\'LI',
      dateOfBirth: '2012-02-19',
      phone: '+998909870107',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73048',
      lastName: 'AXMAD',
      firstName: 'NASIR XAMZA XADJI ABDUL SAMAD',
      dateOfBirth: '2011-12-10',
      phone: '+998909175445',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S48295',
      lastName: 'AZIMOV',
      firstName: 'SHERMUHAMMAD SHERZOD O\'G\'LI',
      dateOfBirth: '2011-10-04',
      phone: '+998909884407',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S81926',
      lastName: 'ER',
      firstName: 'GEYLIN BILGE',
      dateOfBirth: '2012-05-28',
      phone: '+998337311745',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S65470',
      lastName: 'MURODBOYEV',
      firstName: 'KAMRONBEK UMIDJON O\'G\'LI',
      dateOfBirth: '2011-09-23',
      phone: '+998909350305',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S30718',
      lastName: 'NODIRJONOV',
      firstName: 'UMAR ABDULLOH O\'G\'LI',
      dateOfBirth: '2011-07-27',
      phone: '+998960801250',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S97531',
      lastName: 'TORA',
      firstName: 'HABIBULLOH',
      dateOfBirth: '2012-05-31',
      phone: '+998999822563',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S54186',
      lastName: 'XABIBULLAYEVA',
      firstName: 'OMINA SHERZOD QIZI',
      dateOfBirth: '2011-11-20',
      phone: '+998911636776',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S20874',
      lastName: 'XAMIDULLAYEV',
      firstName: 'ZIKIRILLOH XONDAMIR O\'G\'LI',
      dateOfBirth: '2012-09-21',
      phone: '+998993470000',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S69325',
      lastName: 'ALTUNDAL',
      firstName: 'ASIM ZEKERIYA',
      dateOfBirth: '2012-07-23',
      phone: '+998903491363',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S13679',
      lastName: 'DADAMUHAMMAD',
      firstName: 'SHARIFAXON JAHONGIR QIZI',
      dateOfBirth: '2011-08-15',
      phone: '+998903520205',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86240',
      lastName: 'MAXMUDOVA',
      firstName: 'KUMUSH TOXIR QIZI',
      dateOfBirth: '2011-10-22',
      phone: '+998933851042',
      password: '8Abc0dE2f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S47915',
      lastName: 'ARMAN',
      firstName: 'MARVA',
      dateOfBirth: '2010-06-29',
      phone: '+998938104390',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S92468',
      lastName: 'NEMATULLAYEVA',
      firstName: 'OMINAXON JAXONGIROVNA',
      dateOfBirth: '2012-01-02',
      phone: '+998977228381',
      password: '2Mno4pQ6r',
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
  console.log(`   - Total processed: ${createdCount + errorCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} students could not be created due to duplicate Student IDs.`);
    console.log(`   Please update the student data with unique Student IDs and run the script again.`);
    console.log(`\nDetailed errors:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ Year 10 KS 4-Polvonniyoz hoji Yusupov class and students seeding completed successfully!');
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