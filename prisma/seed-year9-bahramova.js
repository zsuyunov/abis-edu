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
  console.log('🌱 Starting Year 9-"А"Бахрамова Нафиса Шакирджановна class and students seeding...');

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
    where: { name: '9-"А"Бахрамова Нафиса Шакирджановна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 14, // Number of students in the data
    },
    create: {
      name: '9-"А"Бахрамова Нафиса Шакирджановна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 14,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S50380',
      lastName: 'Абдурахимова',
      firstName: 'Розияхон Умаржон кизи',
      dateOfBirth: '2000-11-27',
      phone: '+998951515199',
      password: 'Абдурахимова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17434',
      lastName: 'Зиёвиддинова',
      firstName: 'Муслима Рамзиддин кизи',
      dateOfBirth: '2000-11-28',
      phone: '+998951515200',
      password: 'Зиёвиддинова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62901',
      lastName: 'Илхомова',
      firstName: 'Мубинахон Иброхим кизи',
      dateOfBirth: '2000-11-29',
      phone: '+998951515201',
      password: 'Илхомова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39108',
      lastName: 'Шавкатова',
      firstName: 'Омина Дониёр кизи',
      dateOfBirth: '2000-11-30',
      phone: '+998951515202',
      password: 'Шавкатова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56795',
      lastName: 'Мелиева',
      firstName: 'Зарнигор Сирожиддин кизи',
      dateOfBirth: '2000-12-01',
      phone: '+998951515203',
      password: 'Мелиева_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48267',
      lastName: 'Кодиржонова',
      firstName: 'Дилнура Рустам кизи',
      dateOfBirth: '2000-12-02',
      phone: '+998951515204',
      password: 'Кодиржонова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S71548',
      lastName: 'Қурбонова',
      firstName: 'Робия Санжар кизи',
      dateOfBirth: '2000-12-03',
      phone: '+998951515205',
      password: 'Қурбонова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24689',
      lastName: 'Рустамова',
      firstName: 'Ойша Камолиддин қизи',
      dateOfBirth: '2000-12-04',
      phone: '+998951515206',
      password: 'Рустамова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85922',
      lastName: 'Суннатова',
      firstName: 'Эзоза Саидали кизи',
      dateOfBirth: '2000-12-05',
      phone: '+998951515207',
      password: 'Суннатова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50383',
      lastName: 'Уринова',
      firstName: 'Самира Акмаловна',
      dateOfBirth: '2000-12-06',
      phone: '+998951515208',
      password: 'Уринова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17437',
      lastName: 'Фахриддинова',
      firstName: 'Мадина Фазлиддин қизи',
      dateOfBirth: '2000-12-07',
      phone: '+998951515209',
      password: 'Фахриддинова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62904',
      lastName: 'Рашидова',
      firstName: 'Зарифа Аброровна',
      dateOfBirth: '2000-12-08',
      phone: '+998951515210',
      password: 'Рашидова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39111',
      lastName: 'Абдугофур',
      firstName: 'Солиха Абдукаххор қизи',
      dateOfBirth: '2000-12-09',
      phone: '+998951515211',
      password: 'Абдугофур_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56798',
      lastName: 'Нурмухамедова',
      firstName: 'Солиха',
      dateOfBirth: '2000-12-10',
      phone: '+998951515212',
      password: 'Нурмухамедова_suzuk',
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
