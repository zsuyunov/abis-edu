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
  console.log('🌱 Starting Year 9-"V"Ходжаева Мохира Хуснитдиновна class and students seeding...');

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
    where: { name: '9-"V"Ходжаева Мохира Хуснитдиновна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 12, // Number of students in the data
    },
    create: {
      name: '9-"V"Ходжаева Мохира Хуснитдиновна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 12,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S71542',
      lastName: 'Abduhamidova',
      firstName: 'Muslima Xurshid qizi',
      dateOfBirth: '2000-11-15',
      phone: '+998951515187',
      password: 'Abduhamidova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24683',
      lastName: 'Jaloliddinova',
      firstName: 'Zilola Fazliddin qizi',
      dateOfBirth: '2000-11-16',
      phone: '+998951515188',
      password: 'Jaloliddinova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85916',
      lastName: 'Murodova',
      firstName: 'Zunayra Azizjon qizi',
      dateOfBirth: '2000-11-17',
      phone: '+998951515189',
      password: 'Murodova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50377',
      lastName: 'Raimova',
      firstName: 'Azizabonu Kamoliddinovna',
      dateOfBirth: '2000-11-18',
      phone: '+998951515190',
      password: 'Raimova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17431',
      lastName: 'Abdurahimova',
      firstName: 'Madinaxon Anvar qizi',
      dateOfBirth: '2000-11-19',
      phone: '+998951515191',
      password: 'Abdurahimova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62898',
      lastName: 'Jorayeva',
      firstName: 'Marziyabonu Doniyorbek qizi',
      dateOfBirth: '2000-11-20',
      phone: '+998951515192',
      password: 'Jorayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39105',
      lastName: 'Nosirova',
      firstName: 'Ominaxon Ilxom qizi',
      dateOfBirth: '2000-11-21',
      phone: '+998951515193',
      password: 'Nosirova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56792',
      lastName: 'Vafoyeva',
      firstName: 'Ruxshona Ravshanovna',
      dateOfBirth: '2000-11-22',
      phone: '+998951515194',
      password: 'Vafoyeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48264',
      lastName: 'Xasanova',
      firstName: 'Fotima Ulug\'bek qizi',
      dateOfBirth: '2000-11-23',
      phone: '+998951515195',
      password: 'Xasanova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S71545',
      lastName: 'Vadutova',
      firstName: 'Ziyoda Maxmud qizi',
      dateOfBirth: '2000-11-24',
      phone: '+998951515196',
      password: 'Vadutova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24686',
      lastName: 'Olimjonova',
      firstName: 'Fazilat Zokirjon qizi',
      dateOfBirth: '2000-11-25',
      phone: '+998951515197',
      password: 'Olimjonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85919',
      lastName: 'G\'afforova',
      firstName: 'Muxlisaxon Alisher qizi',
      dateOfBirth: '2000-11-26',
      phone: '+998951515198',
      password: 'G\'afforova_suzuk',
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
