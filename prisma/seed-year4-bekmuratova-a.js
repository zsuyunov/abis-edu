const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S50425',
    lastName: 'Абдужабборова',
    firstName: 'Иймонахон Азаматовна',
    dateOfBirth: '2001-04-28',
    phone: '+998951515251',
    password: 'Абдужабборова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17479',
    lastName: 'Абдурахманова',
    firstName: 'Робияхон Азиз кизи',
    dateOfBirth: '2001-04-29',
    phone: '+998951515252',
    password: 'Абдурахманова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62946',
    lastName: 'Боймухамедова',
    firstName: 'Робия Отабек кизи',
    dateOfBirth: '2001-04-30',
    phone: '+998951515253',
    password: 'Боймухамедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39153',
    lastName: 'Жўраева',
    firstName: 'Сафия Дониёрбек қизи',
    dateOfBirth: '2001-05-01',
    phone: '+998951515254',
    password: 'Жўраева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56837',
    lastName: 'Ибодуллаева',
    firstName: 'Мубина Абдурахмон кизи',
    dateOfBirth: '2001-05-02',
    phone: '+998951515255',
    password: 'Ибодуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48309',
    lastName: 'Илхомова',
    firstName: 'Муслима Исмоил кизи',
    dateOfBirth: '2001-05-03',
    phone: '+998951515256',
    password: 'Илхомова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71593',
    lastName: 'Ирисбоева',
    firstName: 'Самира Ёдгор кизи',
    dateOfBirth: '2001-05-04',
    phone: '+998951515257',
    password: 'Ирисбоева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24734',
    lastName: 'Мирдадаева',
    firstName: 'Солиха Илхом кизи',
    dateOfBirth: '2001-05-05',
    phone: '+998951515258',
    password: 'Мирдадаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85967',
    lastName: 'Нурназарова',
    firstName: 'Зейнеп Искендер кизи',
    dateOfBirth: '2001-05-06',
    phone: '+998951515259',
    password: 'Нурназарова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50428',
    lastName: 'Одилбекова',
    firstName: 'Муниса Умар кизи',
    dateOfBirth: '2001-05-07',
    phone: '+998951515260',
    password: 'Одилбекова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17482',
    lastName: 'Собиржонова',
    firstName: 'Муслима Дилшод кизи',
    dateOfBirth: '2001-05-08',
    phone: '+998951515261',
    password: 'Собиржонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62949',
    lastName: 'Убайдуллаева',
    firstName: 'Робия Асатулла кизи',
    dateOfBirth: '2001-05-09',
    phone: '+998951515262',
    password: 'Убайдуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39156',
    lastName: 'Шамсутдинова',
    firstName: 'Иймона Бобур кизи',
    dateOfBirth: '2001-05-10',
    phone: '+998951515263',
    password: 'Шамсутдинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56840',
    lastName: 'Юсупова',
    firstName: 'Оминахон Нуриддин кизи',
    dateOfBirth: '2001-05-11',
    phone: '+998951515264',
    password: 'Юсупова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48312',
    lastName: 'Содикжонова',
    firstName: 'Маликахон Мухаммадали кизи',
    dateOfBirth: '2001-05-12',
    phone: '+998951515265',
    password: 'Содикжонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71596',
    lastName: 'Шавкатова',
    firstName: 'Робия Дониёр кизи',
    dateOfBirth: '2001-05-13',
    phone: '+998951515266',
    password: 'Шавкатова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24737',
    lastName: 'Турсунова',
    firstName: 'Мунаввархон Лазиз кизи',
    dateOfBirth: '2001-05-14',
    phone: '+998951515267',
    password: 'Турсунова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85970',
    lastName: 'Махмуджонова',
    firstName: 'Фарзона Шохрух кизи',
    dateOfBirth: '2001-05-15',
    phone: '+998951515268',
    password: 'Махмуджонова_suzuk',
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
    console.log('🌱 Starting Year 4-"А"Бекмуратова Нигора Махаматовна class and students seeding...');

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
    const className = '4-"А"Бекмуратова Нигора Махаматовна';
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
