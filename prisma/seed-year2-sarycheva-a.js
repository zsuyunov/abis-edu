const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S50443',
    lastName: 'Раимова',
    firstName: 'Мавлюдабону Камолиддин кизи',
    dateOfBirth: '2001-06-21',
    phone: '+998951515305',
    password: 'Раимова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17497',
    lastName: 'Азимжонова',
    firstName: 'Самия Улугбек кизи',
    dateOfBirth: '2001-06-22',
    phone: '+998951515306',
    password: 'Азимжонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62964',
    lastName: 'Бахтиярова',
    firstName: 'Имона Шерзодовна',
    dateOfBirth: '2001-06-23',
    phone: '+998951515307',
    password: 'Бахтиярова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39171',
    lastName: 'Бекмухамедова',
    firstName: 'Румайсо Бекзод кизи',
    dateOfBirth: '2001-06-24',
    phone: '+998951515308',
    password: 'Бекмухамедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56855',
    lastName: 'Жаффархонова',
    firstName: 'Диора Дилмурод кизи',
    dateOfBirth: '2001-06-25',
    phone: '+998951515309',
    password: 'Жаффархонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48327',
    lastName: 'Комилова',
    firstName: 'София Акромжон кизи',
    dateOfBirth: '2001-06-26',
    phone: '+998951515310',
    password: 'Комилова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71611',
    lastName: 'Мирдадаева',
    firstName: 'София Илхом кизи',
    dateOfBirth: '2001-06-27',
    phone: '+998951515311',
    password: 'Мирдадаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24752',
    lastName: 'Тохиржонова',
    firstName: 'Сакина Исмоил кизи',
    dateOfBirth: '2001-06-28',
    phone: '+998951515312',
    password: 'Тохиржонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85985',
    lastName: 'Тохирова',
    firstName: 'Иймона Орифовна',
    dateOfBirth: '2001-06-29',
    phone: '+998951515313',
    password: 'Тохирова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50446',
    lastName: 'Тохирова',
    firstName: 'Солиха Усмонжон кизи',
    dateOfBirth: '2001-06-30',
    phone: '+998951515314',
    password: 'Тохирова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17500',
    lastName: 'Холмахматова',
    firstName: 'Иймона Абдухалил кизи',
    dateOfBirth: '2001-07-01',
    phone: '+998951515315',
    password: 'Холмахматова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62967',
    lastName: 'Эркинова',
    firstName: 'Ханифа Муроджон кизи',
    dateOfBirth: '2001-07-02',
    phone: '+998951515316',
    password: 'Эркинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39174',
    lastName: 'Аскарова',
    firstName: 'Саодатхон Хикматжон кизи',
    dateOfBirth: '2001-07-03',
    phone: '+998951515317',
    password: 'Аскарова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56858',
    lastName: 'Sobirova',
    firstName: 'Rumayso Bekzod qizi',
    dateOfBirth: '2001-07-04',
    phone: '+998951515318',
    password: 'Sobirova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48330',
    lastName: 'Muhammedova',
    firstName: 'Xilola Sunatilla qizi',
    dateOfBirth: '2001-07-05',
    phone: '+998951515319',
    password: 'Muhammedova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71614',
    lastName: 'Sultonova',
    firstName: 'Madinabonu Samandar qizi',
    dateOfBirth: '2001-07-06',
    phone: '+998951515320',
    password: 'Sultonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  }
];

// Function to generate unique student ID
async function generateUniqueStudentId(originalId) {
  let newId = originalId;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.student.findUnique({
      where: { studentId: newId }
    });
    
    if (!existing) {
      return newId;
    }
    
    // Replace last 2 digits with counter (01, 02, 03, etc.)
    const baseId = originalId.substring(0, 3);
    newId = `${baseId}${counter.toString().padStart(2, '0')}`;
    counter++;
    
    if (counter > 99) {
      // If we can't find a unique ID, generate a completely random one
      const randomNum = Math.floor(Math.random() * 90000) + 10000;
      newId = `S${randomNum}`;
    }
  }
}

// Function to generate unique phone number
async function generateUniquePhone(originalPhone) {
  let newPhone = originalPhone;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.student.findFirst({
      where: { phone: newPhone }
    });
    
    if (!existing) {
      return newPhone;
    }
    
    // Generate random Uzbek phone number
    const randomNum = Math.floor(Math.random() * 90000000) + 10000000;
    newPhone = `+9989${randomNum}`;
  }
}

async function main() {
  try {
    console.log('🌱 Starting Year 2"А"Сарычева Диля Гарифовна class and students seeding...');

    // Find branch and academic year
    const branch = await prisma.branch.findFirst({
      where: { shortName: 'Suzuk' }
    });

    if (!branch) {
      throw new Error('Branch "Suzuk" not found');
    }
    console.log(`✅ Found branch: ${branch.legalName} (ID: ${branch.id})`);

    const academicYear = await prisma.academicYear.findFirst({
      where: { name: '2025-2026' }
    });

    if (!academicYear) {
      throw new Error('Academic year "2025-2026" not found');
    }
    console.log(`✅ Found academic year: ${academicYear.name} (ID: ${academicYear.id})`);

    // Create or find class
    const className = '2"А"Сарычева Диля Гарифовна';
    let classRecord = await prisma.class.findFirst({
      where: {
        name: className,
        branchId: branch.id,
        academicYearId: academicYear.id
      }
    });

    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: {
          name: className,
          branchId: branch.id,
          academicYearId: academicYear.id,
          capacity: studentsData.length,
          educationType: 'PRIMARY',
          language: 'UZBEK',
          status: 'ACTIVE'
        }
      });
      console.log(`✅ Created class: ${className} (ID: ${classRecord.id})`);
    } else {
      console.log(`✅ Found existing class: ${className} (ID: ${classRecord.id})`);
    }

    // Process students
    console.log(`📚 Processing ${studentsData.length} students...`);
    let createdCount = 0;
    let errorCount = 0;

    for (const studentData of studentsData) {
      try {
        // Generate unique student ID
        const uniqueStudentId = await generateUniqueStudentId(studentData.studentId);
        if (uniqueStudentId !== studentData.studentId) {
          console.log(`⚠️  Student ID changed: ${studentData.studentId} → ${uniqueStudentId}`);
        }

        // Generate unique phone number
        const uniquePhone = await generateUniquePhone(studentData.phone);
        if (uniquePhone !== studentData.phone) {
          console.log(`📱 Generated phone: ${uniquePhone} for ${studentData.firstName} ${studentData.lastName}`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        // Create student
        const student = await prisma.student.create({
          data: {
            id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: uniqueStudentId,
            lastName: studentData.lastName,
            firstName: studentData.firstName,
            dateOfBirth: new Date(studentData.dateOfBirth),
            phone: uniquePhone,
            password: hashedPassword,
            gender: studentData.gender,
            status: studentData.status,
            branchId: branch.id,
            classId: classRecord.id
          }
        });

        console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${student.studentId})`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating student ${studentData.firstName} ${studentData.lastName}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Students created: ${createdCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📚 Total processed: ${studentsData.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 All students created successfully!');
    } else {
      console.log(`\n⚠️  ${errorCount} students failed to create.`);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
