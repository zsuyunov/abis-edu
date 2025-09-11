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
  console.log('🌱 Starting Year 9 KS 3- Obidjon Mahmudov class and students seeding...');

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

  // Create the class "Year 9 KS 3- Obidjon Mahmudov"
  const classData = {
    name: 'Year 9 KS 3- Obidjon Mahmudov',
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
      studentId: 'S86429',
      lastName: 'ALDABERGEN',
      firstName: 'AMIRA JANATBEK QIZI',
      dateOfBirth: '2012-05-24',
      phone: '+998901879988',
      password: '5Klm7nO9p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S59136',
      lastName: 'NORSOATOV',
      firstName: 'TEMURBEK ULUG`BEKOVICH',
      dateOfBirth: '2013-07-29',
      phone: '+998977167733',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S32784',
      lastName: 'OLIMJONOV',
      firstName: 'YUSUF OBIDJON O\'G\'LI',
      dateOfBirth: '2012-11-22',
      phone: '+998977059350',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74018',
      lastName: 'RASULOV',
      firstName: 'ABDUA\'ZIM KUDRATILLA O\'G\'LI',
      dateOfBirth: '2012-07-17',
      phone: '+998933878727',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S18593',
      lastName: 'XIKMATOV',
      firstName: 'DONIYOR NAZIMDJAN O\'G\'LI',
      dateOfBirth: '2012-08-27',
      phone: '+998903175628',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S65207',
      lastName: 'TASHPULATOVA',
      firstName: 'IYMONA ZIYOVIDDINOVNA',
      dateOfBirth: '2012-08-28',
      phone: '+998903175629',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31945',
      lastName: 'ERGASHBOYEVA',
      firstName: 'MUSLIMA FARXOD QIZI',
      dateOfBirth: '2012-01-20',
      phone: '+998933400411',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S87612',
      lastName: 'MAXMUDJONOV',
      firstName: 'XURSHIDJON JAMSHIDJON O\'G\'LI',
      dateOfBirth: '2012-10-01',
      phone: '+998974402227',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S54389',
      lastName: 'ABDURAXMANOVA',
      firstName: 'ROBIYAXON BAXROMOVNA',
      dateOfBirth: '2013-06-04',
      phone: '+998998453381',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S19027',
      lastName: 'AKBAROVA',
      firstName: 'ODINAXON OTABEK QIZI',
      dateOfBirth: '2012-10-12',
      phone: '+998977275157',
      password: '2Mno4pQ6r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S72839',
      lastName: 'ERGASHEV',
      firstName: 'MUXAMMAD YUSUF YODGOR O\'G\'LI',
      dateOfBirth: '2016-02-20',
      phone: '+998933866776',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S46518',
      lastName: 'KAMALOV',
      firstName: 'IMRANBEK JASUROVICH',
      dateOfBirth: '2013-08-28',
      phone: '+998909579798',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89205',
      lastName: 'KARIMOVA',
      firstName: 'IMONA XAMZA QIZI',
      dateOfBirth: '2013-08-29',
      phone: '+998909361177',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61748',
      lastName: 'MIRAZIMOV',
      firstName: 'ABDURAHMON ABDULLAYEVICH',
      dateOfBirth: '2012-07-23',
      phone: '+998903702167',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S35492',
      lastName: 'MIRXAMIDOVA',
      firstName: 'FOTIMA MIRAXMAD QIZI',
      dateOfBirth: '2012-06-26',
      phone: '+998908085335',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S80916',
      lastName: 'NABIYEVA',
      firstName: 'SAMINA NABIJONOVNA',
      dateOfBirth: '2012-10-25',
      phone: '+998933950011',
      password: '6Wxy8zA0b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S27183',
      lastName: 'SAYFIDDINXO`JAYEV',
      firstName: 'KAMOLIDDIN JAMOLIDDINOVICH',
      dateOfBirth: '2013-06-29',
      phone: '+998998600010',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S64590',
      lastName: 'MANNANOV',
      firstName: 'ABDUMALIK MAXSUDOVICH',
      dateOfBirth: '2012-10-25',
      phone: '+998943062117',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S98237',
      lastName: 'DADAMUHAMMAD',
      firstName: 'ROBIYA JAHONGIR QIZI',
      dateOfBirth: '2012-12-24',
      phone: '+998903520205',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51864',
      lastName: 'OTAXONOV',
      firstName: 'IMRON IBROHIM O`G`LI',
      dateOfBirth: '2013-05-26',
      phone: '+998971305851',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S37691',
      lastName: 'ZAYNIDDINOV',
      firstName: 'AMIRXON FAZLIDDIN O\'G\'LI',
      dateOfBirth: '2012-12-19',
      phone: '+998977441391',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84027',
      lastName: 'SHAVKATOVA',
      firstName: 'MAFTUNA ULUG\'BEK QIZI',
      dateOfBirth: '2012-11-25',
      phone: '+998937576775',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S69315',
      lastName: 'ABDUMALIKOVA',
      firstName: 'GULNOZA VOHIDOVNA',
      dateOfBirth: '2013-06-05',
      phone: '+998911914778',
      password: '7Mno9pQ1r',
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
    console.log('\n✅ Year 9 KS 3- Obidjon Mahmudov class and students seeding completed successfully!');
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
