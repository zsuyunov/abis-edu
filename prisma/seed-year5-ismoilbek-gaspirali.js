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
  console.log('🌱 Starting Year 5 KS 2-Ismoilbek Gaspirali class and students seeding...');

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
    where: { name: 'Year 5 KS 2-Ismoilbek Gaspirali' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20, // Number of students in the data
    },
    create: {
      name: 'Year 5 KS 2-Ismoilbek Gaspirali',
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
      studentId: 'S31991',
      lastName: 'ANVARXONOVA',
      firstName: 'MUZAYYANAXON AKOBIRXONOVNA',
      dateOfBirth: '2017-08-05',
      phone: '+998992599595',
      password: '7Ijk9lM1n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84300',
      lastName: 'BAXTIYOROV',
      firstName: 'AYUBXON SHAXRIYOR O`G`LI',
      dateOfBirth: '2016-10-05',
      phone: '+998998738838',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15752',
      lastName: 'FATXULLAYEVA',
      firstName: 'OSIYO DILMUROD QIZI',
      dateOfBirth: '2016-12-03',
      phone: '+998998923009',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73062',
      lastName: 'G\'AYRATOVA',
      firstName: 'SOLIHA IMONA QIZI',
      dateOfBirth: '2016-02-24',
      phone: '+998909914939',
      password: '8Abc0dE2f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49525',
      lastName: 'KURBONOV',
      firstName: 'YUSUFBEK OTABEKOVICH',
      dateOfBirth: '2016-06-14',
      phone: '+998984433223',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86255',
      lastName: 'NIYAZOVA',
      firstName: 'SAFIYAXON',
      dateOfBirth: '2016-05-25',
      phone: '+998977235555',
      password: '2Mno4pQ6r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73965',
      lastName: 'SHOG`IYOSOVA',
      firstName: 'MO`MINA SHAVKATJON QIZI',
      dateOfBirth: '2016-05-22',
      phone: '+998970550579',
      password: '9Stu1vW3x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51853',
      lastName: 'SOBITOV',
      firstName: 'ALI MAXMUDJON O\'G\'LI',
      dateOfBirth: '2016-01-26',
      phone: '+998970550580',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67549',
      lastName: 'ERGASHBAYEV',
      firstName: 'MUHAMMADALI FARHOD O`G`LI',
      dateOfBirth: '2016-04-30',
      phone: '+998933400411',
      password: '7Efg9hI1j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39286',
      lastName: 'ISAKOVA',
      firstName: 'MALIKAXON JAXONGIROVNA',
      dateOfBirth: '2016-04-02',
      phone: '+998977759718',
      password: '0Klm2nO4p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95737',
      lastName: 'JALOLIDDINOVA',
      firstName: 'SAIDA OTABEK QIZI',
      dateOfBirth: '2016-09-06',
      phone: '+998974402110',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61434',
      lastName: 'MIRKABILOV',
      firstName: 'MIRAXMAD MIRKAMOL O`G`LI',
      dateOfBirth: '2016-04-18',
      phone: '+998998658733',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28061',
      lastName: 'TURAXANOVA',
      firstName: 'AZIZAXON OTABEK QIZI',
      dateOfBirth: '2016-04-04',
      phone: '+998977240887',
      password: '1Cde3fG5h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74624',
      lastName: 'USMONOVA',
      firstName: 'MUSLIMA',
      dateOfBirth: '2016-08-13',
      phone: '+998977329997',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89352',
      lastName: 'XUDOYBERDIYEV',
      firstName: 'IMRON SARVAROVICH',
      dateOfBirth: '2016-01-24',
      phone: '+998990520892',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52203',
      lastName: 'AZIMJONOVA',
      firstName: 'SAMIYA',
      dateOfBirth: '2016-05-31',
      phone: '+998881895156',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67550',
      lastName: 'NEMATULLAYEV',
      firstName: 'JAXONGIR ZABIXULLA O\'G\'LI',
      dateOfBirth: '2016-02-14',
      phone: '+998901198205',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31992',
      lastName: 'QOBILOV',
      firstName: 'ABDUL AZIZ QODIR O`G`LI',
      dateOfBirth: '2016-01-10',
      phone: '+998933890600',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84301',
      lastName: 'VOXIDOV',
      firstName: 'IBROXIM SHUKRIDDIN O\'G\'LI',
      dateOfBirth: '2017-07-17',
      phone: '+998930967612',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15753',
      lastName: 'UMARBEKOVA',
      firstName: 'FAIZA BAXROM QIZI',
      dateOfBirth: '2016-10-26',
      phone: '+998998464235',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73063',
      lastName: 'SAYIDNABIYEV',
      firstName: 'MUXAMMADZIYO SAYIDNABIYEVICH',
      dateOfBirth: '2016-01-09',
      phone: '+998900540040',
      password: '3Yza5bC7d',
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
    console.log(`\n✅ Year 5 KS 2-Ismoilbek Gaspirali class and students seeding completed successfully!`);
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
