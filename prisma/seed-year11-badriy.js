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
  console.log('🌱 Starting Year 11 KS 4- Abdulla Badriy class and students seeding...');

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

  // Create the class "Year 11 KS 4- Abdulla Badriy"
  const classData = {
    name: 'Year 11 KS 4- Abdulla Badriy',
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
      studentId: 'S75829',
      lastName: 'BAXRIYEVA',
      firstName: 'KIARA JAXONGIROVNA',
      dateOfBirth: '2011-05-12',
      phone: '+998974456370',
      password: '4Cde6fG8h',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S38476',
      lastName: 'MEMMEDZADE',
      firstName: 'NAZLI KERIMULLA QIZI',
      dateOfBirth: '2011-10-05',
      phone: '+998903708184',
      password: '7Ijk9lM1n',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S91025',
      lastName: 'ZOKIROVA',
      firstName: 'MUSLIMAXON SHERZOD QIZI',
      dateOfBirth: '2010-09-30',
      phone: '+998977019003',
      password: '0Opq2rS4t',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S54698',
      lastName: 'ZUFAROVA',
      firstName: 'HAFIZA ERKIN QIZI',
      dateOfBirth: '2010-11-10',
      phone: '+998949083839',
      password: '3Uvw5xY7z',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S17243',
      lastName: 'AKROMOV',
      firstName: 'ABDULLOH HOJIAKBAR O\'G\'LI',
      dateOfBirth: '2024-08-30',
      phone: '+998901253040',
      password: '8Abc0dE2f',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S82957',
      lastName: 'BABAYEV',
      firstName: 'SHAXZOD SHOXRUXOVICH',
      dateOfBirth: '2010-11-21',
      phone: '+998900331710',
      password: '5Ghi7jK9l',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S46310',
      lastName: 'BAKHTARI',
      firstName: 'MARYAM',
      dateOfBirth: '2011-01-28',
      phone: '+998977405004',
      password: '2Mno4pQ6r',
      gender: UserSex.FEMALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S69582',
      lastName: 'ALMOMEDOV',
      firstName: 'ALI MUHAMMAD ULUG\'BEKOVICH',
      dateOfBirth: '2010-06-07',
      phone: '+998998228596',
      password: '9Stu1vW3x',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S31849',
      lastName: 'RAVSHANOV',
      firstName: 'IBODULLOX IXTIYOR O\'G\'LI',
      dateOfBirth: '2010-12-29',
      phone: '+998998442343',
      password: '4Yza6bC8d',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S87104',
      lastName: 'XABIBULLAYEV',
      firstName: 'ABDULLOH DILSHOD O\'G\'LI',
      dateOfBirth: '2010-10-10',
      phone: '+998998166000',
      password: '7Efg9hI1j',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S52467',
      lastName: 'ALLABERDIYEV',
      firstName: 'AKBAR ALISHEROVICH',
      dateOfBirth: '2010-06-17',
      phone: '+998933763000',
      password: '0Klm2nO4p',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S18693',
      lastName: 'ARIFDJANOV',
      firstName: 'JASURBEK UTKUROVICH',
      dateOfBirth: '2010-10-28',
      phone: '+998974541507',
      password: '3Qrs5tU7v',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S73950',
      lastName: 'AZIMOV',
      firstName: 'ISMOILJON ISROIL O\'G\'LI',
      dateOfBirth: '2010-09-22',
      phone: '+998988847722',
      password: '6Wxy8zA0b',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S35278',
      lastName: 'KOMILOV',
      firstName: 'SAIDAMIR AMIRJON O\'G\'LI',
      dateOfBirth: '2011-03-24',
      phone: '+998901689076',
      password: '1Cde3fG5h',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S90516',
      lastName: 'ABDUJALILOV',
      firstName: 'BEHZOD XURSHID O\'G\'LI',
      dateOfBirth: '2011-02-06',
      phone: '+998974231007',
      password: '8Ijk0lM2n',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S46729',
      lastName: 'SOBIROV',
      firstName: 'ISFANDIYOR PO\'LATOVICH',
      dateOfBirth: '2011-02-16',
      phone: '+998996477612',
      password: '5Opq7rS9t',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S61284',
      lastName: 'FIDANJAN',
      firstName: 'EMIR ARES NEVZOT OGLI',
      dateOfBirth: '2011-06-22',
      phone: '+998886973993',
      password: '2Uvw4xY6z',
      gender: UserSex.MALE,
      status: StudentStatus.ACTIVE
    },
    {
      studentId: 'S97803',
      lastName: 'DILSHODOV',
      firstName: 'IBROHIM DILMUROD O\'G\'LI',
      dateOfBirth: '2010-07-24',
      phone: '+998971846667',
      password: '9Abc1dE3f',
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
    console.log('\n✅ Year 11 KS 4- Abdulla Badriy class and students seeding completed successfully!');
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