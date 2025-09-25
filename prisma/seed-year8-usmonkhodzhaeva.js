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
  console.log('🌱 Starting Year 8-"V" Усмонходжаева Дилором Саидкаримовна class and students seeding...');

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
    where: { name: '8-"V" Усмонходжаева Дилором Саидкаримовна' },
    update: {
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 17, // Number of students in the data
    },
    create: {
      name: '8-"V" Усмонходжаева Дилором Саидкаримовна',
      branchId: branch.id,
      academicYearId: academicYear.id,
      capacity: 17,
      status: ClassStatus.ACTIVE,
      educationType: ClassEducationType.SECONDARY,
      language: ClassLanguage.UZBEK,
    },
  });
  console.log(`✅ Created/Updated class: ${createdClass.name} (ID: ${createdClass.id})`);

  // Student data
  const studentsData = [
    {
      studentId: 'S72846',
      lastName: 'Raimova',
      firstName: 'Mashhurabonu Kamoliddin qizi',
      dateOfBirth: '2000-12-11',
      phone: '+998951515113',
      password: 'Raimova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S15910',
      lastName: 'Abdurahimova',
      firstName: 'Munisaxon Abrol qizi',
      dateOfBirth: '2000-12-12',
      phone: '+998951515114',
      password: 'Abdurahimova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S48270',
      lastName: 'Azimjonova',
      firstName: 'Mubina Ulug\'bek qizi',
      dateOfBirth: '2000-12-13',
      phone: '+998951515115',
      password: 'Azimjonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S63498',
      lastName: 'Xolmaxmatova',
      firstName: 'Osiyo Abduxalil qizi',
      dateOfBirth: '2000-12-14',
      phone: '+998951515116',
      password: 'Xolmaxmatova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S37515',
      lastName: 'Imomaliyeva',
      firstName: 'Orastaxon Ravshanbek qizi',
      dateOfBirth: '2000-12-15',
      phone: '+998951515117',
      password: 'Imomaliyeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S89630',
      lastName: 'Mirxaydarova',
      firstName: 'Muslima Miraziz qizi',
      dateOfBirth: '2000-12-16',
      phone: '+998951515118',
      password: 'Mirxaydarova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24090',
      lastName: 'Mirzayeva',
      firstName: 'Mashxura Xasan qizi',
      dateOfBirth: '2000-12-17',
      phone: '+998951515119',
      password: 'Mirzayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S56350',
      lastName: 'Solixova',
      firstName: 'Sora Rustam qizi',
      dateOfBirth: '2000-12-18',
      phone: '+998951515120',
      password: 'Solixova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S91732',
      lastName: 'Toxirova',
      firstName: 'Mo\'mina Orif qizi',
      dateOfBirth: '2000-12-19',
      phone: '+998951515121',
      password: 'Toxirova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S38299',
      lastName: 'Turdimurodova',
      firstName: 'Muslimakhon Shuxrat qizi',
      dateOfBirth: '2000-12-20',
      phone: '+998951515122',
      password: 'Turdimurodova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S71551',
      lastName: 'Zoirova',
      firstName: 'Azizaxon Zafar qizi',
      dateOfBirth: '2000-12-21',
      phone: '+998951515123',
      password: 'Zoirova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S24692',
      lastName: 'Shamaxmudova',
      firstName: 'Muslima Shoaxmad qizi',
      dateOfBirth: '2000-12-22',
      phone: '+998951515124',
      password: 'Shamaxmudova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S85925',
      lastName: 'Kadirova',
      firstName: 'Muslima Dilmurodovna',
      dateOfBirth: '2000-12-23',
      phone: '+998951515125',
      password: 'Kadirova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S50386',
      lastName: 'Shavkatova',
      firstName: 'Muxarram Shuxrat qizi',
      dateOfBirth: '2000-12-24',
      phone: '+998951515126',
      password: 'Shavkatova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S17440',
      lastName: 'Qobiljonova',
      firstName: 'Muzayana Farxod qizi',
      dateOfBirth: '2000-12-25',
      phone: '+998951515127',
      password: 'Qobiljonova_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S62907',
      lastName: 'Abdullayeva',
      firstName: 'Mubinaxon Soxibxon qizi',
      dateOfBirth: '2000-12-26',
      phone: '+998951515128',
      password: 'Abdullayeva_suzuk',
      gender: 'FEMALE',
      status: 'ACTIVE'
    },
    {
      studentId: 'S39114',
      lastName: 'Erkinova',
      firstName: 'Dilsora Baxodir qizi',
      dateOfBirth: '2000-12-27',
      phone: '+998951515129',
      password: 'Erkinova_suzuk',
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
