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
  console.log('🌱 Starting Year 7 KS 3- Saidjonov Muhtorjon Yo\'ldoshevich class and students seeding...');

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
    where: { name: 'Year 7 KS 3- Saidjonov Muhtorjon Yo\'ldoshevich' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20, // Number of students in the data
    },
    create: {
      name: 'Year 7 KS 3- Saidjonov Muhtorjon Yo\'ldoshevich',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 20,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S61749',
      lastName: 'AKBAROVA',
      firstName: 'SHAHRO`ZAXON OTABEK QIZI',
      dateOfBirth: '2014-06-12',
      phone: '+998977275157',
      password: '4Yza6bC8d',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28495',
      lastName: 'KADIROVA',
      firstName: 'DILRUBA SHIRALIYEVNA',
      dateOfBirth: '2015-11-01',
      phone: '+998990856079',
      password: '7Efg9hI1j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S75139',
      lastName: 'MANNANOV',
      firstName: 'MIRONSHOH MAXSUDOVICH',
      dateOfBirth: '2014-08-22',
      phone: '+998943062117',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86240',
      lastName: 'NODIRJONOVA',
      firstName: 'OSIYO ABDULLOHOVNA',
      dateOfBirth: '2014-09-22',
      phone: '+998950801250',
      password: '3Qrs5tU7v',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S19357',
      lastName: 'PULATOV',
      firstName: 'ABDULAZIZ MURADALI O`G`LI',
      dateOfBirth: '2015-05-20',
      phone: '+998979200065',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52806',
      lastName: 'RAXMATULLAYEV',
      firstName: 'YAHYO SHERZOD O`G`LI',
      dateOfBirth: '2014-04-18',
      phone: '+998996079050',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67491',
      lastName: 'RIXSIBOYEVA',
      firstName: 'SARVINOZ XALILULLAYEVNA',
      dateOfBirth: '2015-01-17',
      phone: '+998998303663',
      password: '8Ijk0lM2n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31582',
      lastName: 'SHAROFIDDINOVA',
      firstName: 'FARZONA FAYOZIDDINOVNA',
      dateOfBirth: '2015-10-01',
      phone: '+998941804444',
      password: '5Opq7rS9t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S94627',
      lastName: 'TURAXANOVA',
      firstName: 'JAMILAXON OTABEK QIZI',
      dateOfBirth: '2015-03-28',
      phone: '+998909580000',
      password: '2Uvw4xY6z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S58039',
      lastName: 'TURGUNOV',
      firstName: 'MUHAMMAD XAMIDOVICH',
      dateOfBirth: '2015-05-18',
      phone: '+998990710027',
      password: '9Abc1dE3f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S29746',
      lastName: 'XABIBULLAYEV',
      firstName: 'ISROIL SHERZOD O`G`LI',
      dateOfBirth: '2015-09-30',
      phone: '+998911636776',
      password: '4Ghi6jK8l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61849',
      lastName: 'IBROHIMOV',
      firstName: 'ABDUBORIY AKMAL O\'G\'LI',
      dateOfBirth: '2014-09-12',
      phone: '+998903542202',
      password: '7Mno9pQ1r',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S72951',
      lastName: 'MAXKAMOV',
      firstName: 'UMAR AXMAD O\'G\'LI',
      dateOfBirth: '2014-11-05',
      phone: '+998909727027',
      password: '0Stu2vW4x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S18539',
      lastName: 'SHOWJAHI',
      firstName: 'MUHIBULLAH AFGHAN',
      dateOfBirth: '2014-01-23',
      phone: '+998904101340',
      password: '3Yza5bC7d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S46290',
      lastName: 'ISMATOVA',
      firstName: 'MUQADDAS ISLOMOVNA',
      dateOfBirth: '2014-01-21',
      phone: '+998936717000',
      password: '8Efg0hI2j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S57392',
      lastName: 'XUSANOV',
      firstName: 'ABDULLOX JAVOXIR O\'G\'LI',
      dateOfBirth: '2014-05-01',
      phone: '+998977157707',
      password: '5Klm7nO9p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S81937',
      lastName: 'ABDUMUXTAROV',
      firstName: 'YAXYOBEK',
      dateOfBirth: '2014-01-01', // Default date since it was empty
      phone: '+998951203575',
      password: '2Qrs4tU6v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S24691',
      lastName: 'KASIMOV',
      firstName: 'SAYYODBEK DILMUROD O`G`LI',
      dateOfBirth: '2014-06-14',
      phone: '+998943024774',
      password: '9Wxy1zA3b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S87540',
      lastName: 'SHAVKATOV',
      firstName: 'IMAN IKRAMJANOVICH',
      dateOfBirth: '2014-06-15',
      phone: '+998998862289',
      password: '4Cde6fG8h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31946',
      lastName: 'MUSAKULOVA',
      firstName: 'GULIRA\'NO OLMOS QIZI',
      dateOfBirth: '2014-07-08',
      phone: '+998950510337',
      password: '7Ijk9lM1n',
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
    console.log(`\n✅ Year 7 KS 3- Saidjonov Muhtorjon Yo'ldoshevich class and students seeding completed successfully!`);
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
