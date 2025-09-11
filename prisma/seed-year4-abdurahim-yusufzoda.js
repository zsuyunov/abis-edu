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
  console.log('🌱 Starting Year 4 KS 2- Abdurahim Yusufzoda class and students seeding...');

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
    where: { name: 'Year 4 KS 2- Abdurahim Yusufzoda' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22, // Number of students in the data
    },
    create: {
      name: 'Year 4 KS 2- Abdurahim Yusufzoda',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 22,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S49526',
      lastName: 'ACHILOV',
      firstName: 'MUSTAFO XURSHIDOVICH',
      dateOfBirth: '2017-03-03',
      phone: '+998777020091',
      password: '8Efg0hI2j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86256',
      lastName: 'ARIFXONOVA',
      firstName: 'E`ZOZAXON ODILBEK QIZI',
      dateOfBirth: '2017-10-01',
      phone: '+998974500230',
      password: '5Klm7nO9p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73966',
      lastName: 'JAHONGIROV',
      firstName: 'SAMANDAR SANJAROVICH',
      dateOfBirth: '2017-01-05',
      phone: '+998900423510',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51854',
      lastName: 'RAVSHANOVA',
      firstName: 'OYSHA RUSTAMJON QIZI',
      dateOfBirth: '2017-02-17',
      phone: '+998933891515',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67551',
      lastName: 'SHAVKATOV',
      firstName: 'ISLOMJON RAVSHAN O\'G\'LI',
      dateOfBirth: '2017-10-01',
      phone: '+998909972829',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39287',
      lastName: 'ULUG`BEKOV',
      firstName: 'MUHAMMAD SODIQ BEHZOD O`G`LI',
      dateOfBirth: '2017-01-21',
      phone: '+998974545053',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95738',
      lastName: 'BABANAZAROV',
      firstName: 'XOLID TOHIR O\'G\'LI',
      dateOfBirth: '2017-01-10',
      phone: '+998974545054',
      password: '0Opq2rS4t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61435',
      lastName: 'SALOMOVA',
      firstName: 'MUBINA ABDUXAMID QIZI',
      dateOfBirth: '2018-07-04',
      phone: '+998901399007',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28062',
      lastName: 'DJURAYEV',
      firstName: 'IBROHIM ALISHER O`G`LI',
      dateOfBirth: '2017-02-14',
      phone: '+998991004244',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S74625',
      lastName: 'DJURAYEVA',
      firstName: 'IYMONA ALISHER QIZI',
      dateOfBirth: '2017-02-14',
      phone: '+998991004244',
      password: '5Ghi7jK9l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S89353',
      lastName: 'IBRAGIMOV',
      firstName: 'ABDUSALOM ABDULLA O`G`LI',
      dateOfBirth: '2017-06-29',
      phone: '+998903340666',
      password: '2Mno4pQ6r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52204',
      lastName: 'JO`RABOYEV',
      firstName: 'MUHAMMAD AKMAL O`G`LI',
      dateOfBirth: '2017-06-21',
      phone: '+998971772255',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67552',
      lastName: 'RASULOVA',
      firstName: 'OSIYOXON JAMSHID QIZI',
      dateOfBirth: '2017-04-26',
      phone: '+998900000040',
      password: '4Yza6bC8d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31993',
      lastName: 'XIKMATULLAYEVA',
      firstName: 'FARANGIZ AZIZBEKOVNA',
      dateOfBirth: '2017-07-29',
      phone: '+998999661529',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84302',
      lastName: 'ZOKIRJONOVA',
      firstName: 'DILOROM AZIZBEKOVNA',
      dateOfBirth: '2017-04-30',
      phone: '+998909765157',
      password: '0Klm2nO4p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15754',
      lastName: 'ABDIYEV',
      firstName: 'MUHAMMAD MUSTAFO MURODBEK O`G`LI',
      dateOfBirth: '2017-08-11',
      phone: '+998971875775',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73064',
      lastName: 'MAJIDOV',
      firstName: 'ABDUG`OFUR ABDUSHUKUR O`G`LI',
      dateOfBirth: '2017-03-30',
      phone: '+998909409950',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49527',
      lastName: 'MUHAMMADJONOV',
      firstName: 'MUHAMMAD YUSUF RAMZXON O\'G\'LI',
      dateOfBirth: '2018-05-09',
      phone: '+998905567007',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86257',
      lastName: 'RASHIDOV',
      firstName: 'MUXAMMADALI ABDULLOX O\'G\'LI',
      dateOfBirth: '2017-02-08',
      phone: '+998974248685',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73967',
      lastName: 'MUXAMEDXODJAYEV',
      firstName: 'MUHAMMADAMIN OYATULLA O`G`LI',
      dateOfBirth: '2017-07-18',
      phone: '+998974248686',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51855',
      lastName: 'MUXAMEDOVA',
      firstName: 'SHIRIN BOBIROVNA',
      dateOfBirth: '2017-01-04',
      phone: '+998998701520',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67553',
      lastName: 'UMAROVA',
      firstName: 'OSIYOXON JAMSHIDXON QIZI',
      dateOfBirth: '2017-06-06',
      phone: '+998998172829',
      password: '9Abc1dE3f',
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
    console.log(`\n✅ Year 4 KS 2- Abdurahim Yusufzoda class and students seeding completed successfully!`);
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
