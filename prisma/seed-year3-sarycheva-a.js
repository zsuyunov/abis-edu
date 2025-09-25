const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S62955',
    lastName: 'Абдужабборова',
    firstName: 'Аслия Абдужамол кизи',
    dateOfBirth: '2001-05-27',
    phone: '+998951515280',
    password: 'Абдужабборова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39162',
    lastName: 'Абдумажидова',
    firstName: 'Эъзоза Абдурауф кизи',
    dateOfBirth: '2001-05-28',
    phone: '+998951515281',
    password: 'Абдумажидова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56846',
    lastName: 'Абдурахимова',
    firstName: 'Марям Хуршидовна',
    dateOfBirth: '2001-05-29',
    phone: '+998951515282',
    password: 'Абдурахимова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48318',
    lastName: 'Аблахатова',
    firstName: 'Сафина Бехзод кизи',
    dateOfBirth: '2001-05-30',
    phone: '+998951515283',
    password: 'Аблахатова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71602',
    lastName: 'Азамова',
    firstName: 'Амина Элмуродовна',
    dateOfBirth: '2001-05-31',
    phone: '+998951515284',
    password: 'Азамова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24743',
    lastName: 'Арифхаджаева',
    firstName: 'Робияхон Арифхаджаевна',
    dateOfBirth: '2001-06-01',
    phone: '+998951515285',
    password: 'Арифхаджаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85976',
    lastName: 'Бекпулатова',
    firstName: 'Захро Санжарбек кизи',
    dateOfBirth: '2001-06-02',
    phone: '+998951515286',
    password: 'Бекпулатова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50437',
    lastName: 'Боймухаммедова',
    firstName: 'Солиха Отабек қизи',
    dateOfBirth: '2001-06-03',
    phone: '+998951515287',
    password: 'Боймухаммедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17491',
    lastName: 'Вахобова',
    firstName: 'Сафия Сайдакбар қизи',
    dateOfBirth: '2001-06-04',
    phone: '+998951515288',
    password: 'Вахобова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62958',
    lastName: 'Назарова',
    firstName: 'Зиеда Олимжон кизи',
    dateOfBirth: '2001-06-05',
    phone: '+998951515289',
    password: 'Назарова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39165',
    lastName: 'Нематуллаева',
    firstName: 'Раййонахон Самандар кизи',
    dateOfBirth: '2001-06-06',
    phone: '+998951515290',
    password: 'Нематуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56849',
    lastName: 'Орифжонова',
    firstName: 'Осиё Собиржон кизи',
    dateOfBirth: '2001-06-07',
    phone: '+998951515291',
    password: 'Орифжонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48321',
    lastName: 'Раҳимхонова',
    firstName: 'Зайнабхон Акбархон қизи',
    dateOfBirth: '2001-06-08',
    phone: '+998951515292',
    password: 'Раҳимхонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71605',
    lastName: 'Убайдуллаева',
    firstName: 'Фарзона Шерзодовна',
    dateOfBirth: '2001-06-09',
    phone: '+998951515293',
    password: 'Убайдуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24746',
    lastName: 'Хайруллаева',
    firstName: 'Солиха Аббосжон кизи',
    dateOfBirth: '2001-06-10',
    phone: '+998951515294',
    password: 'Хайруллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85979',
    lastName: 'Хакимова',
    firstName: 'Мухсина Комиловна',
    dateOfBirth: '2001-06-11',
    phone: '+998951515295',
    password: 'Хакимова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50440',
    lastName: 'Шамсутдинова',
    firstName: 'Бибисора Бобуровна',
    dateOfBirth: '2001-06-12',
    phone: '+998951515296',
    password: 'Шамсутдинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17494',
    lastName: 'Шухратова',
    firstName: 'Райхона Акмал кизи',
    dateOfBirth: '2001-06-13',
    phone: '+998951515297',
    password: 'Шухратова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62961',
    lastName: 'Умаржонова',
    firstName: 'Бибисора Насруллохон кизи',
    dateOfBirth: '2001-06-14',
    phone: '+998951515298',
    password: 'Умаржонова_suzuk',
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
    console.log('🌱 Starting Year 3-"А"Сарычева Диля Гарифовна class and students seeding...');

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
    const className = '3-"А"Сарычева Диля Гарифовна';
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
