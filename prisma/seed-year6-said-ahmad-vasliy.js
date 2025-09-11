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
  console.log('🌱 Starting Year 6 KS 2- Said Ahmad Vasliy class and students seeding...');

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
    where: { name: 'Year 6 KS 2- Said Ahmad Vasliy' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 16, // Number of students in the data
    },
    create: {
      name: 'Year 6 KS 2- Said Ahmad Vasliy',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 16,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.PRIMARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S89349',
      lastName: 'AKBAROVA',
      firstName: 'SAMINA BOXODIR QIZI',
      dateOfBirth: '2015-02-02',
      phone: '+998991804443',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52200',
      lastName: 'ABDUKARIMOV',
      firstName: 'ASLIDDINBEK FAXRIDDIN O`G`LI',
      dateOfBirth: '2015-07-23',
      phone: '+998910108300',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67544',
      lastName: 'FOZILXO`JAYEV',
      firstName: 'A`ZAMXO`JA FAZLIDDIN O`G`LI',
      dateOfBirth: '2015-05-07',
      phone: '+998998900402',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31989',
      lastName: 'DJURAYEV',
      firstName: 'XALID SARDOR O`G`LI',
      dateOfBirth: '2015-08-07',
      phone: '+998933891515',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84298',
      lastName: 'ODILOV',
      firstName: 'JA`FAR MUZAFFAROVICH',
      dateOfBirth: '2015-01-09',
      phone: '+998977176363',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S15750',
      lastName: 'SHAROPOVA',
      firstName: 'MALIKABONU SARVARJON QIZI',
      dateOfBirth: '2015-10-10',
      phone: '+998903266611',
      password: '3Yza5bC7d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73060',
      lastName: 'SULTONMURODOVA',
      firstName: 'OYSHA DILSHOD QIZI',
      dateOfBirth: '2014-07-21',
      phone: '+998946617565',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49523',
      lastName: 'TOLIPOVA',
      firstName: 'AZIZA ABDULBOQIJONOVNA',
      dateOfBirth: '2015-02-05',
      phone: '+998944330943',
      password: '5Klm7nO9p',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86253',
      lastName: 'MAMADJANOVA',
      firstName: 'SA`DIYA YIGITALIYEVNA',
      dateOfBirth: '2015-09-11',
      phone: '+998909142002',
      password: '2Qrs4tU6v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73963',
      lastName: 'XOLMAMATOVA',
      firstName: 'NILUFAR AKBAR QIZI',
      dateOfBirth: '2015-05-26',
      phone: '+998912132388',
      password: '9Wxy1zA3b',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S51851',
      lastName: 'ODILJONOV',
      firstName: 'HUZAYFA KOMILJON O`G`LI',
      dateOfBirth: '2015-11-14',
      phone: '+998974221777',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67545',
      lastName: 'ABDULLAYEV',
      firstName: 'ALIMUSOBEK',
      dateOfBirth: '2015-05-03',
      phone: '+998977279117',
      password: '7Ijk9lM1n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39284',
      lastName: 'HAIDARY',
      firstName: 'STAYESH',
      dateOfBirth: '2014-01-18',
      phone: '+998955512278',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S95735',
      lastName: 'MUSAYEV',
      firstName: 'MUHAMMAD MUSTAFO SHERZOD O`G`LI',
      dateOfBirth: '2015-02-24',
      phone: '+998974320004',
      password: '3Uvw5xY7z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61432',
      lastName: 'MADALIMOV',
      firstName: 'JAXONGIR FARRUX O\'G\'LI',
      dateOfBirth: '2015-08-22',
      phone: '+998974320005',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28059',
      lastName: 'XIKMATOVA',
      firstName: 'RUQAYYA OTABEKOVNA',
      dateOfBirth: '2015-01-04',
      phone: '+998977540770',
      password: '5Ghi7jK9l',
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
    console.log(`\n✅ Year 6 KS 2- Said Ahmad Vasliy class and students seeding completed successfully!`);
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
