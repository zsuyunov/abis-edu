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
  console.log('🌱 Starting Year 13 KS 5-Abdulla Qodiriy class and students seeding...');

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

  // Create the class "Year 13 KS 5-Abdulla Qodiriy"
  const classData = {
    name: 'Year 13 KS 5-Abdulla Qodiriy',
    capacity: 19, // Number of students in the provided data
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
      studentId: 'S31605',
      lastName: 'ABDULLAYEV',
      firstName: 'MURTAZOBEK FARXODOVICH',
      dateOfBirth: '2009-08-08',
      phone: '+998977279117',
      password: 'JlXDIAwoP',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S84303',
      lastName: 'AKBAROV',
      firstName: 'SAIDMUXAMMADXON XUSAN O\'G\'LI',
      dateOfBirth: '2009-09-20',
      phone: '+998901876895',
      password: 'Suxr7tJ44',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S28173',
      lastName: 'ARMAN',
      firstName: 'SULAIMAN',
      dateOfBirth: '2007-11-22',
      phone: '+998938104390',
      password: '1Ndae3YE5',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S22745',
      lastName: 'BADALOV',
      firstName: 'SHOHIJAXON JASUR O\'G\'LI',
      dateOfBirth: '2009-03-19',
      phone: '+998911667877',
      password: '5Spg0RJ6UE',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S94221',
      lastName: 'MURTAZAXO\'JAYEV',
      firstName: 'MUXAMMAD SAID SAIDAKBARXON O\'G\'LI',
      dateOfBirth: '2008-08-30',
      phone: '+998935400015',
      password: 'P1qj3u0cFH',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S67349',
      lastName: 'YUSUPOVA',
      firstName: 'DURDONA BAXTIYOR QIZI',
      dateOfBirth: '2008-02-26',
      phone: '+998911925494',
      password: '8Klm2pQ9r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S18462',
      lastName: 'MURODJONOV',
      firstName: 'SAIDAZIM SAIDOLIM O\'G\'LI',
      dateOfBirth: '2008-09-01',
      phone: '+998935565528',
      password: '3RtF6vN1s',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S75931',
      lastName: 'DJALILOV',
      firstName: 'ALIHON ABDULAZIZOVICH',
      dateOfBirth: '2008-08-15',
      phone: '+998903150000',
      password: '9Xyz7wB2c',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S49276',
      lastName: 'JUMABOYEV',
      firstName: 'ABDULLOX BAHROMOVICH',
      dateOfBirth: '2010-03-12',
      phone: '+998950069024',
      password: '4Dfg8hJ3k',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S13588',
      lastName: 'NAMOZOVA',
      firstName: 'MUSLIMA BAXTIYORJON QIZI',
      dateOfBirth: '2008-06-21',
      phone: '+998998631551',
      password: '7Lmn1oP4q',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S86420',
      lastName: 'NAZRULLAYEVA',
      firstName: 'HAMIDA ANVAR QIZI',
      dateOfBirth: '2009-08-03',
      phone: '+998770288814',
      password: '2Rst5uV6w',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S50794',
      lastName: 'WISHAN',
      firstName: 'REEMA RAED JOUDAH',
      dateOfBirth: '2010-03-31',
      phone: '+998947888382',
      password: '0Abc3dE7f',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S62841',
      lastName: 'FAXRIDINOVA',
      firstName: 'SHIRINABONU NODIRBEK QIZI',
      dateOfBirth: '2009-02-24',
      phone: '+998996157555',
      password: '6Ghi9jK1l',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S39215',
      lastName: 'AXMEDOVA',
      firstName: 'ROBIYABONU',
      dateOfBirth: '2009-04-17',
      phone: '+998931830049',
      password: '3Mno5pQ7r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S97103',
      lastName: 'ZIYOIDDINOVA',
      firstName: 'SOLIHA ZOHIDJON QIZI',
      dateOfBirth: '2008-05-22',
      phone: '+998902692772',
      password: '8Stu1vW4x',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S24680',
      lastName: 'MAXMUDOV',
      firstName: 'DONIYOR TOHIRJON O\'G\'LI',
      dateOfBirth: '2008-05-05',
      phone: '+998933851042',
      password: '5Yza2bC6d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S81927',
      lastName: 'BORIYEVA',
      firstName: 'KAMOLAXON HIMMATILLA QIZI',
      dateOfBirth: '2009-04-16',
      phone: '+998933851043',
      password: '9Efg4hI7j',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S56439',
      lastName: 'ABDUKARIMOV',
      firstName: 'ISMOIL BAXTIYOR O\'G\'LI',
      dateOfBirth: '2009-08-12',
      phone: '+998881120000',
      password: '2Klm6nO8p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S10274',
      lastName: 'MAXAMADABROROV',
      firstName: 'ABDURAXIM ABDULATIF O\'G\'LI',
      dateOfBirth: '2008-11-20',
      phone: '+998990154444',
      password: '7Qrs3tU5v',
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
    console.log('\n✅ Year 13 KS 5-Abdulla Qodiriy class and students seeding completed successfully!');
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