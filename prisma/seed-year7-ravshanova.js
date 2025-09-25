const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Import enums
const { ClassStatus, ClassEducationType, ClassLanguage, StudentStatus, UserSex } = require('@prisma/client');

async function generateUniqueStudentId(originalId) {
  let studentId = originalId;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!existing) {
      return studentId;
    }
    
    // Generate new ID by replacing the last 2 digits with counter (keeping S + 5 digits format)
    const baseId = originalId.slice(0, -2);
    studentId = baseId + counter.toString().padStart(2, '0');
    counter++;
    
    if (counter > 99) {
      throw new Error(`Could not generate unique student ID for ${originalId} after 99 attempts`);
    }
  }
}

async function generateUniquePhone(originalPhone) {
  let phone = originalPhone;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.student.findFirst({
      where: { phone }
    });
    
    if (!existing) {
      return phone;
    }
    
    // Generate new phone by changing last digits
    const basePhone = originalPhone.slice(0, -2);
    phone = basePhone + counter.toString().padStart(2, '0');
    counter++;
    
    if (counter > 99) {
      throw new Error(`Could not generate unique phone for ${originalPhone} after 99 attempts`);
    }
  }
}

async function main() {
  console.log('🌱 Starting Year 7-"V" Равшанова Шабнам Холмуродовна class and students seeding...');

  // Verify Suzuk branch exists
  const branch = await prisma.branch.findFirst({
    where: { shortName: 'Suzuk' },
  });

  if (!branch) {
    console.error('❌ Branch with shortName "Suzuk" not found. Please ensure it exists.');
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
    where: { name: '7-"V" Равшанова Шабнам Холмуродовна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 19, // Number of students in the data
    },
    create: {
      name: '7-"V" Равшанова Шабнам Холмуродовна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 19,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S72849',
      lastName: 'Boymuxammedova',
      firstName: 'Risolat Otabek qizi',
      dateOfBirth: '2001-01-06',
      phone: '+998951515139',
      password: 'Boymuxammedova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S15913',
      lastName: 'Farziddinova',
      firstName: 'Xanifa Najmiddin qizi',
      dateOfBirth: '2001-01-07',
      phone: '+998951515140',
      password: 'Farziddinova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48273',
      lastName: 'Fazilova',
      firstName: 'Xadicha Abdurahmon qizi',
      dateOfBirth: '2001-01-08',
      phone: '+998951515141',
      password: 'Fazilova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S63501',
      lastName: 'Irisbayeva',
      firstName: 'Soliha Yodgor qizi',
      dateOfBirth: '2001-01-09',
      phone: '+998951515142',
      password: 'Irisbayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S37518',
      lastName: 'Juraboyeva',
      firstName: 'E\'zoza To\'lqin qizi',
      dateOfBirth: '2001-01-10',
      phone: '+998951515143',
      password: 'Juraboyeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S89633',
      lastName: 'Maksumova',
      firstName: 'Imona Lutfulla qizi',
      dateOfBirth: '2001-01-11',
      phone: '+998951515144',
      password: 'Maksumova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24093',
      lastName: 'Nig\'monjonova',
      firstName: 'Rayyona Maxamadjon qizi',
      dateOfBirth: '2001-01-12',
      phone: '+998951515145',
      password: 'Nig\'monjonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56353',
      lastName: 'Kadirova',
      firstName: 'Rayyona Ulugbek qizi',
      dateOfBirth: '2001-01-13',
      phone: '+998951515146',
      password: 'Kadirova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S91735',
      lastName: 'Qudratiy',
      firstName: 'Fotima Ne\'matullo qizi',
      dateOfBirth: '2001-01-14',
      phone: '+998951515147',
      password: 'Qudratiy_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S38302',
      lastName: 'Rufatova',
      firstName: 'Oysha Shuhrat qizi',
      dateOfBirth: '2001-01-15',
      phone: '+998951515148',
      password: 'Rufatova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S71557',
      lastName: 'Sodiqxonova',
      firstName: 'Muslima Sohib qizi',
      dateOfBirth: '2001-01-16',
      phone: '+998951515149',
      password: 'Sodiqxonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24698',
      lastName: 'Sultonmurodova',
      firstName: 'Azizaxon',
      dateOfBirth: '2001-01-17',
      phone: '+998951515150',
      password: 'Sultonmurodova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85931',
      lastName: 'Xolxo\'jayeva',
      firstName: 'Salomatxon Saidkomil qizi',
      dateOfBirth: '2001-01-18',
      phone: '+998951515151',
      password: 'Xolxo\'jayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50392',
      lastName: 'Hamidullayeva',
      firstName: 'Muslima Lutfulla qizi',
      dateOfBirth: '2001-01-19',
      phone: '+998951515152',
      password: 'Hamidullayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17446',
      lastName: 'Rashitova',
      firstName: 'Ominaxon Adham qizi',
      dateOfBirth: '2001-01-20',
      phone: '+998951515153',
      password: 'Rashitova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62913',
      lastName: 'Zoirova',
      firstName: 'Muzayyana Davron qizi',
      dateOfBirth: '2001-01-21',
      phone: '+998951515154',
      password: 'Zoirova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39120',
      lastName: 'Xalikova',
      firstName: 'Roziya Dilshod qizi',
      dateOfBirth: '2001-01-22',
      phone: '+998951515155',
      password: 'Xalikova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56804',
      lastName: 'Abdujalilova',
      firstName: 'Maqsadoy Rustam qizi',
      dateOfBirth: '2001-01-23',
      phone: '+998951515156',
      password: 'Abdujalilova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48276',
      lastName: 'Maxmudova',
      firstName: 'Amina Firdavs qizi',
      dateOfBirth: '2001-01-24',
      phone: '+998951515157',
      password: 'Maxmudova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    }
  ];

  console.log(`📚 Processing ${studentsData.length} students...`);

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const studentData of studentsData) {
    try {
      // Generate unique student ID if needed
      const uniqueStudentId = await generateUniqueStudentId(studentData.studentId);
      if (uniqueStudentId !== studentData.studentId) {
        console.log(`⚠️  Student ID changed: ${studentData.studentId} → ${uniqueStudentId}`);
      }

      // Generate unique phone if needed
      const uniquePhone = await generateUniquePhone(studentData.phone);
      if (uniquePhone !== studentData.phone) {
        console.log(`⚠️  Phone changed: ${studentData.phone} → ${uniquePhone}`);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(studentData.password, 10);

      // Create student
      const student = await prisma.student.create({
        data: {
          id: uniqueStudentId,
          studentId: uniqueStudentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          phone: uniquePhone,
          password: hashedPassword,
          gender: studentData.gender,
          status: studentData.status,
          dateOfBirth: new Date(studentData.dateOfBirth),
          branchId: branch.id,
          classId: createdClass.id,
        },
      });

      console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${student.studentId})`);
      createdCount++;

    } catch (error) {
      console.error(`❌ Error creating student ${studentData.firstName} ${studentData.lastName}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Students created: ${createdCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📚 Total processed: ${studentsData.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 All students created successfully!');
  } else {
    console.log(`\n⚠️  ${errorCount} students failed to create. Please check the errors above.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
