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
  console.log('🌱 Starting Year 10-"А"Ходжаева Мохира Хуснитдиновна class and students seeding...');

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
    where: { name: '10-"А"Ходжаева Мохира Хуснитдиновна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 9, // Number of students in the data
    },
    create: {
      name: '10-"А"Ходжаева Мохира Хуснитдиновна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 9,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S48261',
      lastName: 'Абдурахмонова',
      firstName: 'Орзу Бобир кизи',
      dateOfBirth: '2000-11-06',
      phone: '+998951515178',
      password: 'Абдурахмонова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S71539',
      lastName: 'Одилжонова',
      firstName: 'Махдия Комилжон кизи',
      dateOfBirth: '2000-11-07',
      phone: '+998951515179',
      password: 'Одилжонова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24680',
      lastName: 'Рустамова',
      firstName: 'Мадинабону Мураджон кизи',
      dateOfBirth: '2000-11-08',
      phone: '+998951515180',
      password: 'Рустамова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85913',
      lastName: 'Толипова',
      firstName: 'Сакина Махмуджон кизи',
      dateOfBirth: '2000-11-09',
      phone: '+998951515181',
      password: 'Толипова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50374',
      lastName: 'Файзиева',
      firstName: 'Мубина Шавкат кизи',
      dateOfBirth: '2000-11-10',
      phone: '+998951515182',
      password: 'Файзиева_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17428',
      lastName: 'Журабоева',
      firstName: 'Мубина Акмал қизи',
      dateOfBirth: '2000-11-11',
      phone: '+998951515183',
      password: 'Журабоева_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62895',
      lastName: 'Каюмова',
      firstName: 'Мухсина Бехзодовна',
      dateOfBirth: '2000-11-12',
      phone: '+998951515184',
      password: 'Каюмова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39102',
      lastName: 'Суннатуллаева',
      firstName: 'Самия Жамшид қизи',
      dateOfBirth: '2000-11-13',
      phone: '+998951515185',
      password: 'Суннатуллаева_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56789',
      lastName: 'Эркинова',
      firstName: 'Сарвиноз Фарходовна',
      dateOfBirth: '2000-11-14',
      phone: '+998951515186',
      password: 'Эркинова_suzuk',
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
