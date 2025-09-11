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
  console.log('🌱 Starting Year 4 KS 2-Ashurali Zohiriy class and students seeding...');

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
    where: { name: 'Year 4 KS 2-Ashurali Zohiriy' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 21, // Number of students in the data
    },
    create: {
      name: 'Year 4 KS 2-Ashurali Zohiriy',
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
      studentId: 'S39288',
      lastName: 'AXMEDOVA',
      firstName: 'IYMONA MIRKOMILOVNA',
      dateOfBirth: '2017-12-01',
      phone: '+998977887477',
      password: '4Ghi6jK8l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95739',
      lastName: 'ANVAROV',
      firstName: 'MUHAMMAD AMIRXON NODIRXON O`G`LI',
      dateOfBirth: '2017-10-02',
      phone: '+998950000018',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61436',
      lastName: 'DILSHODBEKOVA',
      firstName: 'DURDONA DILMUROD QIZI',
      dateOfBirth: '2017-01-07',
      phone: '+998999078818',
      password: '0Stu2vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28063',
      lastName: 'TORAKULOV',
      firstName: 'SALIMBEK BEKZODOVICH',
      dateOfBirth: '2017-06-29',
      phone: '+998908097887',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74626',
      lastName: 'RASULOVA',
      firstName: 'SOLIHA BEKZODOVNA',
      dateOfBirth: '2017-09-02',
      phone: '+998900210770',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89354',
      lastName: 'XOLMATOV',
      firstName: 'XOJIAKBAR ANVARJON O\'G\'LI',
      dateOfBirth: '2017-12-23',
      phone: '+998900210771',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52205',
      lastName: 'ISAKDJANOVA',
      firstName: 'LEYLA RUSTAMOVNA',
      dateOfBirth: '2017-01-20',
      phone: '+998973339797',
      password: '2Qrs4tU6v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67554',
      lastName: 'KOSTINA',
      firstName: 'ANFISA DMITRIYEVNA',
      dateOfBirth: '2017-11-25',
      phone: '+998978306747',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31994',
      lastName: 'ALLABERGEN',
      firstName: 'IBRAGIM JANATBEKULI',
      dateOfBirth: '2016-11-16',
      phone: '+998501016118',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84303',
      lastName: 'ANVAROV',
      firstName: 'FIRDAVS ERKIN O\'G\'LI',
      dateOfBirth: '2017-08-21',
      phone: '+998904886642',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15755',
      lastName: 'XAMIDJANOVA',
      firstName: 'MUBINAXON NOZIMBEK QIZI',
      dateOfBirth: '2017-02-10',
      phone: '+998941635548',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73065',
      lastName: 'QAYUMXO`JAYEV',
      firstName: 'DOVUDXON KOZIMXON O`G`LI',
      dateOfBirth: '2017-09-23',
      phone: '+998983666555',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49528',
      lastName: 'G`AYRATOV',
      firstName: 'BILOL YASHNAR O`G`LI',
      dateOfBirth: '2017-10-02',
      phone: '+998977764348',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86258',
      lastName: 'GAYRATOVA',
      firstName: 'IMONA JAMSHID QIZI',
      dateOfBirth: '2017-04-17',
      phone: '+998909914939',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73968',
      lastName: 'NISHANOV',
      firstName: 'SAMIR AZIZOVICH',
      dateOfBirth: '2017-08-29',
      phone: '+998909842269',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51856',
      lastName: 'MIRZAYEV',
      firstName: 'MUSTAFO OTABEK O`G`LI',
      dateOfBirth: '2017-12-13',
      phone: '+998977514006',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67555',
      lastName: 'NURMATOV',
      firstName: 'ISMOIL NODIROVICH',
      dateOfBirth: '2017-11-13',
      phone: '+998997427191',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39289',
      lastName: 'KAMILOV',
      firstName: 'KOMRON DONIYOROVICH',
      dateOfBirth: '2017-10-01',
      phone: '+998910109909',
      password: '7Efg9hI1j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95740',
      lastName: 'KADIROV',
      firstName: 'ABDULLOX RUSTAM O\'G\'LI',
      dateOfBirth: '2017-08-27',
      phone: '+998909080841',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61437',
      lastName: 'CHORSHANBIYEVA',
      firstName: 'OMINAXON URAL QIZI',
      dateOfBirth: '2017-08-08',
      phone: '+998900075815',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28064',
      lastName: 'NASRULLAXONOV',
      firstName: 'MUXAMMADUMAR UMIDILLO O\'G\'LI',
      dateOfBirth: '2017-08-09',
      phone: '+998900075816',
      password: '6Wxy8zA0b',
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
    console.log(`\n✅ Year 4 KS 2-Ashurali Zohiriy class and students seeding completed successfully!`);
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
