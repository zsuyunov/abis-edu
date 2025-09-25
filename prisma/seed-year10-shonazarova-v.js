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
  console.log('🌱 Starting Year 10-"V"Шоназарова Наргиза Соибовна class and students seeding...');

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
    where: { name: '10-"V"Шоназарова Наргиза Соибовна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 10, // Number of students in the data
    },
    create: {
      name: '10-"V"Шоназарова Наргиза Соибовна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 10,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S72843',
      lastName: 'Ismoilova',
      firstName: 'Xamida Qosimxon qizi',
      dateOfBirth: '2000-10-27',
      phone: '+998951515168',
      password: 'Ismoilova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S15907',
      lastName: 'Abdullayeva',
      firstName: 'Muslima Akmalovna',
      dateOfBirth: '2000-10-28',
      phone: '+998951515169',
      password: 'Abdullayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48264',
      lastName: 'Izzatillayeva',
      firstName: 'Muslima Azizillo qizi',
      dateOfBirth: '2000-10-29',
      phone: '+998951515170',
      password: 'Izzatillayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S63495',
      lastName: 'Mannonjonova',
      firstName: 'Hadicha Dilmurod qizi',
      dateOfBirth: '2000-10-30',
      phone: '+998951515171',
      password: 'Mannonjonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S37512',
      lastName: 'Mannopjonova',
      firstName: 'Rayyona Dilshod qizi',
      dateOfBirth: '2000-10-31',
      phone: '+998951515172',
      password: 'Mannopjonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S89627',
      lastName: 'Muhamadiyeva',
      firstName: 'Robiya Momin qizi',
      dateOfBirth: '2000-11-01',
      phone: '+998951515173',
      password: 'Muhamadiyeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24084',
      lastName: 'Nematjonova',
      firstName: 'Barnoxon Ravshan qizi',
      dateOfBirth: '2000-11-02',
      phone: '+998951515174',
      password: 'Nematjonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56347',
      lastName: 'Rufatova',
      firstName: 'Bibisora Shuxrat qizi',
      dateOfBirth: '2000-11-03',
      phone: '+998951515175',
      password: 'Rufatova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S91729',
      lastName: 'Saynurdinova',
      firstName: 'Xonzodaxon Saidiskandar qizi',
      dateOfBirth: '2000-11-04',
      phone: '+998951515176',
      password: 'Saynurdinova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S38297',
      lastName: 'Fozilova',
      firstName: 'Robiya Abduraxmon qizi',
      dateOfBirth: '2000-11-05',
      phone: '+998951515177',
      password: 'Fozilova_suzuk',
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
