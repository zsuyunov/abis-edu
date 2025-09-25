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

async function generateUniquePhone() {
  while (true) {
    // Generate random Uzbek phone number (+9989XXXXXXXX)
    const randomNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const phone = `+9989${randomNumber}`;
    
    const existing = await prisma.student.findFirst({
      where: { phone }
    });
    
    if (!existing) {
      return phone;
    }
  }
}

async function main() {
  console.log('🌱 Starting Year 7-"В"Жиянбаева Бекзода Аширбековна class and students seeding...');

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
    where: { name: '7-"В"Жиянбаева Бекзода Аширбековна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 15, // Number of students in the data
    },
    create: {
      name: '7-"В"Жиянбаева Бекзода Аширбековна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 15,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S71560',
      lastName: 'Назарова',
      firstName: 'Муниса Омонжон кизи',
      dateOfBirth: '2001-01-25',
      phone: '+998951515158',
      password: 'Назарова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24701',
      lastName: 'Дилшодова',
      firstName: 'Музайяна Шерзод',
      dateOfBirth: '2001-01-26',
      phone: '+998951515159',
      password: 'Дилшодова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85934',
      lastName: 'Абдураҳимова',
      firstName: 'Ханифа Умаржон кизи',
      dateOfBirth: '2001-01-27',
      phone: '+998951515160',
      password: 'Абдураҳимова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50395',
      lastName: 'Азимова',
      firstName: 'Севинч Зокиржон кизи',
      dateOfBirth: '2001-01-28',
      phone: '+998951515161',
      password: 'Азимова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17449',
      lastName: 'Иброхимжонова',
      firstName: 'Муслима Исмоил кизи',
      dateOfBirth: '2001-01-29',
      phone: '+998951515162',
      password: 'Иброхимжонова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62916',
      lastName: 'Кодирова',
      firstName: 'Мунира Зокир кизи',
      dateOfBirth: '2001-01-30',
      phone: '+998951515163',
      password: 'Кодирова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39123',
      lastName: 'Маннопжонова',
      firstName: 'Санобар Дилмурод кизи',
      dateOfBirth: '2001-01-31',
      phone: '+998951515164',
      password: 'Маннопжонова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56807',
      lastName: 'Миродилова',
      firstName: 'Омина Боходир кизи',
      dateOfBirth: '2001-02-01',
      phone: '+998951515165',
      password: 'Миродилова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48279',
      lastName: 'Хабибуллаева',
      firstName: 'Солиҳахон Шерзод кизи',
      dateOfBirth: '2001-02-02',
      phone: '+998951515166',
      password: 'Хабибуллаева_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S71563',
      lastName: 'Хамидова',
      firstName: 'Мухлиса Хуршид кизи',
      dateOfBirth: '2001-02-03',
      phone: '+998951515167',
      password: 'Хамидова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24704',
      lastName: 'Хасанова',
      firstName: 'Хадича Жамшид кизи',
      dateOfBirth: '2001-02-04',
      phone: '+998951515168',
      password: 'Хасанова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85937',
      lastName: 'Азамова',
      firstName: 'София Элмуродовна',
      dateOfBirth: '2001-02-05',
      phone: '+998951515169',
      password: 'Азамова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50398',
      lastName: 'Шавкатова',
      firstName: 'Асила Шодиёр кизи',
      dateOfBirth: '2001-02-06',
      phone: '+998951515170',
      password: 'Шавкатова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17452',
      lastName: 'Зайнуддинова',
      firstName: 'Имронахо Сирожиддин қизи',
      dateOfBirth: '2001-02-07',
      phone: '+998951515171',
      password: 'Зайнуддинова_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62919',
      lastName: 'Шакирова',
      firstName: 'Шахина Шахзодовна',
      dateOfBirth: '2001-02-08',
      phone: '+998951515172',
      password: 'Шакирова_suzuk',
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

      // Generate unique phone
      const uniquePhone = await generateUniquePhone();
      console.log(`📱 Generated phone: ${uniquePhone} for ${studentData.firstName} ${studentData.lastName}`);

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
